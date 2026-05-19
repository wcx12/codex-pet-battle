import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveCodexHomePath } from "../codexHomeResolver.js";
import { DEFAULT_ACTIVE_PET_ID } from "../constants.js";
import { UserFacingError } from "../errors.js";

export const DEFAULT_DASHBOARD_PET_ID = DEFAULT_ACTIVE_PET_ID;
const PET_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const SPRITESHEET_FILE_NAME = "spritesheet.webp";

export interface DashboardPetAssetOptions {
  cliCodexHome?: string;
  petId?: string;
  petAssetRoot?: string;
}

export interface DashboardPetManifest {
  id: string;
  displayName: string;
  description: string;
  spritesheetUrl: string;
  atlas: {
    columns: 8;
    rows: 9;
    cellWidth: 192;
    cellHeight: 208;
  };
}

export interface DashboardPetPackage {
  manifest: DashboardPetManifest;
  spritesheetPath: string;
}

export interface DashboardPetCatalog {
  defaultPetId: string;
  pets: DashboardPetManifest[];
}

interface RawPetManifest {
  id?: unknown;
  displayName?: unknown;
  description?: unknown;
  spritesheetPath?: unknown;
}

export async function loadDashboardPetPackage(
  options: DashboardPetAssetOptions = {}
): Promise<DashboardPetPackage | null> {
  const petId = normalizePetId(options.petId);
  const packageDirs = petPackageCandidates(options, petId);

  for (const packageDir of packageDirs) {
    const petPackage = await loadPetPackageFromDirectory(packageDir, petId);
    if (petPackage !== null) {
      return petPackage;
    }
  }

  return null;
}

export async function listDashboardPetPackages(
  options: DashboardPetAssetOptions = {}
): Promise<DashboardPetCatalog> {
  const roots = petAssetRoots(options);
  const seenPetIds = new Set<string>();
  const pets: DashboardPetManifest[] = [];

  for (const root of roots) {
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory() || !PET_ID_PATTERN.test(entry.name) || seenPetIds.has(entry.name)) {
        continue;
      }

      try {
        const petPackage = await loadPetPackageFromDirectory(path.join(root, entry.name), entry.name);
        if (petPackage !== null) {
          seenPetIds.add(entry.name);
          pets.push(petPackage.manifest);
        }
      } catch {
        // Invalid pet packages are skipped from the catalog so the dashboard can still load.
      }
    }
  }

  return {
    defaultPetId: DEFAULT_DASHBOARD_PET_ID,
    pets
  };
}

export async function readDashboardPetSpritesheet(petPackage: DashboardPetPackage): Promise<Buffer> {
  try {
    return await readFile(petPackage.spritesheetPath);
  } catch {
    throw new UserFacingError("Pet spritesheet is unavailable.");
  }
}

function normalizePetId(rawPetId: string | undefined): string {
  const petId = rawPetId ?? DEFAULT_DASHBOARD_PET_ID;
  if (!PET_ID_PATTERN.test(petId)) {
    throw new UserFacingError("Pet id must be a safe slug.");
  }
  return petId;
}

function petPackageCandidates(options: DashboardPetAssetOptions, petId: string): string[] {
  return petAssetRoots(options).map((root) => path.resolve(root, petId));
}

function petAssetRoots(options: DashboardPetAssetOptions): string[] {
  return options.petAssetRoot
    ? [path.resolve(options.petAssetRoot)]
    : [...projectAssetRoots(), path.join(resolveCodexHomePath({ cliCodexHome: options.cliCodexHome }), "pets")];
}

function projectAssetRoots(): string[] {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.resolve(process.cwd(), "assets/pets"),
    path.resolve(moduleDir, "../../assets/pets")
  ];
}

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }
    throw new UserFacingError(`Could not read pet package.`);
  }
}

async function loadPetPackageFromDirectory(
  packageDir: string,
  expectedPetId: string
): Promise<DashboardPetPackage | null> {
  const manifestPath = path.join(packageDir, "pet.json");
  const raw = await readOptionalFile(manifestPath);
  if (raw === null) {
    return null;
  }

  return await parsePetPackage(raw, packageDir, expectedPetId);
}

async function parsePetPackage(
  raw: string,
  packageDir: string,
  expectedPetId: string
): Promise<DashboardPetPackage> {
  let parsed: RawPetManifest;
  try {
    parsed = JSON.parse(raw) as RawPetManifest;
  } catch {
    throw new UserFacingError("Pet manifest is not valid JSON.");
  }

  if (
    typeof parsed.id !== "string" ||
    typeof parsed.displayName !== "string" ||
    typeof parsed.description !== "string" ||
    typeof parsed.spritesheetPath !== "string"
  ) {
    throw new UserFacingError("Pet manifest is missing required fields.");
  }

  if (parsed.id !== expectedPetId || !PET_ID_PATTERN.test(parsed.id)) {
    throw new UserFacingError("Pet manifest id does not match the requested pet.");
  }

  if (
    path.isAbsolute(parsed.spritesheetPath) ||
    path.basename(parsed.spritesheetPath) !== parsed.spritesheetPath ||
    parsed.spritesheetPath !== SPRITESHEET_FILE_NAME
  ) {
    throw new UserFacingError("Pet spritesheet path is not allowed.");
  }

  const spritesheetPath = path.resolve(packageDir, parsed.spritesheetPath);
  if (!isInsideDirectory(spritesheetPath, path.resolve(packageDir))) {
    throw new UserFacingError("Pet spritesheet path is outside the pet package.");
  }
  const safeSpritesheetPath = await validateSpritesheetPath(spritesheetPath, packageDir);

  return {
    manifest: {
      id: parsed.id,
      displayName: parsed.displayName,
      description: parsed.description,
      spritesheetUrl: `/pet/${encodeURIComponent(parsed.id)}/spritesheet.webp`,
      atlas: {
        columns: 8,
        rows: 9,
        cellWidth: 192,
        cellHeight: 208
      }
    },
    spritesheetPath: safeSpritesheetPath
  };
}

async function validateSpritesheetPath(spritesheetPath: string, packageDir: string): Promise<string> {
  let packageRealPath: string;
  let spritesheetStat: Awaited<ReturnType<typeof lstat>>;
  let spritesheetRealPath: string;

  try {
    packageRealPath = await realpath(packageDir);
    spritesheetStat = await lstat(spritesheetPath);
    spritesheetRealPath = await realpath(spritesheetPath);
  } catch {
    throw new UserFacingError("Pet spritesheet is unavailable.");
  }

  if (spritesheetStat.isSymbolicLink()) {
    throw new UserFacingError("Pet spritesheet path is not allowed.");
  }

  if (!spritesheetStat.isFile()) {
    throw new UserFacingError("Pet spritesheet is unavailable.");
  }

  if (!isInsideDirectory(spritesheetRealPath, packageRealPath)) {
    throw new UserFacingError("Pet spritesheet path is outside the pet package.");
  }

  return spritesheetRealPath;
}

function isInsideDirectory(filePath: string, directory: string): boolean {
  const relative = path.relative(directory, filePath);
  return relative.length === 0 || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

import { stat } from "node:fs/promises";
import path from "node:path";

import { CODEX_HOME_ENV_VAR } from "./constants.js";
import { resolveCodexHomePath } from "./codexHomeResolver.js";
import { listDashboardPetPackages } from "./dashboard/dashboardPetAssets.js";
import { sanitizeErrorMessage } from "./privacy.js";
import { readPetState } from "./petStateStore.js";

export interface DoctorReport {
  checkedAt: string;
  ok: boolean;
  stateFileLabel: string;
  codexHome: {
    source: "cli" | "env" | "default";
    resolved: boolean;
    accessible: boolean;
    sessionsDirExists: boolean;
    error?: string;
  };
  state: {
    exists: boolean;
    readable: boolean;
    schemaVersion?: number;
    petLevel?: number;
    initialImportCompleted?: boolean;
    processedObservationCount?: number;
    error?: string;
  };
  pets: {
    availableCount: number;
    defaultPetAvailable: boolean;
    activePetIds: string[];
    error?: string;
  };
  warnings: string[];
}

export interface DoctorOptions {
  cliCodexHome?: string;
  stateFile: string;
  petAssetRoot?: string;
  now?: Date;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

export async function createDoctorReport(options: DoctorOptions): Promise<DoctorReport> {
  const checkedAt = (options.now ?? new Date()).toISOString();
  const codexHome = await inspectCodexHome(options);
  const state = await inspectStateFile(options.stateFile);
  const pets = await inspectPets(options);
  const warnings = collectWarnings(codexHome, state, pets);

  return {
    checkedAt,
    ok: warnings.length === 0,
    stateFileLabel: path.basename(options.stateFile),
    codexHome,
    state,
    pets,
    warnings
  };
}

async function inspectCodexHome(options: DoctorOptions): Promise<DoctorReport["codexHome"]> {
  let codexHomePath: string;

  try {
    codexHomePath = resolveCodexHomePath({
      cliCodexHome: options.cliCodexHome,
      env: options.env,
      platform: options.platform
    });
  } catch (error) {
    return {
      source: codexHomeSource(options),
      resolved: false,
      accessible: false,
      sessionsDirExists: false,
      error: sanitizeUnknownError(error)
    };
  }

  const accessible = await isDirectory(codexHomePath);
  const sessionsDirExists = accessible ? await isDirectory(path.join(codexHomePath, "sessions")) : false;

  return {
    source: codexHomeSource(options),
    resolved: true,
    accessible,
    sessionsDirExists,
    ...(accessible ? {} : { error: "Codex home is not accessible." })
  };
}

async function inspectStateFile(stateFile: string): Promise<DoctorReport["state"]> {
  const exists = await fileExists(stateFile);
  if (!exists) {
    return {
      exists: false,
      readable: false,
      error: "No local pet state file found yet."
    };
  }

  try {
    const state = await readPetState(stateFile);
    if (state === null) {
      return {
        exists: false,
        readable: false,
        error: "No local pet state file found yet."
      };
    }

    return {
      exists: true,
      readable: true,
      schemaVersion: state.schemaVersion,
      petLevel: state.pet.level,
      initialImportCompleted: state.economy.initialImportCompleted,
      processedObservationCount: state.processedObservations.length
    };
  } catch (error) {
    return {
      exists: true,
      readable: false,
      error: sanitizeUnknownError(error)
    };
  }
}

async function inspectPets(options: DoctorOptions): Promise<DoctorReport["pets"]> {
  try {
    const catalog = await listDashboardPetPackages({
      cliCodexHome: options.cliCodexHome,
      petAssetRoot: options.petAssetRoot
    });
    return {
      availableCount: catalog.pets.length,
      defaultPetAvailable: catalog.pets.some((pet) => pet.id === catalog.defaultPetId),
      activePetIds: catalog.pets.map((pet) => pet.id)
    };
  } catch (error) {
    return {
      availableCount: 0,
      defaultPetAvailable: false,
      activePetIds: [],
      error: sanitizeUnknownError(error)
    };
  }
}

function collectWarnings(
  codexHome: DoctorReport["codexHome"],
  state: DoctorReport["state"],
  pets: DoctorReport["pets"]
): string[] {
  const warnings: string[] = [];

  if (!codexHome.resolved || !codexHome.accessible) {
    warnings.push("Codex home is not accessible.");
  } else if (!codexHome.sessionsDirExists) {
    warnings.push("Codex sessions directory was not found.");
  }

  if (!state.exists) {
    warnings.push("Local pet state has not been created.");
  } else if (!state.readable) {
    warnings.push("Local pet state could not be read.");
  }

  if (pets.availableCount === 0) {
    warnings.push("No valid pet packages were found.");
  } else if (!pets.defaultPetAvailable) {
    warnings.push("Default pet package is not available.");
  }

  return warnings;
}

function codexHomeSource(options: DoctorOptions): DoctorReport["codexHome"]["source"] {
  if (options.cliCodexHome?.trim()) {
    return "cli";
  }

  const env = options.env ?? process.env;
  return env[CODEX_HOME_ENV_VAR]?.trim() ? "env" : "default";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(directory: string): Promise<boolean> {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

function sanitizeUnknownError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return sanitizeErrorMessage(message);
}

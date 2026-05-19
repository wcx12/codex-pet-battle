import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createDoctorReport } from "../src/diagnostics.js";
import { createDefaultPetState } from "../src/petStateStore.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("createDoctorReport", () => {
  it("summarizes local health without exposing absolute paths", async () => {
    const root = await makeTempDir();
    const codexHome = path.join(root, "codex-home");
    await mkdir(path.join(codexHome, "sessions"), { recursive: true });
    const stateFile = path.join(root, "pet_state.local.json");
    await writeFile(stateFile, JSON.stringify(createDefaultPetState()), "utf8");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);

    const report = await createDoctorReport({
      cliCodexHome: codexHome,
      stateFile,
      petAssetRoot,
      now: new Date("2026-05-07T12:00:00.000Z")
    });

    expect(report.ok).toBe(true);
    expect(report.codexHome).toMatchObject({
      source: "cli",
      resolved: true,
      accessible: true,
      sessionsDirExists: true
    });
    expect(report.state).toMatchObject({
      exists: true,
      readable: true,
      schemaVersion: 2,
      petLevel: 1
    });
    expect(report.pets).toMatchObject({
      availableCount: 1,
      defaultPetAvailable: true,
      activePetIds: ["pathy"]
    });
    expect(JSON.stringify(report)).not.toContain(root);
    expect(JSON.stringify(report)).not.toContain(codexHome);
  });

  it("returns warnings for missing local pieces", async () => {
    const root = await makeTempDir();
    const report = await createDoctorReport({
      cliCodexHome: path.join(root, "missing-codex-home"),
      stateFile: path.join(root, "missing-state.local.json"),
      petAssetRoot: path.join(root, "missing-pets")
    });

    expect(report.ok).toBe(false);
    expect(report.codexHome.accessible).toBe(false);
    expect(report.state.exists).toBe(false);
    expect(report.pets.availableCount).toBe(0);
    expect(report.warnings).toContain("Codex home is not accessible.");
    expect(report.warnings).toContain("Local pet state has not been created.");
    expect(report.warnings).toContain("No valid pet packages were found.");
    expect(JSON.stringify(report)).not.toContain(root);
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-doctor-"));
  tempDirs.push(dir);
  return dir;
}

async function createPetPackage(petAssetRoot: string): Promise<void> {
  const petDir = path.join(petAssetRoot, "pathy");
  await mkdir(petDir, { recursive: true });
  await writeFile(
    path.join(petDir, "pet.json"),
    JSON.stringify({
      id: "pathy",
      displayName: "Pathy",
      description: "A tiny teal pathfinder companion.",
      spritesheetPath: "spritesheet.webp"
    }),
    "utf8"
  );
  await writeFile(path.join(petDir, "spritesheet.webp"), Buffer.from("RIFFwebp"));
}

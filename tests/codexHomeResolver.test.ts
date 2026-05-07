import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CODEX_HOME_ENV_VAR } from "../src/constants.js";
import { resolveCodexHome, resolveCodexHomePath } from "../src/codexHomeResolver.js";
import { UserFacingError } from "../src/errors.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveCodexHomePath", () => {
  it("prefers CLI path over env and defaults", () => {
    const result = resolveCodexHomePath({
      cliCodexHome: "from-cli",
      env: { [CODEX_HOME_ENV_VAR]: "from-env", USERPROFILE: "from-user" },
      platform: "win32"
    });

    expect(result).toBe(path.resolve("from-cli"));
  });

  it("uses env override when CLI path is absent", () => {
    const result = resolveCodexHomePath({
      env: { [CODEX_HOME_ENV_VAR]: "from-env", USERPROFILE: "from-user" },
      platform: "win32"
    });

    expect(result).toBe(path.resolve("from-env"));
  });

  it("uses the Windows default from USERPROFILE", () => {
    const result = resolveCodexHomePath({
      env: { USERPROFILE: path.join("C:", "Users", "tester") },
      platform: "win32"
    });

    expect(result).toBe(path.resolve(path.join("C:", "Users", "tester", ".codex")));
  });

  it("uses the POSIX default from HOME", () => {
    const result = resolveCodexHomePath({
      env: { HOME: "/home/tester" },
      platform: "linux"
    });

    expect(result).toBe(path.resolve("/home/tester/.codex"));
  });
});

describe("resolveCodexHome", () => {
  it("returns an existing directory", async () => {
    const codexHome = await makeTempDir();

    await expect(resolveCodexHome({ cliCodexHome: codexHome })).resolves.toBe(codexHome);
  });

  it("fails when the path does not exist", async () => {
    const missing = path.join(await makeTempDir(), "missing");

    await expect(resolveCodexHome({ cliCodexHome: missing })).rejects.toThrow(UserFacingError);
  });

  it("fails when the path is not a directory", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, "codex-home.txt");
    await writeFile(file, "not a directory", "utf8");

    await expect(resolveCodexHome({ cliCodexHome: file })).rejects.toThrow(UserFacingError);
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-battle-"));
  tempDirs.push(dir);
  return dir;
}

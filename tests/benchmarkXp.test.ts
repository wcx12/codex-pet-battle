import { access, mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("benchmark_xp", () => {
  it("prints sanitized benchmark output without writing state", async () => {
    const fixtureCodexHome = path.resolve("tests/fixtures/codex-home-basic");
    const tempDir = await makeTempDir();
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        path.resolve("node_modules/tsx/dist/cli.mjs"),
        path.resolve("scripts/benchmark_xp.ts"),
        "--codex-home",
        fixtureCodexHome,
        "--recent-days",
        "30"
      ],
      { cwd: tempDir, env: process.env }
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("Codex Pet Battle XP Benchmark");
    expect(stdout).toContain("Candidate: candidate-0-mvp-baseline");
    expect(stdout).toContain("Candidate: candidate-2-output-focused");
    expect(stdout).toContain("Daily XP:");
    expect(stdout).toContain("Weekly XP:");
    expect(stdout).toContain("Level calculation: floors fractional final XP");
    expect(stdout).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(stdout).not.toContain("TOOL_OUTPUT_SHOULD_NOT_LEAK");
    expect(stdout).not.toContain("sk-test-privacy");
    await expect(fileExists(path.join(tempDir, "pet_state.local.json"))).resolves.toBe(false);
  });

  it("prints sanitized JSON output", async () => {
    const fixtureCodexHome = path.resolve("tests/fixtures/codex-home-basic");
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        path.resolve("node_modules/tsx/dist/cli.mjs"),
        path.resolve("scripts/benchmark_xp.ts"),
        "--codex-home",
        fixtureCodexHome,
        "--recent-days",
        "30",
        "--json"
      ],
      { cwd: process.cwd(), env: process.env }
    );

    const parsed = JSON.parse(stdout) as { results: unknown[] };
    expect(parsed.results.length).toBeGreaterThanOrEqual(5);
    expect(stdout).toContain("dailyBuckets");
    expect(stdout).toContain("weeklyBuckets");
    expect(stdout).not.toContain(fixtureCodexHome);
    expect(stdout).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
  });

  it("prints help without resolving Codex home", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [path.resolve("node_modules/tsx/dist/cli.mjs"), path.resolve("scripts/benchmark_xp.ts"), "--help"],
      {
        cwd: await makeTempDir(),
        env: {
          ...process.env,
          USERPROFILE: "",
          HOME: ""
        }
      }
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("Codex Pet Battle XP Benchmark");
    expect(stdout).toContain("--recent-days <days>");
  });

  it("sanitizes user-facing path errors", async () => {
    const missingPath = path.resolve("C:/Users/example/secret-codex-home");
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        path.resolve("node_modules/tsx/dist/cli.mjs"),
        path.resolve("scripts/benchmark_xp.ts"),
        "--codex-home",
        missingPath
      ],
      {
        cwd: await makeTempDir(),
        env: process.env
      }
    ).catch((error: unknown) => {
      const execError = error as { stdout: string; stderr: string };
      return { stdout: execError.stdout, stderr: execError.stderr };
    });

    expect(stdout).toBe("");
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("[path]");
    expect(stderr).not.toContain("secret-codex-home");
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-benchmark-"));
  tempDirs.push(dir);
  return dir;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

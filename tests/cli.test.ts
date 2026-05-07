import { access, appendFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

const tempDirs: string[] = [];

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("cli", () => {
  it("prints help with dashboard command", async () => {
    const result = await runCliForTest(["help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("codex-pet-battle dashboard");
    expect(result.stdout).toContain("--auto-scan");
    expect(result.stdout).toContain("Start the local dashboard");
  });

  it("scans synthetic Codex logs, writes state, and avoids duplicate XP", async () => {
    const root = await makeTempDir();
    const codexHome = await createCodexHome(root, [
      tokenCountLine("2026-05-07T00:00:00.000Z", {
        input_tokens: 1000,
        cached_input_tokens: 0,
        output_tokens: 250,
        reasoning_output_tokens: 250,
        total_tokens: 1500
      }),
      JSON.stringify({
        type: "response_item",
        payload: {
          text: "SECRET_PROMPT_SHOULD_NOT_LEAK sk-test-privacy"
        }
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");

    const first = await runCliForTest(["scan", "--codex-home", codexHome, "--state-file", stateFile]);
    expect(first.code).toBe(0);
    expect(first.stdout).toContain("Dry run: no");
    expect(first.stdout).toContain("Economy: hard-v1");
    expect(first.stdout).toContain("Import applied: profile-only");
    expect(first.stdout).toContain("Final XP after import rules: 0");
    expect(first.stdout).toContain("XP gained: 0");
    expect(first.stdout).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(first.stderr).toBe("");

    const firstState = await readFile(stateFile, "utf8");
    const parsedFirstState = JSON.parse(firstState);
    expect(parsedFirstState.schemaVersion).toBe(2);
    expect(parsedFirstState.pet.xp).toBe(0);
    expect(parsedFirstState.economy.initialImportCompleted).toBe(true);
    expect(parsedFirstState.economy.dailyXpLedger["2026-05-07"]).toBeCloseTo(0.045667);
    expect(parsedFirstState.economy.weeklyXpLedger["2026-05-04"]).toBeCloseTo(0.045667);
    expect(firstState).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(firstState).not.toContain(codexHome);

    const second = await runCliForTest(["scan", "--codex-home", codexHome, "--state-file", stateFile]);
    expect(second.code).toBe(0);
    expect(second.stdout).toContain("XP gained: 0");

    const secondState = await readFile(stateFile, "utf8");
    expect(secondState).toBe(firstState);
  });

  it("supports dry-run scans without creating or modifying state", async () => {
    const root = await makeTempDir();
    const codexHome = await createCodexHome(root, [
      tokenCountLine("2026-05-07T00:00:00.000Z", {
        input_tokens: 1000,
        cached_input_tokens: 0,
        output_tokens: 250,
        reasoning_output_tokens: 250,
        total_tokens: 1500
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");

    const firstDryRun = await runCliForTest([
      "scan",
      "--codex-home",
      codexHome,
      "--state-file",
      stateFile,
      "--dry-run"
    ]);

    expect(firstDryRun.code).toBe(0);
    expect(firstDryRun.stdout).toContain("Dry run complete");
    expect(firstDryRun.stdout).toContain("Dry run: yes");
    expect(firstDryRun.stdout).toContain("Import applied: profile-only");
    expect(firstDryRun.stdout).toContain("XP gained: 0");
    await expect(fileExists(stateFile)).resolves.toBe(false);

    await runCliForTest(["scan", "--codex-home", codexHome, "--state-file", stateFile]);
    const before = await readFile(stateFile, "utf8");
    const beforeStat = await stat(stateFile);
    await appendCodexSession(
      codexHome,
      tokenCountLine("2026-05-07T01:00:00.000Z", {
        input_tokens: 0,
        cached_input_tokens: 0,
        output_tokens: 12000,
        reasoning_output_tokens: 0,
        total_tokens: 12000
      })
    );

    const secondDryRun = await runCliForTest([
      "scan",
      "--codex-home",
      codexHome,
      "--state-file",
      stateFile,
      "--dry-run"
    ]);

    expect(secondDryRun.code).toBe(0);
    expect(secondDryRun.stdout).toContain("New observations: 1");
    expect(secondDryRun.stdout).toContain("Import mode: none");
    expect(secondDryRun.stdout).toContain("XP gained: 1");
    expect(await readFile(stateFile, "utf8")).toBe(before);
    expect((await stat(stateFile)).mtimeMs).toBe(beforeStat.mtimeMs);
  });

  it("limits scan activity to recent days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-07T12:00:00.000Z"));
    const root = await makeTempDir();
    const codexHome = await createCodexHome(root, [
      tokenCountLine("2026-05-06T11:59:59.999Z", {
        input_tokens: 100000,
        cached_input_tokens: 0,
        output_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 100000
      }),
      tokenCountLine("2026-05-06T12:00:00.000Z", {
        input_tokens: 1000,
        cached_input_tokens: 0,
        output_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 1000
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");

    const result = await runCliForTest([
      "scan",
      "--codex-home",
      codexHome,
      "--state-file",
      stateFile,
      "--recent-days",
      "1",
      "--dry-run"
    ]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Recent days: 1");
    expect(result.stdout).toContain("New observations: 1");
    expect(result.stdout).toContain("Import applied: profile-only");
    expect(result.stdout).toContain("XP gained: 0");
    await expect(fileExists(stateFile)).resolves.toBe(false);
  });

  it("prints status without modifying state", async () => {
    const root = await makeTempDir();
    const codexHome = await createCodexHome(root, [
      tokenCountLine("2026-05-07T00:00:00.000Z", {
        input_tokens: 1000,
        cached_input_tokens: 0,
        output_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 1000
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");
    await runCliForTest(["scan", "--codex-home", codexHome, "--state-file", stateFile]);
    const before = await readFile(stateFile, "utf8");
    const beforeStat = await stat(stateFile);

    const statusResult = await runCliForTest(["status", "--state-file", stateFile]);

    expect(statusResult.code).toBe(0);
    expect(statusResult.stdout).toContain("Pet status");
    expect(statusResult.stdout).toContain("Level: 1");
    expect(statusResult.stdout).toContain("XP: 0/100");
    expect(await readFile(stateFile, "utf8")).toBe(before);
    expect((await stat(stateFile)).mtimeMs).toBe(beforeStat.mtimeMs);
  });

  it("returns a user-facing error for a missing Codex home", async () => {
    const root = await makeTempDir();
    const missingHome = path.join(root, "missing codex home");
    const stateFile = path.join(root, "pet_state.local.json");

    const result = await runCliForTest(["scan", "--codex-home", missingHome, "--state-file", stateFile]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Codex home does not exist");
    expect(result.stderr).toContain("[path]");
    expect(result.stderr).not.toContain(missingHome);
  });

  it("rejects dry-run on status because status is already read-only", async () => {
    const result = await runCliForTest(["status", "--dry-run"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("status command is already read-only");
  });

  it.each(["0", "-1", "1.5", "soon"])("rejects invalid recent-days value %s", async (value) => {
    const result = await runCliForTest(["scan", "--recent-days", value]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("--recent-days must be a positive integer");
  });

  it("rejects missing recent-days value", async () => {
    const result = await runCliForTest(["scan", "--recent-days"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Missing value for --recent-days");
  });

  it("rejects recent-days on status", async () => {
    const result = await runCliForTest(["status", "--recent-days", "7"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("status command does not scan logs");
  });

  it("rejects dry-run on dashboard because the UI owns scan mode", async () => {
    const result = await runCliForTest(["dashboard", "--dry-run"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("dashboard command provides dry-run in the UI");
  });

  it("rejects auto-scan options on one-shot commands", async () => {
    const scanResult = await runCliForTest(["scan", "--auto-scan"]);
    expect(scanResult.code).toBe(1);
    expect(scanResult.stderr).toContain("scan command runs once");

    const statusResult = await runCliForTest(["status", "--auto-scan"]);
    expect(statusResult.code).toBe(1);
    expect(statusResult.stderr).toContain("status command does not start auto scan");
  });

  it("requires --auto-scan before dashboard auto-scan settings", async () => {
    const result = await runCliForTest(["dashboard", "--auto-scan-interval", "5"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("require --auto-scan");
  });

  it.each(["0", "-1", "1.5", "soon"])("rejects invalid auto-scan interval %s", async (value) => {
    const result = await runCliForTest(["dashboard", "--auto-scan", "--auto-scan-interval", value]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("--auto-scan-interval must be a positive integer");
  });
});

async function runCliForTest(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = "";
  let stderr = "";

  const code = await runCli(argv, {
    stdout: {
      write(chunk: string) {
        stdout += chunk;
        return true;
      }
    },
    stderr: {
      write(chunk: string) {
        stderr += chunk;
        return true;
      }
    }
  });

  return { code, stdout, stderr };
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-battle-cli-"));
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

async function createCodexHome(root: string, lines: string[]): Promise<string> {
  const codexHome = path.join(root, "codex-home");
  const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
  await mkdir(sessionDir, { recursive: true });
  await writeFile(path.join(sessionDir, "rollout-test.jsonl"), `${lines.join("\n")}\n`, "utf8");
  return codexHome;
}

async function appendCodexSession(codexHome: string, line: string): Promise<void> {
  const sessionFile = path.join(codexHome, "sessions", "2026", "05", "07", "rollout-test.jsonl");
  await appendFile(sessionFile, `${line}\n`, "utf8");
}

function tokenCountLine(
  timestamp: string,
  usage: {
    input_tokens: number;
    cached_input_tokens: number;
    output_tokens: number;
    reasoning_output_tokens: number;
    total_tokens: number;
  }
): string {
  return JSON.stringify({
    type: "event_msg",
    timestamp,
    payload: {
      type: "token_count",
      info: {
        last_token_usage: usage,
        total_token_usage: usage
      }
    }
  });
}

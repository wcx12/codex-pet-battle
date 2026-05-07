import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { startDashboardServer, type DashboardServerHandle } from "../src/dashboard/dashboardServer.js";

const tempDirs: string[] = [];
const servers: DashboardServerHandle[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("dashboardServer", () => {
  it("serves config, default status, and static assets without exposing absolute paths", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const server = await startServer({ stateFile });

    const configResponse = await fetch(`${server.url}/api/config`);
    const config = await configResponse.json();
    expect(configResponse.headers.get("access-control-allow-origin")).toBeNull();
    expect(config.stateFileLabel).toBe("pet_state.local.json");
    expect(config.writeToken).toEqual(expect.any(String));
    expect(config.autoScan.defaultIntervalMinutes).toBe(10);
    expect(config.autoScan.minIntervalMinutes).toBe(1);
    expect(JSON.stringify(config)).not.toContain(root);

    const autoScan = await fetchJson(`${server.url}/api/auto-scan`);
    expect(autoScan.autoScan.enabled).toBe(false);
    expect(autoScan.autoScan.running).toBe(false);
    expect(await fileExists(stateFile)).toBe(false);

    const status = await fetchJson(`${server.url}/api/status`);
    expect(status.status.pet.name).toBe("Pathy");
    expect(status.status.pet.xpToNextLevel).toBe(100);
    expect(status.status.economy.weekXpRemaining).toBe(80);
    expect(JSON.stringify(status)).not.toContain("processedObservations");
    expect(JSON.stringify(status)).not.toContain(root);

    const html = await (await fetch(`${server.url}/`)).text();
    expect(html).toContain("Codex Pet Battle");
    expect(html).toContain('id="langZh"');
    expect(html).toContain('data-i18n="scanWindowHelp"');
    expect(html).toContain('id="confirmNote"');
    expect(html).toContain('id="importMode"');
    expect(html).toContain('id="autoStartButton"');
    expect(html).toContain("/app.js");

    const appScript = await (await fetch(`${server.url}/app.js`)).text();
    expect(appScript).toContain("codexPetBattleLanguage");
    expect(appScript).toContain("Auto scan writes local state on a timer");
    expect(appScript).toContain("First import is profile-only");
    expect(appScript).toContain("/api/auto-scan/start");
    expect(appScript).toContain("formatRecentWindow");
  });

  it("runs dry-run without writing state and requires confirmation token for writes", async () => {
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
          text: "SECRET_PROMPT_SHOULD_NOT_LEAK sk-test-dashboard"
        }
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");
    const server = await startServer({ codexHome, stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const blocked = await postJson(`${server.url}/api/scan/confirm`, {
      recentDays: 30,
      confirm: true
    });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error).toContain("write token");

    const dryRun = await postJson(
      `${server.url}/api/scan/dry-run`,
      { recentDays: 30 },
      config.writeToken
    );
    expect(dryRun.status).toBe(200);
    expect(dryRun.body.dryRun).toBe(true);
    expect(dryRun.body.wroteState).toBe(false);
    expect(dryRun.body.newObservations).toBe(1);
    expect(dryRun.body.importApplied).toBe(true);
    expect(dryRun.body.importMode).toBe("profile-only");
    expect(dryRun.body.recentDays).toBe(30);
    expect(dryRun.body.newlyUnlockedSkills).toEqual([]);
    expect(dryRun.body.gainedXp).toBe(0);
    expect(await fileExists(stateFile)).toBe(false);
    expect(JSON.stringify(dryRun.body)).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(JSON.stringify(dryRun.body)).not.toContain(codexHome);
    expect(JSON.stringify(dryRun.body)).not.toContain("rollout-test");
    expect(JSON.stringify(dryRun.body)).not.toContain("processedObservations");

    const missingConfirm = await postJson(
      `${server.url}/api/scan/confirm`,
      { recentDays: 30 },
      config.writeToken
    );
    expect(missingConfirm.status).toBe(400);

    const confirmed = await postJson(
      `${server.url}/api/scan/confirm`,
      { recentDays: 30, confirm: true },
      config.writeToken
    );
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.dryRun).toBe(false);
    expect(confirmed.body.wroteState).toBe(true);
    expect(confirmed.body.resultingStatus.economy.initialImportCompleted).toBe(true);

    const persisted = await readFile(stateFile, "utf8");
    expect(persisted).toContain('"schemaVersion": 2');
    expect(persisted).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(persisted).not.toContain(codexHome);
  });

  it("blocks confirm scan until matching dry-run has completed", async () => {
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
    const server = await startServer({ codexHome, stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const beforeDryRun = await postJson(
      `${server.url}/api/scan/confirm`,
      { recentDays: 7, confirm: true },
      config.writeToken
    );
    expect(beforeDryRun.status).toBe(409);

    await postJson(`${server.url}/api/scan/dry-run`, { recentDays: 30 }, config.writeToken);
    const mismatched = await postJson(
      `${server.url}/api/scan/confirm`,
      { recentDays: 7, confirm: true },
      config.writeToken
    );
    expect(mismatched.status).toBe(409);
  });

  it("starts and stops token-protected auto-scan with sanitized summaries", async () => {
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
          text: "SECRET_AUTO_SCAN_SHOULD_NOT_LEAK sk-test-auto"
        }
      })
    ]);
    const stateFile = path.join(root, "pet_state.local.json");
    const server = await startServer({ codexHome, stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const blocked = await postJson(`${server.url}/api/auto-scan/start`, {
      intervalMinutes: 1,
      recentDays: 30,
      runImmediately: true
    });
    expect(blocked.status).toBe(403);

    const started = await postJson(
      `${server.url}/api/auto-scan/start`,
      {
        intervalMinutes: 1,
        recentDays: 30,
        runImmediately: true
      },
      config.writeToken
    );
    expect(started.status).toBe(200);
    expect(started.body.autoScan.enabled).toBe(true);
    expect(started.body.autoScan.running).toBe(false);
    expect(started.body.autoScan.intervalMinutes).toBe(1);
    expect(started.body.autoScan.recentDays).toBe(30);
    expect(started.body.autoScan.lastSummary.dryRun).toBe(false);
    expect(started.body.autoScan.lastSummary.wroteState).toBe(true);
    expect(started.body.autoScan.lastSummary.importMode).toBe("profile-only");
    expect(JSON.stringify(started.body)).not.toContain("SECRET_AUTO_SCAN_SHOULD_NOT_LEAK");
    expect(JSON.stringify(started.body)).not.toContain(codexHome);
    expect(JSON.stringify(started.body)).not.toContain("rollout-test");
    expect(JSON.stringify(started.body)).not.toContain("processedObservations");
    expect(await fileExists(stateFile)).toBe(true);

    const stopped = await postJson(`${server.url}/api/auto-scan/stop`, {}, config.writeToken);
    expect(stopped.status).toBe(200);
    expect(stopped.body.autoScan.enabled).toBe(false);
    expect(stopped.body.autoScan.nextRunAt).toBeUndefined();
  });

  it("validates auto-scan settings", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const server = await startServer({ stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const invalidInterval = await postJson(
      `${server.url}/api/auto-scan/start`,
      { intervalMinutes: 0, recentDays: 30 },
      config.writeToken
    );
    expect(invalidInterval.status).toBe(400);
    expect(invalidInterval.body.error).toContain("intervalMinutes");

    const invalidRecentDays = await postJson(
      `${server.url}/api/auto-scan/start`,
      { intervalMinutes: 1, recentDays: "soon" },
      config.writeToken
    );
    expect(invalidRecentDays.status).toBe(400);
    expect(invalidRecentDays.body.error).toContain("recentDays");
  });

  it("invalidates manual confirm tickets after auto-scan writes state", async () => {
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
    const server = await startServer({ codexHome, stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    await postJson(`${server.url}/api/scan/dry-run`, { recentDays: 30 }, config.writeToken);
    await postJson(
      `${server.url}/api/auto-scan/start`,
      { intervalMinutes: 1, recentDays: 30, runImmediately: true },
      config.writeToken
    );
    const staleConfirm = await postJson(
      `${server.url}/api/scan/confirm`,
      { recentDays: 30, confirm: true },
      config.writeToken
    );

    expect(staleConfirm.status).toBe(409);
  });
});

async function startServer(options: {
  codexHome?: string;
  stateFile: string;
  autoScan?: { enabled?: boolean; intervalMinutes?: number; recentDays?: number | null };
}): Promise<DashboardServerHandle> {
  const server = await startDashboardServer({
    cliCodexHome: options.codexHome,
    stateFile: options.stateFile,
    autoScan: options.autoScan,
    port: 0
  });
  servers.push(server);
  return server;
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

async function postJson(url: string, body: unknown, token?: string): Promise<{ status: number; body: any }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Codex-Pet-Dashboard-Token": token } : {})
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-dashboard-"));
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

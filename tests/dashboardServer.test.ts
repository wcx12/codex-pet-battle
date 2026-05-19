import { access, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
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
    expect(status.status.pet.activePetId).toBe("pathy");
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
    expect(html).toContain('id="petSprite"');
    expect(html).toContain('id="petSelect"');
    expect(html).toContain('id="petDexList"');
    expect(html).toContain('id="adventureRank"');
    expect(html).toContain('id="questList"');
    expect(html).toContain('id="badgeList"');
    expect(html).toContain('id="backupStateButton"');
    expect(html).toContain('id="doctorState"');
    expect(html).toContain('id="practiceBattleButton"');
    expect(html).toContain('id="battleTrainingXp"');
    expect(html).toContain('id="battleRounds"');
    expect(html).toContain('id="battleMove"');
    expect(html).toContain('id="battlePetHpFill"');
    expect(html).toContain('id="battleOpponentHpFill"');
    expect(html).toContain('id="moveDexList"');
    expect(html).toContain('id="battleRecord"');
    expect(html).toContain('id="battleStreak"');
    expect(html).toContain("/app.js");

    const appScript = await (await fetch(`${server.url}/app.js`)).text();
    expect(appScript).toContain("codexPetBattleLanguage");
    expect(appScript).toContain("codexPetBattlePetId");
    expect(appScript).toContain("Patrol mode writes local state on a timer");
    expect(appScript).toContain("First import is profile-only");
    expect(appScript).toContain("/api/auto-scan/start");
    expect(appScript).toContain("/api/pets");
    expect(appScript).toContain("/api/pet/select");
    expect(appScript).toContain("/api/doctor");
    expect(appScript).toContain("/api/state/backup");
    expect(appScript).toContain("/api/battle/practice");
    expect(appScript).toContain("renderAdventure");
    expect(appScript).toContain("readOnlyShare");
    expect(appScript).toContain("/pet/pet.json");
    expect(appScript).toContain("petRows");
    expect(appScript).toContain("formatRecentWindow");
  });

  it("serves packaged pet assets without exposing local file paths", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    const server = await startServer({ stateFile, petAssetRoot });

    const manifestResponse = await fetch(`${server.url}/pet/pet.json`);
    const manifest = await manifestResponse.json();
    expect(manifestResponse.status).toBe(200);
    expect(manifest).toEqual({
      id: "pathy",
      displayName: "Pathy",
      description: "A tiny teal pathfinder companion.",
      spritesheetUrl: "/pet/pathy/spritesheet.webp",
      atlas: {
        columns: 8,
        rows: 9,
        cellWidth: 192,
        cellHeight: 208
      }
    });
    expect(JSON.stringify(manifest)).not.toContain(root);

    const spritesheetResponse = await fetch(`${server.url}/pet/pathy/spritesheet.webp`);
    expect(spritesheetResponse.status).toBe(200);
    expect(spritesheetResponse.headers.get("content-type")).toBe("image/webp");
    expect((await spritesheetResponse.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it("lists valid pet packages and serves a selected pet by id", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    await createPetPackage(petAssetRoot, {
      id: "bytebao",
      displayName: "Bytebao",
      description: "A small byte companion."
    });
    const server = await startServer({ stateFile, petAssetRoot });

    const catalog = await fetchJson(`${server.url}/api/pets`);
    expect(catalog.defaultPetId).toBe("pathy");
    expect(catalog.pets.map((pet: any) => pet.id)).toEqual(["bytebao", "pathy"]);
    expect(JSON.stringify(catalog)).not.toContain(root);

    const manifestResponse = await fetch(`${server.url}/pet/bytebao/pet.json`);
    const manifest = await manifestResponse.json();
    expect(manifestResponse.status).toBe(200);
    expect(manifest).toMatchObject({
      id: "bytebao",
      displayName: "Bytebao",
      spritesheetUrl: "/pet/bytebao/spritesheet.webp"
    });

    const spritesheetResponse = await fetch(`${server.url}/pet/bytebao/spritesheet.webp`);
    expect(spritesheetResponse.status).toBe(200);
    expect(JSON.stringify(manifest)).not.toContain(root);
  });

  it("persists the active pet through a token-protected API", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    await createPetPackage(petAssetRoot, {
      id: "bytebao",
      displayName: "Bytebao",
      description: "A small byte companion."
    });
    const server = await startServer({ stateFile, petAssetRoot });
    const config = await fetchJson(`${server.url}/api/config`);

    const blocked = await postJson(`${server.url}/api/pet/select`, { petId: "bytebao" });
    expect(blocked.status).toBe(403);

    const selected = await postJson(
      `${server.url}/api/pet/select`,
      { petId: "bytebao" },
      config.writeToken
    );

    expect(selected.status).toBe(200);
    expect(selected.body.selectedPet).toMatchObject({
      id: "bytebao",
      displayName: "Bytebao"
    });
    expect(selected.body.resultingStatus.pet.activePetId).toBe("bytebao");
    expect(selected.body.resultingStatus.pet.name).toBe("Bytebao");
    expect(JSON.stringify(selected.body)).not.toContain(root);

    const persisted = JSON.parse(await readFile(stateFile, "utf8"));
    expect(persisted.activePetId).toBe("bytebao");
    expect(persisted.pet.name).toBe("Bytebao");

    const status = await fetchJson(`${server.url}/api/status`);
    expect(status.status.pet.activePetId).toBe("bytebao");
    expect(status.status.pet.name).toBe("Bytebao");
  });

  it("validates active pet selection ids and missing packages", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    const server = await startServer({ stateFile, petAssetRoot });
    const config = await fetchJson(`${server.url}/api/config`);

    const unsafe = await postJson(
      `${server.url}/api/pet/select`,
      { petId: "../secret" },
      config.writeToken
    );
    expect(unsafe.status).toBe(400);
    expect(unsafe.body.error).toContain("petId");

    const missing = await postJson(
      `${server.url}/api/pet/select`,
      { petId: "missingmon" },
      config.writeToken
    );
    expect(missing.status).toBe(404);
    expect(JSON.stringify(missing.body)).not.toContain(root);
  });

  it("returns a safe 404 when no pet package exists", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "empty-pets");
    const server = await startServer({ stateFile, petAssetRoot });

    const manifestResponse = await fetch(`${server.url}/pet/pet.json`);
    const body = await manifestResponse.json();
    expect(manifestResponse.status).toBe(404);
    expect(body.error).toContain("Pet package not found");
    expect(JSON.stringify(body)).not.toContain(root);
  });

  it.each(["../secret.webp", "spritesheet.png", path.resolve("secret.webp")])(
    "rejects unsafe pet spritesheet path %s",
    async (spritesheetPath) => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    const petDir = await createPetPackage(petAssetRoot, {
      spritesheetPath
    });
    await writeFile(path.join(root, "secret.webp"), "secret", "utf8");
    const server = await startServer({ stateFile, petAssetRoot });

    const manifestResponse = await fetch(`${server.url}/pet/pet.json`);
    const body = await manifestResponse.json();
    expect(manifestResponse.status).toBe(400);
    expect(body.error).toContain("spritesheet path");
    expect(JSON.stringify(body)).not.toContain(root);
    expect(JSON.stringify(body)).not.toContain(petDir);
    }
  );

  it("rejects symlinked pet spritesheets that point outside the package", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    const petDir = await createPetPackage(petAssetRoot, { writeSpritesheet: false });
    const secretPath = path.join(root, "secret.webp");
    await writeFile(secretPath, "secret", "utf8");
    try {
      await symlink(secretPath, path.join(petDir, "spritesheet.webp"), "file");
    } catch (error) {
      if (isNodeError(error) && (error.code === "EPERM" || error.code === "EACCES")) {
        return;
      }
      throw error;
    }
    const server = await startServer({ stateFile, petAssetRoot });

    const manifestResponse = await fetch(`${server.url}/pet/pet.json`);
    const body = await manifestResponse.json();
    expect(manifestResponse.status).toBe(400);
    expect(body.error).toContain("spritesheet path");
    expect(JSON.stringify(body)).not.toContain(root);
  });

  it("returns a safe error when the pet spritesheet is missing", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    await rm(path.join(petAssetRoot, "pathy", "spritesheet.webp"));
    const server = await startServer({ stateFile, petAssetRoot });

    const manifestResponse = await fetch(`${server.url}/pet/pet.json`);
    const manifestBody = await manifestResponse.json();
    expect(manifestResponse.status).toBe(400);
    expect(manifestBody.error).toContain("spritesheet is unavailable");
    expect(JSON.stringify(manifestBody)).not.toContain(root);

    const spritesheetResponse = await fetch(`${server.url}/pet/spritesheet.webp`);
    const spritesheetBody = await spritesheetResponse.json();
    expect(spritesheetResponse.status).toBe(400);
    expect(spritesheetBody.error).toContain("spritesheet is unavailable");
    expect(JSON.stringify(spritesheetBody)).not.toContain(root);
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

  it("backs up state through a token-protected API without returning raw state", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    await writeFile(stateFile, '{"secret":"STATE_SHOULD_NOT_RETURN"}', "utf8");
    const server = await startServer({ stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const blocked = await postJson(`${server.url}/api/state/backup`, {});
    expect(blocked.status).toBe(403);

    const backedUp = await postJson(`${server.url}/api/state/backup`, {}, config.writeToken);
    expect(backedUp.status).toBe(200);
    expect(backedUp.body.backup.stateFileLabel).toBe("pet_state.local.json");
    expect(backedUp.body.backup.backupFileLabel).toMatch(/^pet_state\.backup-.*\.local\.json$/u);
    expect(JSON.stringify(backedUp.body)).not.toContain("STATE_SHOULD_NOT_RETURN");
    expect(JSON.stringify(backedUp.body)).not.toContain(root);

    const files = await readdir(root);
    const backupFile = files.find((file) => file.startsWith("pet_state.backup-"));
    expect(backupFile).toBeDefined();
    await expect(readFile(path.join(root, backupFile ?? ""), "utf8")).resolves.toBe(
      '{"secret":"STATE_SHOULD_NOT_RETURN"}'
    );
  });

  it("serves a sanitized doctor report", async () => {
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
    await writeFile(stateFile, JSON.stringify({ secret: "BROKEN_STATE_SHOULD_NOT_LEAK" }), "utf8");
    const petAssetRoot = path.join(root, "pets");
    await createPetPackage(petAssetRoot);
    const server = await startServer({ codexHome, stateFile, petAssetRoot });

    const body = await fetchJson(`${server.url}/api/doctor`);

    expect(body.doctor.ok).toBe(false);
    expect(body.doctor.codexHome.accessible).toBe(true);
    expect(body.doctor.codexHome.sessionsDirExists).toBe(true);
    expect(body.doctor.state.exists).toBe(true);
    expect(body.doctor.state.readable).toBe(false);
    expect(body.doctor.pets.availableCount).toBe(1);
    expect(JSON.stringify(body)).not.toContain("BROKEN_STATE_SHOULD_NOT_LEAK");
    expect(JSON.stringify(body)).not.toContain(root);
    expect(JSON.stringify(body)).not.toContain(codexHome);
  });

  it("runs a token-protected local practice battle and records battle stats", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    await writeFile(stateFile, JSON.stringify(createBattleState()), "utf8");
    const server = await startServer({ stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const blocked = await postJson(`${server.url}/api/battle/practice`, {
      difficulty: "hard",
      seed: "dashboard-battle"
    });
    expect(blocked.status).toBe(403);

    const battle = await postJson(
      `${server.url}/api/battle/practice`,
      {
        difficulty: "hard",
        seed: "dashboard-battle",
        moveId: "test_shield"
      },
      config.writeToken
    );

    expect(battle.status).toBe(200);
    expect(battle.body.battle.difficulty).toBe("hard");
    expect(battle.body.battle.preferredMoveId).toBe("test_shield");
    expect(["victory", "defeat", "draw"]).toContain(battle.body.battle.outcome);
    expect(battle.body.battle.log.length).toBeGreaterThan(0);
    expect(battle.body.battle.rewards.codexXpAwarded).toBe(0);
    expect(battle.body.battle.rewards.petXpAwarded).toBeGreaterThan(0);
    expect(battle.body.resultingStatus.battle.totalBattles).toBe(1);
    expect(battle.body.resultingStatus.pet.xp).toBe(battle.body.battle.rewards.petXpAwarded);
    expect(JSON.stringify(battle.body)).not.toContain(root);

    const persisted = JSON.parse(await readFile(stateFile, "utf8"));
    expect(persisted.battle.totalBattles).toBe(1);
    expect(persisted.battle.wins + persisted.battle.losses + persisted.battle.draws).toBe(1);
    expect(persisted.pet.xp).toBe(battle.body.battle.rewards.petXpAwarded);
  });

  it("validates practice battle difficulty", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    const server = await startServer({ stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const battle = await postJson(
      `${server.url}/api/battle/practice`,
      {
        difficulty: "legendary"
      },
      config.writeToken
    );

    expect(battle.status).toBe(400);
    expect(battle.body.error).toContain("difficulty");
  });

  it("validates practice battle move selection", async () => {
    const root = await makeTempDir();
    const stateFile = path.join(root, "pet_state.local.json");
    await writeFile(stateFile, JSON.stringify(createBattleState()), "utf8");
    const server = await startServer({ stateFile });
    const config = await fetchJson(`${server.url}/api/config`);

    const unsafe = await postJson(
      `${server.url}/api/battle/practice`,
      {
        moveId: "../secret"
      },
      config.writeToken
    );
    expect(unsafe.status).toBe(400);
    expect(unsafe.body.error).toContain("moveId");

    const locked = await postJson(
      `${server.url}/api/battle/practice`,
      {
        moveId: "battle_burst"
      },
      config.writeToken
    );
    expect(locked.status).toBe(400);
    expect(locked.body.error).toContain("unlocked moves");
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
  petAssetRoot?: string;
  autoScan?: { enabled?: boolean; intervalMinutes?: number; recentDays?: number | null };
}): Promise<DashboardServerHandle> {
  const server = await startDashboardServer({
    cliCodexHome: options.codexHome,
    stateFile: options.stateFile,
    petAssetRoot: options.petAssetRoot,
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

async function createPetPackage(
  petAssetRoot: string,
  overrides: Partial<{
    id: string;
    displayName: string;
    description: string;
    spritesheetPath: string;
    writeSpritesheet: boolean;
  }> = {}
): Promise<string> {
  const manifest = {
    id: overrides.id ?? "pathy",
    displayName: overrides.displayName ?? "Pathy",
    description: overrides.description ?? "A tiny teal pathfinder companion.",
    spritesheetPath: overrides.spritesheetPath ?? "spritesheet.webp"
  };
  const petDir = path.join(petAssetRoot, manifest.id);
  await mkdir(petDir, { recursive: true });
  await writeFile(path.join(petDir, "pet.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (manifest.spritesheetPath === "spritesheet.webp" && overrides.writeSpritesheet !== false) {
    await writeFile(path.join(petDir, "spritesheet.webp"), Buffer.from("RIFFwebp"));
  }
  return petDir;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
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

function createBattleState() {
  return {
    schemaVersion: 2,
    pet: {
      name: "Pathy",
      level: 6,
      xp: 0,
      xpToNextLevel: 700,
      skills: ["token_spark", "context_sense", "test_shield"]
    },
    usage: {
      lifetimeInputTokens: 0,
      lifetimeCachedInputTokens: 0,
      lifetimeOutputTokens: 0,
      lifetimeReasoningOutputTokens: 0,
      lifetimeTotalTokens: 0
    },
    economy: {
      version: "hard-v1",
      initialImportCompleted: true,
      dailyXpLedger: {},
      weeklyXpLedger: {},
      xpRemainder: 0
    },
    processedObservations: [],
    createdAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z"
  };
}

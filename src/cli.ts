#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { recordPracticeBattleResult, runPracticeBattle } from "./battle/battleEngine.js";
import type { BattleDifficulty } from "./battle/battleTypes.js";
import { DEFAULT_STATE_FILE_NAME } from "./constants.js";
import { startDashboardServer } from "./dashboard/dashboardServer.js";
import { createDoctorReport } from "./diagnostics.js";
import { UserFacingError } from "./errors.js";
import { backupPetState, createDefaultPetState, readPetState, writePetStateAtomically } from "./petStateStore.js";
import { runPetScan } from "./scanWorkflow.js";
import { sanitizeErrorMessage } from "./privacy.js";
import type { PetState, ScannerWarnings } from "./types.js";

interface CliIo {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
}

interface ParsedArgs {
  command: "scan" | "status" | "dashboard" | "backup" | "doctor" | "battle" | "help";
  codexHome?: string;
  dryRun: boolean;
  recentDays?: number;
  stateFile: string;
  port?: number;
  autoScan: boolean;
  autoScanIntervalMinutes?: number;
  autoScanRecentDays?: number | null;
  battleDifficulty?: BattleDifficulty;
  battleSeed?: string;
  battleMoveId?: string;
  commitBattle: boolean;
}

const USAGE = `Codex Pet Battle

Usage:
  codex-pet-battle scan [--codex-home <path>] [--state-file <path>] [--dry-run] [--recent-days <days>]
  codex-pet-battle status [--state-file <path>]
  codex-pet-battle backup [--state-file <path>]
  codex-pet-battle doctor [--codex-home <path>] [--state-file <path>]
  codex-pet-battle battle [--state-file <path>] [--difficulty <easy|normal|hard>] [--move <move-id>] [--seed <seed>] [--commit]
  codex-pet-battle dashboard [--codex-home <path>] [--state-file <path>] [--port <port>] [--auto-scan] [--auto-scan-interval <minutes>] [--auto-scan-recent-days <days|all>]

Commands:
  scan       Read local Codex token usage and update pet state.
  status     Show the current pet state without modifying it.
  backup     Copy the local pet state file next to itself.
  doctor     Check local state, Codex home, sessions, and pet packages.
  battle     Run a local practice battle. Add --commit to record battle stats.
  dashboard  Start the local dashboard at 127.0.0.1.
`;

export async function runCli(argv = process.argv.slice(2), io: CliIo = defaultIo()): Promise<number> {
  try {
    const parsed = parseArgs(argv);

    if (parsed.command === "help") {
      writeLine(io.stdout, USAGE.trimEnd());
      return 0;
    }

    if (parsed.command === "scan") {
      await runScan(parsed, io);
      return 0;
    }

    if (parsed.command === "status") {
      await runStatus(parsed, io);
      return 0;
    }

    if (parsed.command === "backup") {
      await runBackup(parsed, io);
      return 0;
    }

    if (parsed.command === "doctor") {
      await runDoctor(parsed, io);
      return 0;
    }

    if (parsed.command === "battle") {
      await runBattle(parsed, io);
      return 0;
    }

    await runDashboard(parsed, io);
    return 0;
  } catch (error) {
    if (error instanceof UserFacingError) {
      writeLine(io.stderr, `Error: ${sanitizeErrorMessage(error.message)}`);
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    writeLine(io.stderr, `Unexpected error: ${sanitizeErrorMessage(message)}`);
    return 1;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const rawCommand = argv[0];
  if (!rawCommand || rawCommand === "help" || rawCommand === "--help" || rawCommand === "-h") {
    return { command: "help", dryRun: false, stateFile: defaultStateFile(), autoScan: false, commitBattle: false };
  }

  if (
    rawCommand !== "scan" &&
    rawCommand !== "status" &&
    rawCommand !== "dashboard" &&
    rawCommand !== "backup" &&
    rawCommand !== "doctor" &&
    rawCommand !== "battle"
  ) {
    throw new UserFacingError(`Unknown command: ${rawCommand}\n\n${USAGE.trimEnd()}`);
  }

  const command = rawCommand;
  const parsed: ParsedArgs = {
    command,
    dryRun: false,
    stateFile: defaultStateFile(),
    autoScan: false,
    commitBattle: false
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--codex-home") {
      parsed.codexHome = requireValue(argv, (index += 1), arg);
      continue;
    }

    if (arg === "--state-file") {
      parsed.stateFile = path.resolve(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--recent-days") {
      parsed.recentDays = parseRecentDays(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--port") {
      parsed.port = parsePort(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--auto-scan") {
      parsed.autoScan = true;
      continue;
    }

    if (arg === "--auto-scan-interval") {
      parsed.autoScanIntervalMinutes = parseAutoScanInterval(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--auto-scan-recent-days") {
      parsed.autoScanRecentDays = parseAutoScanRecentDays(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--difficulty") {
      parsed.battleDifficulty = parseBattleDifficulty(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--seed") {
      parsed.battleSeed = requireValue(argv, (index += 1), arg);
      continue;
    }

    if (arg === "--move") {
      parsed.battleMoveId = parseBattleMoveId(requireValue(argv, (index += 1), arg));
      continue;
    }

    if (arg === "--commit") {
      parsed.commitBattle = true;
      continue;
    }

    throw new UserFacingError(`Unknown option: ${arg}`);
  }

  if (command === "status" && parsed.codexHome) {
    throw new UserFacingError("The status command does not read Codex logs. Remove --codex-home.");
  }

  if (command === "status" && parsed.dryRun) {
    throw new UserFacingError("The status command is already read-only. Remove --dry-run.");
  }

  if (command === "status" && parsed.recentDays !== undefined) {
    throw new UserFacingError("The status command does not scan logs. Remove --recent-days.");
  }

  if (command === "status" && parsed.port !== undefined) {
    throw new UserFacingError("The status command does not start a server. Remove --port.");
  }

  if (
    (command === "status" || command === "backup" || command === "doctor" || command === "battle") &&
    (parsed.autoScan || parsed.autoScanIntervalMinutes !== undefined || parsed.autoScanRecentDays !== undefined)
  ) {
    throw new UserFacingError(`The ${command} command does not start auto scan. Remove --auto-scan options.`);
  }

  if (command === "backup" && parsed.codexHome) {
    throw new UserFacingError("The backup command does not read Codex logs. Remove --codex-home.");
  }

  if (command === "backup" && parsed.dryRun) {
    throw new UserFacingError("The backup command already copies without scanning. Remove --dry-run.");
  }

  if (command === "backup" && parsed.recentDays !== undefined) {
    throw new UserFacingError("The backup command does not scan logs. Remove --recent-days.");
  }

  if (command === "backup" && parsed.port !== undefined) {
    throw new UserFacingError("The backup command does not start a server. Remove --port.");
  }

  if (command === "doctor" && parsed.dryRun) {
    throw new UserFacingError("The doctor command is read-only. Remove --dry-run.");
  }

  if (command === "doctor" && parsed.recentDays !== undefined) {
    throw new UserFacingError("The doctor command does not scan logs. Remove --recent-days.");
  }

  if (command === "doctor" && parsed.port !== undefined) {
    throw new UserFacingError("The doctor command does not start a server. Remove --port.");
  }

  if (command === "battle" && parsed.codexHome) {
    throw new UserFacingError("The battle command does not read Codex logs. Remove --codex-home.");
  }

  if (command === "battle" && parsed.dryRun) {
    throw new UserFacingError("The battle command is read-only by default. Use --commit to record battle stats, or remove --dry-run.");
  }

  if (command === "battle" && parsed.recentDays !== undefined) {
    throw new UserFacingError("The battle command does not scan logs. Remove --recent-days.");
  }

  if (command === "battle" && parsed.port !== undefined) {
    throw new UserFacingError("The battle command does not start a server. Remove --port.");
  }

  if (command !== "battle" && (parsed.battleDifficulty !== undefined || parsed.battleSeed !== undefined || parsed.battleMoveId !== undefined || parsed.commitBattle)) {
    throw new UserFacingError("--difficulty, --seed, --move, and --commit are only supported by the battle command.");
  }

  if (command === "scan" && parsed.port !== undefined) {
    throw new UserFacingError("The scan command does not start a server. Remove --port.");
  }

  if (
    command === "scan" &&
    (parsed.autoScan || parsed.autoScanIntervalMinutes !== undefined || parsed.autoScanRecentDays !== undefined)
  ) {
    throw new UserFacingError("The scan command runs once. Remove --auto-scan options.");
  }

  if (command === "dashboard" && parsed.dryRun) {
    throw new UserFacingError("The dashboard command provides dry-run in the UI. Remove --dry-run.");
  }

  if (command === "dashboard" && parsed.recentDays !== undefined) {
    throw new UserFacingError("The dashboard command lets you choose recent days in the UI. Remove --recent-days.");
  }

  if (
    command === "dashboard" &&
    !parsed.autoScan &&
    (parsed.autoScanIntervalMinutes !== undefined || parsed.autoScanRecentDays !== undefined)
  ) {
    throw new UserFacingError("--auto-scan-interval and --auto-scan-recent-days require --auto-scan.");
  }

  return parsed;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new UserFacingError(`Missing value for ${flag}.`);
  }

  return value;
}

function parseRecentDays(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new UserFacingError("--recent-days must be a positive integer.");
  }

  return parsed;
}

function parsePort(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new UserFacingError("--port must be an integer between 1 and 65535.");
  }

  return parsed;
}

function parseAutoScanInterval(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new UserFacingError("--auto-scan-interval must be a positive integer.");
  }

  return parsed;
}

function parseAutoScanRecentDays(value: string): number | null {
  if (value.toLowerCase() === "all") {
    return null;
  }

  return parseRecentDays(value);
}

function parseBattleDifficulty(value: string): BattleDifficulty {
  if (value === "easy" || value === "normal" || value === "hard") {
    return value;
  }

  throw new UserFacingError("--difficulty must be easy, normal, or hard.");
}

function parseBattleMoveId(value: string): string {
  if (/^[a-z0-9](?:[a-z0-9_:-]{0,62}[a-z0-9])?$/u.test(value)) {
    return value;
  }

  throw new UserFacingError("--move must be a safe move id.");
}

async function runScan(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const result = await runPetScan({
    cliCodexHome: parsed.codexHome,
    stateFile: parsed.stateFile,
    dryRun: parsed.dryRun,
    recentDays: parsed.recentDays
  });
  const progression = result.progression;

  writeLine(io.stdout, parsed.dryRun ? "Dry run complete" : "Scan complete");
  writeLine(io.stdout, `Dry run: ${parsed.dryRun ? "yes" : "no"}`);
  writeLine(io.stdout, `Recent days: ${parsed.recentDays ?? "all"}`);
  writeLine(io.stdout, `Files scanned: ${result.scanResult.filesScanned}`);
  writeLine(io.stdout, `New observations: ${result.newObservationCount}`);
  writeLine(io.stdout, `Economy: ${progression.economyVersion}`);
  writeLine(io.stdout, `Formula: output-focused`);
  writeLine(io.stdout, `Level curve: milestone`);
  writeLine(io.stdout, `Daily cap: hard-daily`);
  writeLine(io.stdout, `Weekly cap: hard-weekly`);
  writeLine(io.stdout, `Import mode: ${progression.importMode}`);
  if (progression.importApplied) {
    writeLine(io.stdout, `Import applied: profile-only`);
  }
  writeLine(io.stdout, `Raw XP before caps: ${formatXp(progression.rawXp)}`);
  writeLine(io.stdout, `Daily capped XP: ${formatXp(progression.dailyCappedXp)}`);
  writeLine(io.stdout, `Weekly capped XP: ${formatXp(progression.weeklyCappedXp)}`);
  writeLine(io.stdout, `Final XP after import rules: ${formatXp(progression.finalXp)}`);
  writeLine(io.stdout, `XP gained: ${progression.gainedXp}`);
  writePetSummary(io.stdout, result.state);

  if (progression.newlyUnlockedSkills.length > 0) {
    writeLine(io.stdout, `New skills: ${progression.newlyUnlockedSkills.join(", ")}`);
  }

  writeWarnings(io.stdout, result.scanResult.warnings);
}

async function runStatus(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const state = await readPetState(parsed.stateFile);

  if (!state) {
    writeLine(io.stdout, "No local pet state found yet. Run scan to create one.");
    writePetSummary(io.stdout, createDefaultPetState(new Date()));
    return;
  }

  writeLine(io.stdout, `Pet status`);
  writePetSummary(io.stdout, state);
}

async function runBackup(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const backup = await backupPetState(parsed.stateFile);
  writeLine(io.stdout, "Backup complete");
  writeLine(io.stdout, `State file: ${path.basename(parsed.stateFile)}`);
  writeLine(io.stdout, `Backup file: ${path.basename(backup.backupFilePath)}`);
  writeLine(io.stdout, `Backed up: ${backup.backedUpAt}`);
}

async function runDoctor(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const report = await createDoctorReport({
    cliCodexHome: parsed.codexHome,
    stateFile: parsed.stateFile
  });

  writeLine(io.stdout, "Doctor report");
  writeLine(io.stdout, `Overall: ${report.ok ? "ok" : "needs attention"}`);
  writeLine(io.stdout, `State file: ${report.stateFileLabel}`);
  writeLine(io.stdout, `State: ${report.state.readable ? `schema v${report.state.schemaVersion}, level ${report.state.petLevel}` : report.state.error}`);
  writeLine(
    io.stdout,
    `Codex home: ${report.codexHome.accessible ? "accessible" : "not accessible"}, sessions: ${
      report.codexHome.sessionsDirExists ? "found" : "missing"
    }`
  );
  writeLine(
    io.stdout,
    `Pet packages: ${report.pets.availableCount}, default: ${report.pets.defaultPetAvailable ? "available" : "missing"}`
  );

  if (report.warnings.length > 0) {
    writeLine(io.stdout, `Warnings: ${report.warnings.join(" | ")}`);
  }
}

async function runBattle(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const state = (await readPetState(parsed.stateFile)) ?? createDefaultPetState(new Date());
  const battle = runPracticeBattle(state, {
    difficulty: parsed.battleDifficulty,
    seed: parsed.battleSeed,
    preferredMoveId: parsed.battleMoveId
  });
  if (parsed.battleMoveId && battle.preferredMoveId !== parsed.battleMoveId) {
    throw new UserFacingError("--move must be one of the pet's unlocked moves.");
  }
  const nextState = recordPracticeBattleResult(state, battle);
  if (parsed.commitBattle) {
    await writePetStateAtomically(parsed.stateFile, nextState);
  }

  writeLine(io.stdout, "Practice battle complete");
  writeLine(io.stdout, `State updated: ${parsed.commitBattle ? "yes" : "no"}`);
  writeLine(io.stdout, `Outcome: ${battle.outcome}`);
  writeLine(io.stdout, `Difficulty: ${battle.difficulty}`);
  if (battle.preferredMoveId) {
    writeLine(io.stdout, `Opening move: ${battle.preferredMoveId}`);
  }
  writeLine(io.stdout, `Rounds: ${battle.rounds}`);
  writeLine(io.stdout, `Pet: ${battle.pet.name} HP ${battle.pet.hp}/${battle.pet.maxHp}`);
  writeLine(io.stdout, `Opponent: ${battle.opponent.name} HP ${battle.opponent.hp}/${battle.opponent.maxHp}`);
  writeLine(io.stdout, `Record: ${nextState.battle.wins}-${nextState.battle.losses}-${nextState.battle.draws}`);
  writeLine(io.stdout, `Current streak: ${nextState.battle.currentStreak}`);
  writeLine(io.stdout, `Training XP awarded: ${battle.rewards.petXpAwarded}`);
  writeLine(io.stdout, `Codex XP awarded: ${battle.rewards.codexXpAwarded}`);
  writeLine(io.stdout, "Battle log:");
  for (const entry of battle.log.slice(0, 12)) {
    const result = entry.category === "guard"
      ? "guards"
      : entry.missed
        ? "misses"
        : `deals ${entry.damage}`;
    writeLine(io.stdout, `  R${entry.round} ${entry.actorName} used ${entry.moveName}: ${result}`);
  }
}

async function runDashboard(parsed: ParsedArgs, io: CliIo): Promise<void> {
  const dashboard = await startDashboardServer({
    cliCodexHome: parsed.codexHome,
    stateFile: parsed.stateFile,
    port: parsed.port,
    autoScan: parsed.autoScan
      ? {
          enabled: true,
          intervalMinutes: parsed.autoScanIntervalMinutes,
          recentDays: parsed.autoScanRecentDays
        }
      : undefined
  });

  writeLine(io.stdout, `Codex Pet Battle dashboard running at ${dashboard.url}`);
  if (parsed.autoScan) {
    writeLine(
      io.stdout,
      `Auto scan enabled: every ${parsed.autoScanIntervalMinutes ?? 10} minute(s), recent days: ${
        parsed.autoScanRecentDays === null ? "all" : parsed.autoScanRecentDays ?? 30
      }`
    );
  }
  writeLine(io.stdout, "Press Ctrl+C to stop.");
}

function writePetSummary(stdout: CliIo["stdout"], state: PetState): void {
  writeLine(stdout, `Pet: ${state.pet.name}`);
  writeLine(stdout, `Active pet: ${state.activePetId}`);
  writeLine(stdout, `Level: ${state.pet.level}`);
  writeLine(stdout, `XP: ${state.pet.xp}/${state.pet.xpToNextLevel}`);
  writeLine(stdout, `Skills: ${state.pet.skills.length > 0 ? state.pet.skills.join(", ") : "none"}`);
  writeLine(stdout, `Lifetime tokens: ${state.usage.lifetimeTotalTokens}`);
  writeLine(stdout, `  input: ${state.usage.lifetimeInputTokens}`);
  writeLine(stdout, `  cached input: ${state.usage.lifetimeCachedInputTokens}`);
  writeLine(stdout, `  output: ${state.usage.lifetimeOutputTokens}`);
  writeLine(stdout, `  reasoning output: ${state.usage.lifetimeReasoningOutputTokens}`);
  writeLine(stdout, `Updated: ${state.updatedAt}`);
}

function writeWarnings(stdout: CliIo["stdout"], warnings: ScannerWarnings): void {
  const total = warnings.malformedJsonLines + warnings.unknownTokenShapes + warnings.unreadableFiles;
  if (total === 0) {
    return;
  }

  writeLine(
    stdout,
    `Warnings: malformedJsonLines=${warnings.malformedJsonLines}, unknownTokenShapes=${warnings.unknownTokenShapes}, unreadableFiles=${warnings.unreadableFiles}`
  );
}

function formatXp(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

function defaultStateFile(): string {
  return path.resolve(process.cwd(), DEFAULT_STATE_FILE_NAME);
}

function defaultIo(): CliIo {
  return {
    stdout: process.stdout,
    stderr: process.stderr
  };
}

function writeLine(stream: Pick<NodeJS.WriteStream, "write">, line: string): void {
  stream.write(`${line}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

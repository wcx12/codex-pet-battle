#!/usr/bin/env node
import { resolveCodexHome } from "../src/codexHomeResolver.js";
import { UserFacingError } from "../src/errors.js";
import { sanitizeErrorMessage } from "../src/privacy.js";
import { economyCandidates } from "../src/economy/candidates.js";
import { simulateEconomy, sumLifetimeUsage } from "../src/economy/simulateEconomy.js";
import { scanSessions } from "../src/sessionScanner.js";
import type { EconomySimulationResult } from "../src/economy/types.js";
import type { LifetimeUsage, ScannerWarnings } from "../src/types.js";

interface BenchmarkArgs {
  codexHome?: string;
  recentDays?: number;
  all: boolean;
  help: boolean;
  json: boolean;
}

const USAGE = `Codex Pet Battle XP Benchmark

Usage:
  npm run benchmark:xp -- --recent-days <days>
  npm run benchmark:xp -- --all

Options:
  --codex-home <path>   Override Codex home.
  --recent-days <days>  Benchmark a rolling N * 24 hour window.
  --all                 Benchmark all scanned history.
  --json                Print sanitized JSON.
`;

async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      console.log(USAGE.trimEnd());
      return 0;
    }

    const codexHome = await resolveCodexHome({ cliCodexHome: args.codexHome });
    const since = args.all || args.recentDays === undefined ? undefined : daysBefore(new Date(), args.recentDays);
    const scanResult = await scanSessions(codexHome, { since });
    const usage = sumLifetimeUsage(scanResult.observations.map(({ usage }) => usage));
    const results = economyCandidates.map((candidate) => simulateEconomy(scanResult.observations, candidate));
    const windowLabel = args.all ? "all" : `recent-${args.recentDays}-days`;

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            window: windowLabel,
            filesScanned: scanResult.filesScanned,
            observationCount: scanResult.observations.length,
            usage,
            warnings: scanResult.warnings,
            results: results.map(toJsonResult)
          },
          null,
          2
        )
      );
      return 0;
    }

    printTextSummary(windowLabel, scanResult.filesScanned, scanResult.observations.length, usage, scanResult.warnings, results);
    return 0;
  } catch (error) {
    if (error instanceof UserFacingError) {
      console.error(`Error: ${sanitizeErrorMessage(error.message)}`);
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unexpected error: ${message}`);
    return 1;
  }
}

function parseArgs(argv: string[]): BenchmarkArgs {
  const args: BenchmarkArgs = {
    all: false,
    help: false,
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h" || arg === "help") {
      args.help = true;
      return args;
    }

    if (arg === "--codex-home") {
      args.codexHome = requireValue(argv, (index += 1), arg);
      continue;
    }

    if (arg === "--recent-days") {
      args.recentDays = parsePositiveInteger(requireValue(argv, (index += 1), arg), "--recent-days");
      continue;
    }

    if (arg === "--all") {
      args.all = true;
      continue;
    }

    if (arg === "--json") {
      args.json = true;
      continue;
    }

    throw new UserFacingError(`Unknown option: ${arg}\n\n${USAGE.trimEnd()}`);
  }

  if (args.all && args.recentDays !== undefined) {
    throw new UserFacingError("Use either --all or --recent-days, not both.");
  }

  if (!args.all && args.recentDays === undefined) {
    args.recentDays = 30;
  }

  return args;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new UserFacingError(`Missing value for ${flag}.`);
  }

  return value;
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new UserFacingError(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function printTextSummary(
  windowLabel: string,
  filesScanned: number,
  observationCount: number,
  usage: LifetimeUsage,
  warnings: ScannerWarnings,
  results: EconomySimulationResult[]
): void {
  console.log("Codex Pet Battle XP Benchmark");
  console.log(`Window: ${windowLabel}`);
  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Observations: ${observationCount}`);
  console.log(`Lifetime tokens: ${usage.lifetimeTotalTokens}`);
  console.log(`  input: ${usage.lifetimeInputTokens}`);
  console.log(`  cached input: ${usage.lifetimeCachedInputTokens}`);
  console.log(`  output: ${usage.lifetimeOutputTokens}`);
  console.log(`  reasoning output: ${usage.lifetimeReasoningOutputTokens}`);
  console.log(
    `Warnings: malformedJsonLines=${warnings.malformedJsonLines}, unknownTokenShapes=${warnings.unknownTokenShapes}, unreadableFiles=${warnings.unreadableFiles}`
  );
  console.log("");

  for (const result of results) {
    console.log(`Candidate: ${result.candidateName}`);
    console.log(`  Formula: ${result.formulaName}`);
    console.log(`  Level curve: ${result.levelCurveName}`);
    console.log(`  Daily cap: ${result.dailyCapName}`);
    console.log(`  Weekly cap: ${result.weeklyCapName}`);
    console.log(`  Import mode: ${result.importMode}${result.importCapXp === undefined ? "" : ` (${result.importCapXp} XP)`}`);
    console.log(`  Raw XP: ${formatXp(result.rawXp)}`);
    console.log(`  Daily capped XP: ${formatXp(result.dailyCappedXp)}`);
    console.log(`  Weekly capped XP: ${formatXp(result.weeklyCappedXp)}`);
    console.log(`  Final XP: ${formatXp(result.finalXp)}`);
    console.log(`  Result: Level ${result.level}, XP ${result.xpIntoLevel}/${result.xpToNextLevel}`);
    console.log("  Level calculation: floors fractional final XP");
    console.log(`  Active days: ${result.dailyBuckets.length}`);
    console.log(`  Active weeks: ${result.weeklyBuckets.length}`);
    console.log("  Daily XP:");
    for (const bucket of result.dailyBuckets) {
      console.log(`    ${bucket.day}: raw=${formatXp(bucket.rawXp)}, capped=${formatXp(bucket.dailyCappedXp)}`);
    }
    console.log("  Weekly XP:");
    for (const bucket of result.weeklyBuckets) {
      console.log(`    ${bucket.week}: beforeWeeklyCap=${formatXp(bucket.beforeWeeklyCapXp)}, capped=${formatXp(bucket.weeklyCappedXp)}`);
    }
    console.log("");
  }
}

function toJsonResult(result: EconomySimulationResult): Record<string, unknown> {
  return {
    candidateName: result.candidateName,
    formulaName: result.formulaName,
    levelCurveName: result.levelCurveName,
    dailyCapName: result.dailyCapName,
    weeklyCapName: result.weeklyCapName,
    importMode: result.importMode,
    importCapXp: result.importCapXp,
    observationCount: result.observationCount,
    rawXp: round(result.rawXp),
    dailyCappedXp: round(result.dailyCappedXp),
    weeklyCappedXp: round(result.weeklyCappedXp),
    finalXp: round(result.finalXp),
    level: result.level,
    xpIntoLevel: result.xpIntoLevel,
    xpToNextLevel: result.xpToNextLevel,
    activeDays: result.dailyBuckets.length,
    activeWeeks: result.weeklyBuckets.length,
    dailyBuckets: result.dailyBuckets.map((bucket) => ({
      day: bucket.day,
      rawXp: round(bucket.rawXp),
      dailyCappedXp: round(bucket.dailyCappedXp)
    })),
    weeklyBuckets: result.weeklyBuckets.map((bucket) => ({
      week: bucket.week,
      beforeWeeklyCapXp: round(bucket.beforeWeeklyCapXp),
      weeklyCappedXp: round(bucket.weeklyCappedXp)
    }))
  };
}

function formatXp(value: number): string {
  return round(value).toString();
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

main().then((exitCode) => {
  process.exitCode = exitCode;
});

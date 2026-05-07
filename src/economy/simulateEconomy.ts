import type { LifetimeUsage, TokenObservation, TokenUsage } from "../types.js";
import { applyLevelCurve } from "./levelCurves.js";
import type {
  DailyXpBucket,
  EconomyCandidate,
  EconomySimulationResult,
  SimulationOptions,
  WeeklyXpBucket
} from "./types.js";

export function simulateEconomy(
  observations: TokenObservation[],
  candidate: EconomyCandidate,
  options: SimulationOptions = {}
): EconomySimulationResult {
  const usage = sumLifetimeUsage(observations.map(({ usage }) => usage));
  const rawXpByDay = new Map<string, number>();
  let rawXp = 0;

  for (const observation of observations) {
    const observationRawXp = candidate.formula.calculateRawXp(observation.usage);
    rawXp += observationRawXp;

    const day = dayBucket(observation.timestamp);
    rawXpByDay.set(day, (rawXpByDay.get(day) ?? 0) + observationRawXp);
  }

  const dailyBuckets = [...rawXpByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, dayRawXp]): DailyXpBucket => ({
      day,
      rawXp: dayRawXp,
      dailyCappedXp: candidate.dailyCap.apply(dayRawXp)
    }));

  const dailyCappedXp = sum(dailyBuckets.map(({ dailyCappedXp }) => dailyCappedXp));
  const weeklyBuckets = applyWeeklyCap(dailyBuckets, candidate.weeklyCap.maxXpPerWeek);
  const weeklyCappedXp = sum(weeklyBuckets.map(({ weeklyCappedXp }) => weeklyCappedXp));
  const finalXp = applyImportMode(weeklyCappedXp, candidate);
  const levelResult = applyLevelCurve(finalXp, candidate.levelCurve, options.initialLevel, options.initialXp);

  return {
    candidateName: candidate.name,
    formulaName: candidate.formula.name,
    levelCurveName: candidate.levelCurve.name,
    dailyCapName: candidate.dailyCap.name,
    weeklyCapName: candidate.weeklyCap.name,
    importMode: candidate.importMode,
    importCapXp: candidate.importCapXp,
    observationCount: observations.length,
    usage,
    rawXp,
    dailyCappedXp,
    weeklyCappedXp,
    finalXp,
    level: levelResult.level,
    xpIntoLevel: levelResult.xpIntoLevel,
    xpToNextLevel: levelResult.xpToNextLevel,
    dailyBuckets,
    weeklyBuckets
  };
}

export function sumLifetimeUsage(usages: TokenUsage[]): LifetimeUsage {
  return usages.reduce<LifetimeUsage>(
    (total, usage) => ({
      lifetimeInputTokens: total.lifetimeInputTokens + usage.inputTokens,
      lifetimeCachedInputTokens: total.lifetimeCachedInputTokens + usage.cachedInputTokens,
      lifetimeOutputTokens: total.lifetimeOutputTokens + usage.outputTokens,
      lifetimeReasoningOutputTokens: total.lifetimeReasoningOutputTokens + usage.reasoningOutputTokens,
      lifetimeTotalTokens: total.lifetimeTotalTokens + usage.totalTokens
    }),
    {
      lifetimeInputTokens: 0,
      lifetimeCachedInputTokens: 0,
      lifetimeOutputTokens: 0,
      lifetimeReasoningOutputTokens: 0,
      lifetimeTotalTokens: 0
    }
  );
}

function applyWeeklyCap(dailyBuckets: DailyXpBucket[], maxXpPerWeek: number | undefined): WeeklyXpBucket[] {
  const weekly = new Map<string, number>();

  for (const bucket of dailyBuckets) {
    const week = weekBucket(bucket.day);
    weekly.set(week, (weekly.get(week) ?? 0) + bucket.dailyCappedXp);
  }

  return [...weekly.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([week, beforeWeeklyCapXp]) => ({
      week,
      beforeWeeklyCapXp,
      weeklyCappedXp: maxXpPerWeek === undefined ? beforeWeeklyCapXp : Math.min(beforeWeeklyCapXp, maxXpPerWeek)
    }));
}

function applyImportMode(xp: number, candidate: EconomyCandidate): number {
  if (candidate.importMode === "profile-only") {
    return 0;
  }

  if (candidate.importMode === "cap") {
    return Math.min(xp, candidate.importCapXp ?? xp);
  }

  return xp;
}

function dayBucket(timestamp: string): string {
  const parsedTime = Date.parse(timestamp);
  if (Number.isNaN(parsedTime)) {
    return "unknown";
  }

  return new Date(parsedTime).toISOString().slice(0, 10);
}

function weekBucket(day: string): string {
  if (day === "unknown") {
    return "unknown";
  }

  const date = new Date(`${day}T00:00:00.000Z`);
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

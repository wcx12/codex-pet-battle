import { ECONOMY_VERSION } from "./constants.js";
import { hardDailySoftCap, hardWeeklyCap } from "./economy/caps.js";
import { outputFocusedFormula } from "./economy/formulas.js";
import { applyLevelCurve, milestoneCurve } from "./economy/levelCurves.js";
import { PET_SKILL_CATALOG } from "./skillCatalog.js";
import type {
  LifetimeUsage,
  PetState,
  ProgressionResult,
  TokenObservation,
  TokenUsage
} from "./types.js";

const HARD_DAILY_TIERS = [
  { size: 6, rate: 1 },
  { size: 14, rate: 0.35 },
  { size: 40, rate: 0.1 }
] as const;

export function xpToNextLevel(level: number): number {
  return milestoneCurve.xpToNextLevel(level);
}

export function applyProgression(
  state: PetState,
  observations: TokenObservation[],
  now = new Date()
): ProgressionResult {
  const existingObservationIds = new Set(state.processedObservations);
  const processedObservationIds: string[] = [];
  const usageDelta = createEmptyLifetimeUsage();
  const rawXpByDay = new Map<string, number>();

  for (const observation of observations) {
    if (existingObservationIds.has(observation.id)) {
      continue;
    }

    existingObservationIds.add(observation.id);
    processedObservationIds.push(observation.id);

    const normalizedUsage = normalizeUsage(observation.usage);
    addUsageDelta(usageDelta, normalizedUsage);

    const rawXp = outputFocusedFormula.calculateRawXp(normalizedUsage);
    const day = dayBucket(observation.timestamp);
    rawXpByDay.set(day, (rawXpByDay.get(day) ?? 0) + rawXp);
  }

  const rawXp = sum([...rawXpByDay.values()]);
  const nextDailyLedger = { ...state.economy.dailyXpLedger };
  const nextWeeklyLedger = { ...state.economy.weeklyXpLedger };
  let dailyCappedXp = 0;
  let weeklyCappedXp = 0;

  for (const [day, dayRawXp] of [...rawXpByDay.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const existingDayCappedXp = nextDailyLedger[day] ?? 0;
    const dayIncrement = applyHardDailyIncrement(dayRawXp, existingDayCappedXp);
    nextDailyLedger[day] = roundLedgerValue(existingDayCappedXp + dayIncrement);
    dailyCappedXp += dayIncrement;

    const week = weekBucket(day);
    const existingWeekCappedXp = nextWeeklyLedger[week] ?? 0;
    const weekIncrement = applyHardWeeklyIncrement(dayIncrement, existingWeekCappedXp);
    nextWeeklyLedger[week] = roundLedgerValue(existingWeekCappedXp + weekIncrement);
    weeklyCappedXp += weekIncrement;
  }

  const importApplied = !state.economy.initialImportCompleted && processedObservationIds.length > 0;
  const importMode: ProgressionResult["importMode"] = importApplied ? "profile-only" : "none";
  const finalXp = importApplied ? 0 : weeklyCappedXp;
  const totalIntegerXp = roundLedgerValue(state.economy.xpRemainder + finalXp);
  const gainedXp = Math.floor(totalIntegerXp);
  const xpRemainder = roundLedgerValue(totalIntegerXp - gainedXp);

  const levelResult = applyLevelCurve(gainedXp, milestoneCurve, state.pet.level, state.pet.xp);
  const previousSkills = new Set(state.pet.skills);
  const newlyUnlockedSkills = PET_SKILL_CATALOG.filter(
    ({ unlockLevel, id }) => levelResult.level >= unlockLevel && !previousSkills.has(id)
  ).map(({ id }) => id);

  const didChange =
    processedObservationIds.length > 0 ||
    gainedXp > 0 ||
    importApplied ||
    newlyUnlockedSkills.length > 0;
  const updatedAt = didChange ? now.toISOString() : state.updatedAt;

  return {
    state: {
      ...state,
      pet: {
        ...state.pet,
        level: levelResult.level,
        xp: levelResult.xpIntoLevel,
        xpToNextLevel: levelResult.xpToNextLevel,
        skills: [...state.pet.skills, ...newlyUnlockedSkills]
      },
      usage: {
        lifetimeInputTokens:
          state.usage.lifetimeInputTokens + usageDelta.lifetimeInputTokens,
        lifetimeCachedInputTokens:
          state.usage.lifetimeCachedInputTokens +
          usageDelta.lifetimeCachedInputTokens,
        lifetimeOutputTokens:
          state.usage.lifetimeOutputTokens + usageDelta.lifetimeOutputTokens,
        lifetimeReasoningOutputTokens:
          state.usage.lifetimeReasoningOutputTokens +
          usageDelta.lifetimeReasoningOutputTokens,
        lifetimeTotalTokens:
          state.usage.lifetimeTotalTokens + usageDelta.lifetimeTotalTokens
      },
      economy: {
        ...state.economy,
        version: ECONOMY_VERSION,
        initialImportCompleted: state.economy.initialImportCompleted || importApplied,
        dailyXpLedger: nextDailyLedger,
        weeklyXpLedger: nextWeeklyLedger,
        xpRemainder: importApplied ? state.economy.xpRemainder : xpRemainder
      },
      processedObservations: [
        ...state.processedObservations,
        ...processedObservationIds
      ],
      updatedAt
    },
    gainedXp,
    rawXp,
    dailyCappedXp,
    weeklyCappedXp,
    finalXp,
    importMode,
    importApplied,
    economyVersion: ECONOMY_VERSION,
    newlyUnlockedSkills,
    processedObservationIds
  };
}

function applyHardDailyIncrement(rawXp: number, existingCappedXp: number): number {
  const rawEquivalent = rawEquivalentFromHardDailyCappedXp(existingCappedXp);
  const cappedBefore = hardDailySoftCap.apply(rawEquivalent);
  const cappedAfter = hardDailySoftCap.apply(rawEquivalent + rawXp);
  return Math.max(0, cappedAfter - cappedBefore);
}

function rawEquivalentFromHardDailyCappedXp(cappedXp: number): number {
  let remainingCapped = Math.max(0, cappedXp);
  let rawEquivalent = 0;

  for (const tier of HARD_DAILY_TIERS) {
    const tierCappedSize = tier.size * tier.rate;
    const cappedInTier = Math.min(remainingCapped, tierCappedSize);
    rawEquivalent += cappedInTier / tier.rate;
    remainingCapped -= cappedInTier;

    if (remainingCapped <= 0) {
      return rawEquivalent;
    }
  }

  return rawEquivalent;
}

function applyHardWeeklyIncrement(xp: number, existingWeeklyXp: number): number {
  const maxXpPerWeek = hardWeeklyCap.maxXpPerWeek;
  if (maxXpPerWeek === undefined) {
    return xp;
  }

  return Math.max(0, Math.min(xp, maxXpPerWeek - existingWeeklyXp));
}

function normalizeUsage(usage: TokenUsage): TokenUsage {
  return {
    inputTokens: toNonNegativeInteger(usage.inputTokens),
    cachedInputTokens: toNonNegativeInteger(usage.cachedInputTokens),
    outputTokens: toNonNegativeInteger(usage.outputTokens),
    reasoningOutputTokens: toNonNegativeInteger(usage.reasoningOutputTokens),
    totalTokens: toNonNegativeInteger(usage.totalTokens)
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
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

function createEmptyLifetimeUsage(): LifetimeUsage {
  return {
    lifetimeInputTokens: 0,
    lifetimeCachedInputTokens: 0,
    lifetimeOutputTokens: 0,
    lifetimeReasoningOutputTokens: 0,
    lifetimeTotalTokens: 0
  };
}

function addUsageDelta(usageDelta: LifetimeUsage, usage: TokenUsage): void {
  usageDelta.lifetimeInputTokens += usage.inputTokens;
  usageDelta.lifetimeCachedInputTokens += usage.cachedInputTokens;
  usageDelta.lifetimeOutputTokens += usage.outputTokens;
  usageDelta.lifetimeReasoningOutputTokens += usage.reasoningOutputTokens;
  usageDelta.lifetimeTotalTokens += usage.totalTokens;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundLedgerValue(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

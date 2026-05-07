import type {
  LifetimeUsage,
  PetState,
  ProgressionResult,
  TokenObservation,
  TokenUsage
} from "./types.js";

const SKILL_UNLOCKS = [
  { level: 2, skill: "token_spark" },
  { level: 3, skill: "context_sense" },
  { level: 5, skill: "test_shield" },
  { level: 8, skill: "refactor_aura" },
  { level: 10, skill: "battle_ready" }
] as const;

export function xpToNextLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level));
  return 100 + (normalizedLevel - 1) * 50;
}

export function applyProgression(
  state: PetState,
  observations: TokenObservation[],
  now = new Date()
): ProgressionResult {
  const existingObservationIds = new Set(state.processedObservations);
  const processedObservationIds: string[] = [];
  const usageDelta = createEmptyLifetimeUsage();

  let fractionalXp = 0;
  let hasPositiveActivity = false;

  for (const observation of observations) {
    if (existingObservationIds.has(observation.id)) {
      continue;
    }

    existingObservationIds.add(observation.id);
    processedObservationIds.push(observation.id);

    const normalizedUsage = normalizeUsage(observation.usage);
    addUsageDelta(usageDelta, normalizedUsage);

    fractionalXp += xpFromUsage(normalizedUsage);
    hasPositiveActivity ||= hasPositiveUsage(normalizedUsage);
  }

  const gainedXp =
    hasPositiveActivity && fractionalXp < 1 ? 1 : Math.floor(fractionalXp);

  let level = state.pet.level;
  let xp = state.pet.xp + gainedXp;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }

  const previousSkills = new Set(state.pet.skills);
  const newlyUnlockedSkills = SKILL_UNLOCKS.filter(
    ({ level: unlockLevel, skill }) => level >= unlockLevel && !previousSkills.has(skill)
  ).map(({ skill }) => skill);

  const skills = [...state.pet.skills, ...newlyUnlockedSkills];
  const didChange =
    processedObservationIds.length > 0 ||
    gainedXp > 0 ||
    level !== state.pet.level ||
    xp !== state.pet.xp ||
    newlyUnlockedSkills.length > 0;

  const updatedAt = didChange ? now.toISOString() : state.updatedAt;

  return {
    state: {
      ...state,
      pet: {
        ...state.pet,
        level,
        xp,
        xpToNextLevel: xpToNextLevel(level),
        skills
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
      processedObservations: [
        ...state.processedObservations,
        ...processedObservationIds
      ],
      updatedAt
    },
    gainedXp,
    newlyUnlockedSkills,
    processedObservationIds
  };
}

function xpFromUsage(usage: TokenUsage): number {
  const uncachedInputTokens = Math.max(
    usage.inputTokens - usage.cachedInputTokens,
    0
  );

  return (
    uncachedInputTokens / 1000 +
    usage.cachedInputTokens / 5000 +
    usage.outputTokens / 250 +
    usage.reasoningOutputTokens / 250
  );
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

function hasPositiveUsage(usage: TokenUsage): boolean {
  return (
    usage.inputTokens > 0 ||
    usage.cachedInputTokens > 0 ||
    usage.outputTokens > 0 ||
    usage.reasoningOutputTokens > 0 ||
    usage.totalTokens > 0
  );
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

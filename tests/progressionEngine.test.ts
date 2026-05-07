import { describe, expect, it } from "vitest";

import {
  applyProgression,
  xpToNextLevel
} from "../src/progressionEngine.js";
import { createDefaultPetState } from "../src/petStateStore.js";
import type { PetState, TokenObservation, TokenUsage } from "../src/types.js";

describe("xpToNextLevel", () => {
  it("uses the phase 1 linear level curve", () => {
    expect(xpToNextLevel(1)).toBe(100);
    expect(xpToNextLevel(2)).toBe(150);
    expect(xpToNextLevel(10)).toBe(550);
  });
});

describe("applyProgression", () => {
  it("calculates XP from all token buckets after summing observations", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const result = applyProgression(
      state,
      [
        observation("obs-1", {
          inputTokens: 1500,
          cachedInputTokens: 500,
          outputTokens: 250,
          reasoningOutputTokens: 125,
          totalTokens: 2375
        }),
        observation("obs-2", {
          inputTokens: 500,
          cachedInputTokens: 0,
          outputTokens: 125,
          reasoningOutputTokens: 0,
          totalTokens: 625
        })
      ],
      new Date("2026-05-07T01:00:00.000Z")
    );

    expect(result.gainedXp).toBe(3);
    expect(result.state.pet.xp).toBe(3);
    expect(result.state.usage).toEqual({
      lifetimeInputTokens: 2000,
      lifetimeCachedInputTokens: 500,
      lifetimeOutputTokens: 375,
      lifetimeReasoningOutputTokens: 125,
      lifetimeTotalTokens: 3000
    });
    expect(result.processedObservationIds).toEqual(["obs-1", "obs-2"]);
    expect(result.state.updatedAt).toBe("2026-05-07T01:00:00.000Z");
  });

  it("grants at least 1 XP for positive activity below the first full XP", () => {
    const state = createDefaultPetState();
    const result = applyProgression(state, [
      observation("tiny", {
        inputTokens: 1,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 1
      })
    ]);

    expect(result.gainedXp).toBe(1);
    expect(result.state.pet.xp).toBe(1);
  });

  it("does not grant XP for empty usage but still records the observation", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const result = applyProgression(
      state,
      [
        observation("empty", {
          inputTokens: 0,
          cachedInputTokens: 0,
          outputTokens: 0,
          reasoningOutputTokens: 0,
          totalTokens: 0
        })
      ],
      new Date("2026-05-07T02:00:00.000Z")
    );

    expect(result.gainedXp).toBe(0);
    expect(result.state.pet.xp).toBe(0);
    expect(result.processedObservationIds).toEqual(["empty"]);
  });

  it("clamps cached input XP so cached tokens cannot make uncached input negative", () => {
    const state = createDefaultPetState();
    const result = applyProgression(state, [
      observation("cached-heavy", {
        inputTokens: 100,
        cachedInputTokens: 5100,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 5200
      })
    ]);

    expect(result.gainedXp).toBe(1);
  });

  it("carries XP over across multiple level-ups and unlocks skills in order", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const result = applyProgression(
      state,
      [
        observation("big-output", {
          inputTokens: 0,
          cachedInputTokens: 0,
          outputTokens: 90000,
          reasoningOutputTokens: 0,
          totalTokens: 90000
        })
      ],
      new Date("2026-05-07T03:00:00.000Z")
    );

    expect(result.gainedXp).toBe(360);
    expect(result.state.pet.level).toBe(3);
    expect(result.state.pet.xp).toBe(110);
    expect(result.state.pet.xpToNextLevel).toBe(200);
    expect(result.newlyUnlockedSkills).toEqual([
      "token_spark",
      "context_sense"
    ]);
    expect(result.state.pet.skills).toEqual([
      "token_spark",
      "context_sense"
    ]);
  });

  it("unlocks the initial milestone skills through level 10", () => {
    const state = createDefaultPetState();
    const result = applyProgression(state, [
      observation("level-ten", {
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 687500,
        reasoningOutputTokens: 0,
        totalTokens: 687500
      })
    ]);

    expect(result.state.pet.level).toBe(10);
    expect(result.newlyUnlockedSkills).toEqual([
      "token_spark",
      "context_sense",
      "test_shield",
      "refactor_aura",
      "battle_ready"
    ]);
  });

  it("does not reprocess observations already recorded in state", () => {
    const state: PetState = {
      ...createDefaultPetState(),
      processedObservations: ["already-seen"]
    };
    const result = applyProgression(state, [
      observation("already-seen", {
        inputTokens: 10000,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 10000
      }),
      observation("new", {
        inputTokens: 1000,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 1000
      }),
      observation("new", {
        inputTokens: 1000,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        totalTokens: 1000
      })
    ]);

    expect(result.gainedXp).toBe(1);
    expect(result.processedObservationIds).toEqual(["new"]);
    expect(result.state.processedObservations).toEqual(["already-seen", "new"]);
  });
});

function observation(id: string, usage: TokenUsage): TokenObservation {
  return {
    id,
    sessionRelativePath: "sessions/2026/05/07/rollout-test.jsonl",
    lineNumber: 1,
    timestamp: "2026-05-07T00:00:00.000Z",
    usage
  };
}

import { describe, expect, it } from "vitest";

import {
  applyProgression,
  xpToNextLevel
} from "../src/progressionEngine.js";
import { createDefaultPetState } from "../src/petStateStore.js";
import type { PetState, TokenObservation, TokenUsage } from "../src/types.js";

describe("xpToNextLevel", () => {
  it("uses the hard milestone curve", () => {
    expect(xpToNextLevel(1)).toBe(100);
    expect(xpToNextLevel(2)).toBe(180);
    expect(xpToNextLevel(9)).toBe(1450);
    expect(xpToNextLevel(10)).toBe(1850);
  });
});

describe("applyProgression", () => {
  it("treats the first import as profile-only", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const result = applyProgression(
      state,
      [
        observation("first-import", "2026-05-07T01:00:00.000Z", {
          outputTokens: 12000,
          totalTokens: 12000
        })
      ],
      new Date("2026-05-07T02:00:00.000Z")
    );

    expect(result.importApplied).toBe(true);
    expect(result.importMode).toBe("profile-only");
    expect(result.rawXp).toBe(1);
    expect(result.finalXp).toBe(0);
    expect(result.gainedXp).toBe(0);
    expect(result.dailyCappedXp).toBe(1);
    expect(result.weeklyCappedXp).toBe(1);
    expect(result.state.pet.level).toBe(1);
    expect(result.state.pet.xp).toBe(0);
    expect(result.state.economy.initialImportCompleted).toBe(true);
    expect(result.state.economy.dailyXpLedger["2026-05-07"]).toBe(1);
    expect(result.state.economy.weeklyXpLedger["2026-05-04"]).toBe(1);
    expect(result.state.processedObservations).toEqual(["first-import"]);
    expect(result.state.usage.lifetimeOutputTokens).toBe(12000);
  });

  it("awards output-focused XP after the initial import is complete", () => {
    const state = importedState();
    const result = applyProgression(
      state,
      [
        observation("daily-work", "2026-05-07T01:00:00.000Z", {
          outputTokens: 12000,
          totalTokens: 12000
        })
      ],
      new Date("2026-05-07T02:00:00.000Z")
    );

    expect(result.importApplied).toBe(false);
    expect(result.rawXp).toBe(1);
    expect(result.dailyCappedXp).toBe(1);
    expect(result.weeklyCappedXp).toBe(1);
    expect(result.finalXp).toBe(1);
    expect(result.gainedXp).toBe(1);
    expect(result.state.pet.xp).toBe(1);
    expect(result.state.economy.dailyXpLedger["2026-05-07"]).toBe(1);
    expect(result.state.economy.weeklyXpLedger["2026-05-04"]).toBe(1);
  });

  it("does not grant minimum 1 XP for tiny activity", () => {
    const result = applyProgression(importedState(), [
      observation("tiny", "2026-05-07T01:00:00.000Z", {
        inputTokens: 1,
        totalTokens: 1
      })
    ]);

    expect(result.rawXp).toBe(0.000004);
    expect(result.gainedXp).toBe(0);
    expect(result.state.pet.xp).toBe(0);
    expect(result.state.economy.xpRemainder).toBe(0.000004);
  });

  it("does not reward cached input with XP", () => {
    const result = applyProgression(importedState(), [
      observation("cached", "2026-05-07T01:00:00.000Z", {
        inputTokens: 1000000,
        cachedInputTokens: 1000000,
        totalTokens: 1000000
      })
    ]);

    expect(result.rawXp).toBe(0);
    expect(result.gainedXp).toBe(0);
    expect(result.state.usage.lifetimeInputTokens).toBe(1000000);
    expect(result.state.usage.lifetimeCachedInputTokens).toBe(1000000);
  });

  it("enforces daily cap across repeated scans", () => {
    const first = applyProgression(importedState(), [
      observation("big-day-1", "2026-05-07T01:00:00.000Z", {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    ]);
    const second = applyProgression(first.state, [
      observation("big-day-2", "2026-05-07T02:00:00.000Z", {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    ]);

    expect(first.rawXp).toBe(100);
    expect(first.dailyCappedXp).toBeCloseTo(14.9);
    expect(first.gainedXp).toBe(14);
    expect(first.state.economy.xpRemainder).toBeCloseTo(0.9);
    expect(second.dailyCappedXp).toBe(0);
    expect(second.gainedXp).toBe(0);
    expect(second.state.economy.dailyXpLedger["2026-05-07"]).toBeCloseTo(14.9);
  });

  it("enforces weekly cap across multiple days", () => {
    const state = importedState();
    const observations = Array.from({ length: 6 }, (_, index) =>
      observation(`week-${index}`, `2026-05-${String(4 + index).padStart(2, "0")}T01:00:00.000Z`, {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    );
    const result = applyProgression(state, observations);

    expect(result.dailyCappedXp).toBeCloseTo(89.4);
    expect(result.weeklyCappedXp).toBe(80);
    expect(result.gainedXp).toBe(80);
    expect(result.state.economy.weeklyXpLedger["2026-05-04"]).toBe(80);
  });

  it("enforces weekly cap across repeated scans", () => {
    let state = importedState();

    for (const day of ["04", "05", "06", "07", "08"]) {
      const result = applyProgression(state, [
        observation(`week-repeat-${day}`, `2026-05-${day}T01:00:00.000Z`, {
          outputTokens: 1200000,
          totalTokens: 1200000
        })
      ]);
      state = result.state;
    }

    const cappedOut = applyProgression(state, [
      observation("week-repeat-09", "2026-05-09T01:00:00.000Z", {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    ]);

    expect(state.economy.weeklyXpLedger["2026-05-04"]).toBeCloseTo(74.5);
    expect(cappedOut.dailyCappedXp).toBeCloseTo(14.9);
    expect(cappedOut.weeklyCappedXp).toBeCloseTo(5.5);
    expect(cappedOut.gainedXp).toBe(6);
    expect(cappedOut.state.economy.weeklyXpLedger["2026-05-04"]).toBe(80);

    const afterCap = applyProgression(cappedOut.state, [
      observation("week-repeat-10", "2026-05-10T01:00:00.000Z", {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    ]);

    expect(afterCap.dailyCappedXp).toBeCloseTo(14.9);
    expect(afterCap.weeklyCappedXp).toBe(0);
    expect(afterCap.gainedXp).toBe(0);
    expect(afterCap.state.usage.lifetimeOutputTokens).toBe(8400000);
    expect(afterCap.state.processedObservations).toContain("week-repeat-10");
  });

  it("carries XP over levels and unlocks skills", () => {
    const observations = Array.from({ length: 7 }, (_, index) =>
      observation(`multi-week-${index}`, `2026-0${index + 1}-05T01:00:00.000Z`, {
        outputTokens: 1200000,
        totalTokens: 1200000
      })
    );
    const result = applyProgression(importedState(), observations);

    expect(result.gainedXp).toBe(104);
    expect(result.state.pet.level).toBe(2);
    expect(result.state.pet.xp).toBe(4);
    expect(result.newlyUnlockedSkills).toEqual(["token_spark"]);
  });

  it("does not reprocess observations already recorded in state", () => {
    const state: PetState = {
      ...importedState(),
      processedObservations: ["already-seen"]
    };
    const result = applyProgression(state, [
      observation("already-seen", "2026-05-07T01:00:00.000Z", {
        outputTokens: 12000,
        totalTokens: 12000
      }),
      observation("new", "2026-05-07T02:00:00.000Z", {
        outputTokens: 12000,
        totalTokens: 12000
      }),
      observation("new", "2026-05-07T02:00:00.000Z", {
        outputTokens: 12000,
        totalTokens: 12000
      })
    ]);

    expect(result.gainedXp).toBe(1);
    expect(result.processedObservationIds).toEqual(["new"]);
    expect(result.state.processedObservations).toEqual(["already-seen", "new"]);
  });
});

function importedState(): PetState {
  return {
    ...createDefaultPetState(new Date("2026-05-07T00:00:00.000Z")),
    economy: {
      ...createDefaultPetState().economy,
      initialImportCompleted: true
    }
  };
}

function observation(id: string, timestamp: string, usageOverride: Partial<TokenUsage>): TokenObservation {
  return {
    id,
    sessionRelativePath: "sessions/2026/05/07/rollout-test.jsonl",
    lineNumber: 1,
    timestamp,
    usage: usage(usageOverride)
  };
}

function usage(override: Partial<TokenUsage>): TokenUsage {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
    ...override
  };
}

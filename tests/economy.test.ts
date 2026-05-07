import { describe, expect, it } from "vitest";
import { hardDailySoftCap, hardWeeklyCap, moderateDailySoftCap, noDailyCap, noWeeklyCap } from "../src/economy/caps.js";
import {
  baselineMvpFormula,
  hardLinearFormula,
  logCompressionFormula,
  outputFocusedFormula,
  sqrtCompressionFormula
} from "../src/economy/formulas.js";
import { applyLevelCurve, baselineLinearCurve, hardQuadraticCurve, milestoneCurve } from "../src/economy/levelCurves.js";
import { simulateEconomy } from "../src/economy/simulateEconomy.js";
import type { EconomyCandidate } from "../src/economy/types.js";
import type { TokenObservation, TokenUsage } from "../src/types.js";

describe("economy formulas", () => {
  it("keeps the MVP baseline formula available for benchmark comparison", () => {
    expect(
      baselineMvpFormula.calculateRawXp(
        usage({
          inputTokens: 1000,
          cachedInputTokens: 0,
          outputTokens: 250,
          reasoningOutputTokens: 250,
          totalTokens: 1500
        })
      )
    ).toBe(3);
  });

  it("does not reward cached input in the output-focused formula", () => {
    expect(
      outputFocusedFormula.calculateRawXp(
        usage({
          inputTokens: 1000000,
          cachedInputTokens: 1000000,
          outputTokens: 0,
          reasoningOutputTokens: 0,
          totalTokens: 1000000
        })
      )
    ).toBe(0);
  });

  it("covers hard linear formula weights", () => {
    expect(
      hardLinearFormula.calculateRawXp(
        usage({
          inputTokens: 200000,
          cachedInputTokens: 100000,
          outputTokens: 20000,
          reasoningOutputTokens: 20000,
          totalTokens: 240000
        })
      )
    ).toBe(3.1);
  });

  it("covers compression formulas", () => {
    const sample = usage({
      inputTokens: 100000,
      cachedInputTokens: 50000,
      outputTokens: 10000,
      reasoningOutputTokens: 10000,
      totalTokens: 120000
    });

    expect(sqrtCompressionFormula.calculateRawXp(sample)).toBeGreaterThan(0);
    expect(logCompressionFormula.calculateRawXp(sample)).toBeGreaterThan(0);
  });
});

describe("level curves", () => {
  it("applies the baseline MVP curve", () => {
    expect(applyLevelCurve(250, baselineLinearCurve)).toEqual({
      level: 3,
      xpIntoLevel: 0,
      xpToNextLevel: 200
    });
  });

  it("applies the milestone curve", () => {
    expect(applyLevelCurve(540, milestoneCurve)).toEqual({
      level: 4,
      xpIntoLevel: 0,
      xpToNextLevel: 380
    });
  });

  it("applies the hard quadratic curve", () => {
    expect(applyLevelCurve(150, hardQuadraticCurve)).toEqual({
      level: 2,
      xpIntoLevel: 0,
      xpToNextLevel: 300
    });
  });
});

describe("cap strategies", () => {
  it("applies hard daily soft cap tiers", () => {
    expect(hardDailySoftCap.apply(100)).toBeCloseTo(14.9);
  });

  it("applies moderate daily soft cap tiers", () => {
    expect(moderateDailySoftCap.apply(100)).toBe(13);
  });

  it("supports no daily and no weekly caps", () => {
    expect(noDailyCap.apply(123.45)).toBe(123.45);
    expect(noWeeklyCap.maxXpPerWeek).toBeUndefined();
  });
});

describe("simulateEconomy", () => {
  it("applies daily and weekly caps without changing lifetime totals", () => {
    const candidate: EconomyCandidate = {
      name: "test-candidate",
      formula: baselineMvpFormula,
      levelCurve: baselineLinearCurve,
      dailyCap: hardDailySoftCap,
      weeklyCap: hardWeeklyCap,
      importMode: "none"
    };
    const observations = [
      observation("a", "2026-05-04T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 }),
      observation("b", "2026-05-05T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 }),
      observation("c", "2026-05-06T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 }),
      observation("d", "2026-05-07T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 }),
      observation("e", "2026-05-08T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 }),
      observation("f", "2026-05-09T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 })
    ];

    const result = simulateEconomy(observations, candidate);

    expect(result.rawXp).toBe(600);
    expect(result.dailyCappedXp).toBeCloseTo(89.4);
    expect(result.weeklyCappedXp).toBe(80);
    expect(result.finalXp).toBe(80);
    expect(result.usage.lifetimeOutputTokens).toBe(150000);
    expect(result.usage.lifetimeTotalTokens).toBe(150000);
  });

  it("supports profile-only import mode", () => {
    const candidate: EconomyCandidate = {
      name: "profile-only",
      formula: baselineMvpFormula,
      levelCurve: baselineLinearCurve,
      dailyCap: hardDailySoftCap,
      weeklyCap: hardWeeklyCap,
      importMode: "profile-only"
    };

    const result = simulateEconomy(
      [observation("a", "2026-05-07T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 })],
      candidate
    );

    expect(result.rawXp).toBe(100);
    expect(result.finalXp).toBe(0);
    expect(result.level).toBe(1);
  });

  it("supports import caps", () => {
    const candidate: EconomyCandidate = {
      name: "import-cap",
      formula: baselineMvpFormula,
      levelCurve: baselineLinearCurve,
      dailyCap: hardDailySoftCap,
      weeklyCap: hardWeeklyCap,
      importMode: "cap",
      importCapXp: 10
    };

    const result = simulateEconomy(
      [observation("a", "2026-05-07T00:00:00.000Z", { outputTokens: 25000, totalTokens: 25000 })],
      candidate
    );

    expect(result.weeklyCappedXp).toBeCloseTo(14.9);
    expect(result.finalXp).toBe(10);
  });
});

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

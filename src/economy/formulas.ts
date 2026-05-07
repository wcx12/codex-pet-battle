import type { EconomyFormula } from "./types.js";
import type { TokenUsage } from "../types.js";

export const baselineMvpFormula: EconomyFormula = {
  name: "mvp-baseline",
  description: "Current MVP formula. Useful as an inflation baseline, not recommended for hard progression.",
  calculateRawXp(usage) {
    const uncachedInputTokens = Math.max(usage.inputTokens - usage.cachedInputTokens, 0);
    return (
      uncachedInputTokens / 1000 +
      usage.cachedInputTokens / 5000 +
      usage.outputTokens / 250 +
      usage.reasoningOutputTokens / 250
    );
  }
};

export const hardLinearFormula: EconomyFormula = {
  name: "hard-linear",
  description: "Very low linear weights with tiny cached input reward.",
  calculateRawXp(usage) {
    const uncachedInputTokens = Math.max(usage.inputTokens - usage.cachedInputTokens, 0);
    return (
      uncachedInputTokens / 100000 +
      usage.cachedInputTokens / 1000000 +
      usage.outputTokens / 20000 +
      usage.reasoningOutputTokens / 20000
    );
  }
};

export const outputFocusedFormula: EconomyFormula = {
  name: "output-focused",
  description: "Rewards output and reasoning, gives cached input no XP.",
  calculateRawXp(usage) {
    const uncachedInputTokens = Math.max(usage.inputTokens - usage.cachedInputTokens, 0);
    return uncachedInputTokens / 250000 + usage.outputTokens / 12000 + usage.reasoningOutputTokens / 12000;
  }
};

export const sqrtCompressionFormula: EconomyFormula = {
  name: "sqrt-compression",
  description: "Weighted token points with square-root compression.",
  calculateRawXp(usage) {
    return Math.sqrt(weightedTokenPoints(usage) / 10000);
  }
};

export const logCompressionFormula: EconomyFormula = {
  name: "log-compression",
  description: "Weighted token points with log2 compression.",
  calculateRawXp(usage) {
    return Math.log2(1 + weightedTokenPoints(usage) / 2500);
  }
};

export const economyFormulas = [
  baselineMvpFormula,
  hardLinearFormula,
  outputFocusedFormula,
  sqrtCompressionFormula,
  logCompressionFormula
] as const;

function weightedTokenPoints(usage: TokenUsage): number {
  const uncachedInputTokens = Math.max(usage.inputTokens - usage.cachedInputTokens, 0);
  return uncachedInputTokens * 0.2 + usage.cachedInputTokens * 0.01 + usage.outputTokens * 2 + usage.reasoningOutputTokens * 2;
}

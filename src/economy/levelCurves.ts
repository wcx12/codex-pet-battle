import type { LevelCurve } from "./types.js";

export const baselineLinearCurve: LevelCurve = {
  name: "mvp-linear",
  description: "Current MVP level curve.",
  xpToNextLevel(level) {
    const normalizedLevel = Math.max(1, Math.floor(level));
    return 100 + (normalizedLevel - 1) * 50;
  }
};

export const hardQuadraticCurve: LevelCurve = {
  name: "hard-quadratic",
  description: "Hard quadratic curve for long-term progression.",
  xpToNextLevel(level) {
    const normalizedLevel = Math.max(1, Math.floor(level));
    const offset = normalizedLevel - 1;
    return 150 + 100 * offset + 50 * offset * offset;
  }
};

const milestoneXpToNext = [100, 180, 260, 380, 520, 700, 900, 1150, 1450] as const;

export const milestoneCurve: LevelCurve = {
  name: "milestone",
  description: "Milestone table curve targeting rare battle_ready unlocks.",
  xpToNextLevel(level) {
    const normalizedLevel = Math.max(1, Math.floor(level));
    if (normalizedLevel <= milestoneXpToNext.length) {
      return milestoneXpToNext[normalizedLevel - 1];
    }

    const extraLevel = normalizedLevel - milestoneXpToNext.length;
    return milestoneXpToNext[milestoneXpToNext.length - 1] + extraLevel * 400;
  }
};

export const levelCurves = [baselineLinearCurve, hardQuadraticCurve, milestoneCurve] as const;

export function applyLevelCurve(totalXp: number, curve: LevelCurve, initialLevel = 1, initialXp = 0): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  let level = Math.max(1, Math.floor(initialLevel));
  let xp = Math.max(0, initialXp + Math.floor(totalXp));

  while (xp >= curve.xpToNextLevel(level)) {
    xp -= curve.xpToNextLevel(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: xp,
    xpToNextLevel: curve.xpToNextLevel(level)
  };
}

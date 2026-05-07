import type { DailyCapStrategy, WeeklyCapStrategy } from "./types.js";

export const noDailyCap: DailyCapStrategy = {
  name: "none",
  description: "No daily cap.",
  apply(rawXp) {
    return rawXp;
  }
};

export const moderateDailySoftCap: DailyCapStrategy = {
  name: "moderate-daily",
  description: "0-5 XP 100%, 5-15 XP 50%, 15-30 XP 20%, 30+ XP 0%.",
  apply(rawXp) {
    return applyTieredCap(rawXp, [
      { size: 5, rate: 1 },
      { size: 10, rate: 0.5 },
      { size: 15, rate: 0.2 }
    ]);
  }
};

export const hardDailySoftCap: DailyCapStrategy = {
  name: "hard-daily",
  description: "0-6 XP 100%, 6-20 XP 35%, 20-60 XP 10%, 60+ XP 0%.",
  apply(rawXp) {
    return applyTieredCap(rawXp, [
      { size: 6, rate: 1 },
      { size: 14, rate: 0.35 },
      { size: 40, rate: 0.1 }
    ]);
  }
};

export const noWeeklyCap: WeeklyCapStrategy = {
  name: "none",
  description: "No weekly cap."
};

export const hardWeeklyCap: WeeklyCapStrategy = {
  name: "hard-weekly",
  description: "80 XP per UTC week.",
  maxXpPerWeek: 80
};

export const dailyCapStrategies = [noDailyCap, moderateDailySoftCap, hardDailySoftCap] as const;

export const weeklyCapStrategies = [noWeeklyCap, hardWeeklyCap] as const;

function applyTieredCap(rawXp: number, tiers: Array<{ size: number; rate: number }>): number {
  let remaining = Math.max(0, rawXp);
  let capped = 0;

  for (const tier of tiers) {
    const applied = Math.min(remaining, tier.size);
    capped += applied * tier.rate;
    remaining -= applied;

    if (remaining <= 0) {
      break;
    }
  }

  return capped;
}

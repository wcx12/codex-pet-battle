import type { LifetimeUsage, ScannerWarnings, TokenObservation, TokenUsage } from "../types.js";

export interface EconomyFormula {
  name: string;
  description: string;
  calculateRawXp(usage: TokenUsage): number;
}

export interface LevelCurve {
  name: string;
  description: string;
  xpToNextLevel(level: number): number;
}

export interface DailyCapStrategy {
  name: string;
  description: string;
  apply(rawXp: number): number;
}

export interface WeeklyCapStrategy {
  name: string;
  description: string;
  maxXpPerWeek?: number;
}

export interface EconomyCandidate {
  name: string;
  formula: EconomyFormula;
  levelCurve: LevelCurve;
  dailyCap: DailyCapStrategy;
  weeklyCap: WeeklyCapStrategy;
  importMode: "none" | "profile-only" | "cap";
  importCapXp?: number;
}

export interface DailyXpBucket {
  day: string;
  rawXp: number;
  dailyCappedXp: number;
}

export interface WeeklyXpBucket {
  week: string;
  beforeWeeklyCapXp: number;
  weeklyCappedXp: number;
}

export interface EconomySimulationResult {
  candidateName: string;
  formulaName: string;
  levelCurveName: string;
  dailyCapName: string;
  weeklyCapName: string;
  importMode: EconomyCandidate["importMode"];
  importCapXp?: number;
  observationCount: number;
  usage: LifetimeUsage;
  rawXp: number;
  dailyCappedXp: number;
  weeklyCappedXp: number;
  finalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  dailyBuckets: DailyXpBucket[];
  weeklyBuckets: WeeklyXpBucket[];
}

export interface BenchmarkSummary {
  windowLabel: string;
  filesScanned: number;
  observationCount: number;
  usage: LifetimeUsage;
  warnings: ScannerWarnings;
  results: EconomySimulationResult[];
}

export interface SimulationOptions {
  initialLevel?: number;
  initialXp?: number;
}

export interface ObservationsByDay {
  day: string;
  observations: TokenObservation[];
}

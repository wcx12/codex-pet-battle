import type { ScannerWarnings } from "../types.js";

export interface DashboardStatus {
  pet: {
    name: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    skills: string[];
  };
  economy: {
    version: string;
    formula: "output-focused";
    levelCurve: "milestone";
    dailyCap: "hard-daily";
    weeklyCap: "hard-weekly";
    initialImportCompleted: boolean;
    todayXpUsed: number;
    weekXpUsed: number;
    weekXpRemaining: number;
    xpRemainder: number;
  };
  usage: {
    lifetimeInputTokens: number;
    lifetimeCachedInputTokens: number;
    lifetimeOutputTokens: number;
    lifetimeReasoningOutputTokens: number;
    lifetimeTotalTokens: number;
  };
  stateFileLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardScanSummary {
  dryRun: boolean;
  wroteState: boolean;
  recentDays?: number;
  filesScanned: number;
  newObservations: number;
  economyVersion: string;
  rawXp: number;
  dailyCappedXp: number;
  weeklyCappedXp: number;
  finalXp: number;
  gainedXp: number;
  importApplied: boolean;
  importMode: "none" | "profile-only";
  newlyUnlockedSkills: string[];
  warnings: ScannerWarnings;
  resultingStatus: DashboardStatus;
}

export interface DashboardConfig {
  writeToken: string;
  defaultRecentDays: number;
  economyVersion: string;
  stateFileLabel: string;
  autoScan: {
    defaultIntervalMinutes: number;
    minIntervalMinutes: number;
  };
}

export interface DashboardAutoScanStatus {
  enabled: boolean;
  running: boolean;
  intervalMinutes: number;
  recentDays?: number;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  nextRunAt?: string;
  lastError?: string;
  lastSummary?: DashboardScanSummary;
}

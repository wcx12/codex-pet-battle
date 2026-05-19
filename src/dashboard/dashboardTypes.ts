import type { ScannerWarnings } from "../types.js";

export interface DashboardStatus {
  pet: {
    activePetId: string;
    name: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    skills: string[];
    skillDetails: Array<{
      id: string;
      displayName: string;
      unlockLevel: number;
      unlocked: boolean;
      effect: string;
      description: string;
    }>;
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
  battle: {
    totalBattles: number;
    wins: number;
    losses: number;
    draws: number;
    currentStreak: number;
    bestStreak: number;
    lastOutcome?: "victory" | "defeat" | "draw";
    lastBattledAt?: string;
    availableMoves: Array<{
      id: string;
      displayName: string;
      affinity: string;
      category: "attack" | "guard";
      power: number;
      accuracy: number;
    }>;
    moveDetails: Array<{
      id: string;
      displayName: string;
      affinity: string;
      category: "attack" | "guard";
      power: number;
      accuracy: number;
      unlocked: boolean;
      unlockLevel?: number;
    }>;
  };
  adventure: {
    rankKey: string;
    quests: Array<{
      id: string;
      titleKey: string;
      detailKey: string;
      state: "done" | "active" | "locked";
      progressLabel: string;
    }>;
    badges: Array<{
      id: string;
      titleKey: string;
      detailKey: string;
      unlocked: boolean;
    }>;
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
  writeToken?: string;
  readOnlyShare?: boolean;
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

export interface TokenUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
}

export interface TokenObservation {
  id: string;
  sessionRelativePath: string;
  lineNumber: number;
  timestamp: string;
  usage: TokenUsage;
}

export interface ScannerWarnings {
  malformedJsonLines: number;
  unknownTokenShapes: number;
  unreadableFiles: number;
}

export interface ScanObservationsResult {
  observations: TokenObservation[];
  warnings: ScannerWarnings;
  filesScanned: number;
}

export interface ScanSessionsOptions {
  since?: Date;
}

export interface PetProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skills: string[];
}

export interface EconomyState {
  version: "hard-v1";
  initialImportCompleted: boolean;
  dailyXpLedger: Record<string, number>;
  weeklyXpLedger: Record<string, number>;
  xpRemainder: number;
}

export interface LifetimeUsage {
  lifetimeInputTokens: number;
  lifetimeCachedInputTokens: number;
  lifetimeOutputTokens: number;
  lifetimeReasoningOutputTokens: number;
  lifetimeTotalTokens: number;
}

export interface PetState {
  schemaVersion: 2;
  pet: PetProfile;
  usage: LifetimeUsage;
  economy: EconomyState;
  processedObservations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressionResult {
  state: PetState;
  gainedXp: number;
  rawXp: number;
  dailyCappedXp: number;
  weeklyCappedXp: number;
  finalXp: number;
  importMode: "none" | "profile-only";
  importApplied: boolean;
  economyVersion: string;
  newlyUnlockedSkills: string[];
  processedObservationIds: string[];
}

export interface CliScanResult {
  state: PetState;
  gainedXp: number;
  newlyUnlockedSkills: string[];
  newObservationCount: number;
  filesScanned: number;
  warnings: ScannerWarnings;
}

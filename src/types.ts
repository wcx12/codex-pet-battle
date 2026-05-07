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

export interface LifetimeUsage {
  lifetimeInputTokens: number;
  lifetimeCachedInputTokens: number;
  lifetimeOutputTokens: number;
  lifetimeReasoningOutputTokens: number;
  lifetimeTotalTokens: number;
}

export interface PetState {
  schemaVersion: 1;
  pet: PetProfile;
  usage: LifetimeUsage;
  processedObservations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressionResult {
  state: PetState;
  gainedXp: number;
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

import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  CURRENT_SCHEMA_VERSION,
  ECONOMY_VERSION,
  DEFAULT_ACTIVE_PET_ID,
  DEFAULT_PET_NAME
} from "./constants.js";
import { UserFacingError } from "./errors.js";
import type {
  LifetimeUsage,
  PetBattleState,
  PetState,
  TokenObservation
} from "./types.js";
import { xpToNextLevel } from "./progressionEngine.js";

export interface PetStateBackupResult {
  backupFilePath: string;
  backedUpAt: string;
}

export function createDefaultPetState(now = new Date()): PetState {
  const timestamp = now.toISOString();

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activePetId: DEFAULT_ACTIVE_PET_ID,
    pet: {
      name: DEFAULT_PET_NAME,
      level: 1,
      xp: 0,
      xpToNextLevel: xpToNextLevel(1),
      skills: []
    },
    usage: createEmptyLifetimeUsage(),
    economy: createDefaultEconomyState(),
    battle: createDefaultBattleState(),
    processedObservations: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function readPetState(
  stateFilePath: string
): Promise<PetState | null> {
  let rawState: string;

  try {
    rawState = await fs.readFile(stateFilePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw new UserFacingError(
      `Could not read pet state file at ${stateFilePath}: ${formatError(error)}`
    );
  }

  let parsedState: unknown;

  try {
    parsedState = JSON.parse(rawState);
  } catch {
    throw new UserFacingError(
      `Pet state file at ${stateFilePath} is not valid JSON. Back it up or remove it before scanning again.`
    );
  }

  return parsePetState(parsedState, stateFilePath);
}

export async function loadOrCreatePetState(
  stateFilePath: string,
  now = new Date()
): Promise<PetState> {
  const existingState = await readPetState(stateFilePath);

  if (existingState !== null) {
    return existingState;
  }

  const state = createDefaultPetState(now);
  await writePetStateAtomically(stateFilePath, state);
  return state;
}

export async function writePetStateAtomically(
  stateFilePath: string,
  state: PetState
): Promise<void> {
  const stateDirectory = path.dirname(stateFilePath);
  const tempFilePath = path.join(
    stateDirectory,
    `.${path.basename(stateFilePath)}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`
  );

  try {
    await fs.mkdir(stateDirectory, { recursive: true });
    await fs.writeFile(
      tempFilePath,
      `${JSON.stringify(state, null, 2)}\n`,
      "utf8"
    );
    await fs.rename(tempFilePath, stateFilePath);
  } catch (error) {
    await removeTempFileIfPresent(tempFilePath);

    throw new UserFacingError(
      `Could not write pet state file at ${stateFilePath}: ${formatError(error)}`
    );
  }
}

export async function backupPetState(
  stateFilePath: string,
  now = new Date()
): Promise<PetStateBackupResult> {
  let rawState: string;

  try {
    rawState = await fs.readFile(stateFilePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new UserFacingError("No local pet state file found to back up. Run scan first.");
    }

    throw new UserFacingError(
      `Could not read pet state file at ${stateFilePath}: ${formatError(error)}`
    );
  }

  const backedUpAt = now.toISOString();
  const backupFileName = createBackupFileName(path.basename(stateFilePath), backedUpAt);
  const backupFilePath = path.join(
    path.dirname(stateFilePath),
    backupFileName
  );

  try {
    await fs.writeFile(backupFilePath, rawState, "utf8");
  } catch (error) {
    throw new UserFacingError(
      `Could not write pet state backup at ${backupFilePath}: ${formatError(error)}`
    );
  }

  return {
    backupFilePath,
    backedUpAt
  };
}

export function filterNewObservations(
  state: PetState,
  observations: TokenObservation[]
): TokenObservation[] {
  const seenObservationIds = new Set(state.processedObservations);
  const newObservations: TokenObservation[] = [];

  for (const observation of observations) {
    if (seenObservationIds.has(observation.id)) {
      continue;
    }

    seenObservationIds.add(observation.id);
    newObservations.push(observation);
  }

  return newObservations;
}

function parsePetState(value: unknown, stateFilePath: string): PetState {
  if (!isRecord(value)) {
    throw invalidStateError(stateFilePath);
  }

  if (value.schemaVersion === 1) {
    return migrateV1State(value, stateFilePath);
  }

  if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new UserFacingError(
      `Pet state file at ${stateFilePath} uses unsupported schema version ${String(
        value.schemaVersion
      )}. Back it up or remove it before scanning again.`
    );
  }

  if (
    !isRecord(value.pet) ||
    !isRecord(value.usage) ||
    !isRecord(value.economy) ||
    !isStringArray(value.processedObservations) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw invalidStateError(stateFilePath);
  }

  const pet = value.pet;
  const usage = value.usage;
  const economy = value.economy;
  const battle = value.battle;

  if (
    typeof pet.name !== "string" ||
    !isNonNegativeInteger(pet.level) ||
    pet.level < 1 ||
    !isNonNegativeInteger(pet.xp) ||
    !isNonNegativeInteger(pet.xpToNextLevel) ||
    !isStringArray(pet.skills) ||
    !isLifetimeUsage(usage) ||
    !isEconomyState(economy) ||
    (value.activePetId !== undefined && !isPetId(value.activePetId)) ||
    (battle !== undefined && !isBattleState(battle))
  ) {
    throw invalidStateError(stateFilePath);
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activePetId: isPetId(value.activePetId) ? value.activePetId : DEFAULT_ACTIVE_PET_ID,
    pet: {
      name: pet.name,
      level: pet.level,
      xp: pet.xp,
      xpToNextLevel: pet.xpToNextLevel,
      skills: pet.skills
    },
    usage,
    economy,
    battle: battle === undefined ? createDefaultBattleState() : battle,
    processedObservations: value.processedObservations,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function migrateV1State(value: Record<string, unknown>, stateFilePath: string): PetState {
  if (
    !isRecord(value.pet) ||
    !isRecord(value.usage) ||
    !isStringArray(value.processedObservations) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw invalidStateError(stateFilePath);
  }

  const pet = value.pet;
  const usage = value.usage;

  if (
    typeof pet.name !== "string" ||
    !isNonNegativeInteger(pet.level) ||
    pet.level < 1 ||
    !isNonNegativeInteger(pet.xp) ||
    !isNonNegativeInteger(pet.xpToNextLevel) ||
    !isStringArray(pet.skills) ||
    !isLifetimeUsage(usage)
  ) {
    throw invalidStateError(stateFilePath);
  }

  const hasHistoricalActivity =
    value.processedObservations.length > 0 ||
    usage.lifetimeTotalTokens > 0 ||
    pet.level > 1 ||
    pet.xp > 0;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activePetId: DEFAULT_ACTIVE_PET_ID,
    pet: {
      name: pet.name,
      level: pet.level,
      xp: pet.xp,
      xpToNextLevel: xpToNextLevel(pet.level),
      skills: pet.skills
    },
    usage,
    economy: {
      ...createDefaultEconomyState(),
      initialImportCompleted: hasHistoricalActivity
    },
    battle: createDefaultBattleState(),
    processedObservations: value.processedObservations,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function createEmptyLifetimeUsage(): LifetimeUsage {
  return {
    lifetimeInputTokens: 0,
    lifetimeCachedInputTokens: 0,
    lifetimeOutputTokens: 0,
    lifetimeReasoningOutputTokens: 0,
    lifetimeTotalTokens: 0
  };
}

function createDefaultEconomyState(): PetState["economy"] {
  return {
    version: ECONOMY_VERSION,
    initialImportCompleted: false,
    dailyXpLedger: {},
    weeklyXpLedger: {},
    xpRemainder: 0
  };
}

function createDefaultBattleState(): PetBattleState {
  return {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0
  };
}

function isEconomyState(value: unknown): value is PetState["economy"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === ECONOMY_VERSION &&
    typeof value.initialImportCompleted === "boolean" &&
    isNumberRecord(value.dailyXpLedger) &&
    isNumberRecord(value.weeklyXpLedger) &&
    typeof value.xpRemainder === "number" &&
    Number.isFinite(value.xpRemainder) &&
    value.xpRemainder >= 0 &&
    value.xpRemainder < 1
  );
}

function isLifetimeUsage(value: unknown): value is LifetimeUsage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.lifetimeInputTokens) &&
    isNonNegativeInteger(value.lifetimeCachedInputTokens) &&
    isNonNegativeInteger(value.lifetimeOutputTokens) &&
    isNonNegativeInteger(value.lifetimeReasoningOutputTokens) &&
    isNonNegativeInteger(value.lifetimeTotalTokens)
  );
}

function isBattleState(value: unknown): value is PetBattleState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.totalBattles) &&
    isNonNegativeInteger(value.wins) &&
    isNonNegativeInteger(value.losses) &&
    isNonNegativeInteger(value.draws) &&
    isNonNegativeInteger(value.currentStreak) &&
    isNonNegativeInteger(value.bestStreak) &&
    (value.lastOutcome === undefined ||
      value.lastOutcome === "victory" ||
      value.lastOutcome === "defeat" ||
      value.lastOutcome === "draw") &&
    (value.lastBattledAt === undefined || typeof value.lastBattledAt === "string")
  );
}

function invalidStateError(stateFilePath: string): UserFacingError {
  return new UserFacingError(
    `Pet state file at ${stateFilePath} is not a valid schema v1/v2 state. Back it up or remove it before scanning again.`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPetId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u.test(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0)
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatBackupTimestamp(timestamp: string): string {
  return timestamp.replace(/[:.]/g, "-");
}

function createBackupFileName(fileName: string, timestamp: string): string {
  const stamp = formatBackupTimestamp(timestamp);
  if (fileName.endsWith(".local.json")) {
    return fileName.replace(/\.local\.json$/u, `.backup-${stamp}.local.json`);
  }

  const parsedPath = path.parse(fileName);
  return `${parsedPath.name}.backup-${stamp}${parsedPath.ext || ".json"}`;
}

async function removeTempFileIfPresent(tempFilePath: string): Promise<void> {
  try {
    await fs.rm(tempFilePath, { force: true });
  } catch {
    // Best effort cleanup only; the original write error is more important.
  }
}

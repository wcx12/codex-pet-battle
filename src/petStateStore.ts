import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_PET_NAME
} from "./constants.js";
import { UserFacingError } from "./errors.js";
import type {
  LifetimeUsage,
  PetState,
  TokenObservation
} from "./types.js";
import { xpToNextLevel } from "./progressionEngine.js";

export function createDefaultPetState(now = new Date()): PetState {
  const timestamp = now.toISOString();

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pet: {
      name: DEFAULT_PET_NAME,
      level: 1,
      xp: 0,
      xpToNextLevel: xpToNextLevel(1),
      skills: []
    },
    usage: createEmptyLifetimeUsage(),
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

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pet: {
      name: pet.name,
      level: pet.level,
      xp: pet.xp,
      xpToNextLevel: pet.xpToNextLevel,
      skills: pet.skills
    },
    usage,
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

function invalidStateError(stateFilePath: string): UserFacingError {
  return new UserFacingError(
    `Pet state file at ${stateFilePath} is not a valid schema v1 state. Back it up or remove it before scanning again.`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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

async function removeTempFileIfPresent(tempFilePath: string): Promise<void> {
  try {
    await fs.rm(tempFilePath, { force: true });
  } catch {
    // Best effort cleanup only; the original write error is more important.
  }
}

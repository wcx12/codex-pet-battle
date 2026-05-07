import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UserFacingError } from "../src/errors.js";
import {
  createDefaultPetState,
  filterNewObservations,
  loadOrCreatePetState,
  readPetState,
  writePetStateAtomically
} from "../src/petStateStore.js";
import type { TokenObservation, TokenUsage } from "../src/types.js";

describe("petStateStore", () => {
  let tempDirectory: string;

  beforeEach(async () => {
    tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "codex-pet-state-")
    );
  });

  afterEach(async () => {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  });

  it("creates the default schema v2 state", () => {
    const state = createDefaultPetState(
      new Date("2026-05-07T00:00:00.000Z")
    );

    expect(state).toEqual({
      schemaVersion: 2,
      pet: {
        name: "Pathy",
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        skills: []
      },
      usage: {
        lifetimeInputTokens: 0,
        lifetimeCachedInputTokens: 0,
        lifetimeOutputTokens: 0,
        lifetimeReasoningOutputTokens: 0,
        lifetimeTotalTokens: 0
      },
      economy: {
        version: "hard-v1",
        initialImportCompleted: false,
        dailyXpLedger: {},
        weeklyXpLedger: {},
        xpRemainder: 0
      },
      processedObservations: [],
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: "2026-05-07T00:00:00.000Z"
    });
  });

  it("returns null when the state file does not exist", async () => {
    await expect(readPetState(statePath())).resolves.toBeNull();
  });

  it("loads an existing state without rewriting it", async () => {
    const filePath = statePath();
    const state = createDefaultPetState(
      new Date("2026-05-07T00:00:00.000Z")
    );
    await fs.writeFile(filePath, JSON.stringify(state), "utf8");

    const loaded = await loadOrCreatePetState(
      filePath,
      new Date("2030-01-01T00:00:00.000Z")
    );

    expect(loaded).toEqual(state);
    expect(JSON.parse(await fs.readFile(filePath, "utf8"))).toEqual(state);
  });

  it("creates and writes a default state when no state file exists", async () => {
    const filePath = statePath("nested/pet_state.local.json");
    const state = await loadOrCreatePetState(
      filePath,
      new Date("2026-05-07T01:00:00.000Z")
    );

    expect(state.createdAt).toBe("2026-05-07T01:00:00.000Z");
    await expect(readPetState(filePath)).resolves.toEqual(state);
  });

  it("writes state through a temp file and leaves only the final JSON file", async () => {
    const filePath = statePath();
    const state = createDefaultPetState();

    await writePetStateAtomically(filePath, state);

    expect(JSON.parse(await fs.readFile(filePath, "utf8"))).toEqual(state);
    const files = await fs.readdir(tempDirectory);
    expect(files).toEqual(["pet_state.local.json"]);
  });

  it("filters observations already processed and duplicates in the same batch", () => {
    const state = {
      ...createDefaultPetState(),
      processedObservations: ["seen"]
    };

    expect(
      filterNewObservations(state, [
        observation("seen"),
        observation("new-a"),
        observation("new-a"),
        observation("new-b")
      ]).map(({ id }) => id)
    ).toEqual(["new-a", "new-b"]);
  });

  it("fails safely on corrupted JSON without overwriting the file", async () => {
    const filePath = statePath();
    await fs.writeFile(filePath, "{ definitely broken", "utf8");

    await expect(readPetState(filePath)).rejects.toBeInstanceOf(
      UserFacingError
    );
    await expect(loadOrCreatePetState(filePath)).rejects.toBeInstanceOf(
      UserFacingError
    );
    await expect(fs.readFile(filePath, "utf8")).resolves.toBe(
      "{ definitely broken"
    );
  });

  it("fails safely on unsupported schema versions", async () => {
    const filePath = statePath();
    await fs.writeFile(
      filePath,
      JSON.stringify({ ...createDefaultPetState(), schemaVersion: 3 }),
      "utf8"
    );

    await expect(readPetState(filePath)).rejects.toBeInstanceOf(
      UserFacingError
    );
  });

  it("migrates schema v1 state into schema v2 in memory", async () => {
    const filePath = statePath();
    const v1State = {
      schemaVersion: 1,
      pet: {
        name: "Pathy",
        level: 2,
        xp: 5,
        xpToNextLevel: 180,
        skills: ["token_spark"]
      },
      usage: {
        lifetimeInputTokens: 1,
        lifetimeCachedInputTokens: 2,
        lifetimeOutputTokens: 3,
        lifetimeReasoningOutputTokens: 4,
        lifetimeTotalTokens: 10
      },
      processedObservations: ["old"],
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: "2026-05-07T01:00:00.000Z"
    };
    await fs.writeFile(filePath, JSON.stringify(v1State), "utf8");

    await expect(readPetState(filePath)).resolves.toEqual({
      ...v1State,
      schemaVersion: 2,
      economy: {
        version: "hard-v1",
        initialImportCompleted: true,
        dailyXpLedger: {},
        weeklyXpLedger: {},
        xpRemainder: 0
      }
    });
  });

  it("rejects schema v2 states with invalid XP remainder", async () => {
    const filePath = statePath();
    await fs.writeFile(
      filePath,
      JSON.stringify({
        ...createDefaultPetState(),
        economy: {
          ...createDefaultPetState().economy,
          xpRemainder: 1
        }
      }),
      "utf8"
    );

    await expect(readPetState(filePath)).rejects.toBeInstanceOf(
      UserFacingError
    );
  });

  it("fails safely when schema v2 shape is invalid", async () => {
    const filePath = statePath();
    await fs.writeFile(
      filePath,
      JSON.stringify({ ...createDefaultPetState(), processedObservations: [1] }),
      "utf8"
    );

    await expect(readPetState(filePath)).rejects.toBeInstanceOf(
      UserFacingError
    );
  });

  function statePath(relativePath = "pet_state.local.json"): string {
    return path.join(tempDirectory, relativePath);
  }
});

function observation(id: string): TokenObservation {
  return {
    id,
    sessionRelativePath: "sessions/2026/05/07/rollout-test.jsonl",
    lineNumber: 1,
    timestamp: "2026-05-07T00:00:00.000Z",
    usage: usage()
  };
}

function usage(): TokenUsage {
  return {
    inputTokens: 1,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 1
  };
}

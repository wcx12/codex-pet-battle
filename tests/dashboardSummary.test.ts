import path from "node:path";
import { describe, expect, it } from "vitest";

import { createDefaultPetState } from "../src/petStateStore.js";
import { toDashboardStatus } from "../src/dashboard/dashboardSummary.js";

describe("dashboardSummary", () => {
  it("creates a privacy-safe default dashboard status", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const status = toDashboardStatus(
      state,
      path.resolve("C:/Users/example/secret/pet_state.local.json"),
      new Date("2026-05-07T12:00:00.000Z")
    );

    expect(status.pet).toEqual({
      name: "Pathy",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      skills: []
    });
    expect(status.economy).toMatchObject({
      version: "hard-v1",
      formula: "output-focused",
      levelCurve: "milestone",
      dailyCap: "hard-daily",
      weeklyCap: "hard-weekly",
      initialImportCompleted: false,
      todayXpUsed: 0,
      weekXpUsed: 0,
      weekXpRemaining: 80,
      xpRemainder: 0
    });
    expect(status.stateFileLabel).toBe("pet_state.local.json");
    expect(JSON.stringify(status)).not.toContain("C:/Users/example/secret");
  });

  it("summarizes today and current week ledger without observation ids", () => {
    const state = {
      ...createDefaultPetState(new Date("2026-05-07T00:00:00.000Z")),
      economy: {
        ...createDefaultPetState().economy,
        initialImportCompleted: true,
        dailyXpLedger: {
          "2026-05-07": 7.25
        },
        weeklyXpLedger: {
          "2026-05-04": 31.5
        },
        xpRemainder: 0.42
      },
      processedObservations: ["sessions/2026/05/07/rollout-test.jsonl:secret"]
    };

    const status = toDashboardStatus(
      state,
      path.resolve("pet_state.local.json"),
      new Date("2026-05-07T12:00:00.000Z")
    );

    expect(status.economy.todayXpUsed).toBe(7.25);
    expect(status.economy.weekXpUsed).toBe(31.5);
    expect(status.economy.weekXpRemaining).toBe(48.5);
    expect(status.economy.xpRemainder).toBe(0.42);
    expect(JSON.stringify(status)).not.toContain("processedObservations");
    expect(JSON.stringify(status)).not.toContain("rollout-test");
  });
});

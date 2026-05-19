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

    expect(status.pet).toMatchObject({
      activePetId: "pathy",
      name: "Pathy",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      skills: []
    });
    expect(status.pet.skillDetails).toHaveLength(5);
    expect(status.pet.skillDetails[0]).toMatchObject({
      id: "token_spark",
      unlockLevel: 2,
      unlocked: false
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
    expect(status.battle).toEqual({
      totalBattles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      availableMoves: [
        {
          id: "quick_ping",
          displayName: "Quick Ping",
          affinity: "focus",
          category: "attack",
          power: 18,
          accuracy: 1
        }
      ],
      moveDetails: [
        {
          id: "quick_ping",
          displayName: "Quick Ping",
          affinity: "focus",
          category: "attack",
          power: 18,
          accuracy: 1,
          unlocked: true,
          unlockLevel: undefined
        },
        {
          id: "token_spark",
          displayName: "Token Spark",
          affinity: "spark",
          category: "attack",
          power: 28,
          accuracy: 0.95,
          unlocked: false,
          unlockLevel: 2
        },
        {
          id: "context_read",
          displayName: "Context Read",
          affinity: "focus",
          category: "attack",
          power: 24,
          accuracy: 1,
          unlocked: false,
          unlockLevel: 3
        },
        {
          id: "test_shield",
          displayName: "Test Shield",
          affinity: "guard",
          category: "guard",
          power: 0,
          accuracy: 1,
          unlocked: false,
          unlockLevel: 5
        },
        {
          id: "refactor_aura",
          displayName: "Refactor Aura",
          affinity: "guard",
          category: "attack",
          power: 36,
          accuracy: 0.92,
          unlocked: false,
          unlockLevel: 8
        },
        {
          id: "battle_burst",
          displayName: "Battle Burst",
          affinity: "spark",
          category: "attack",
          power: 44,
          accuracy: 0.9,
          unlocked: false,
          unlockLevel: 10
        }
      ]
    });
    expect(status.adventure.rankKey).toBe("rankNewTrainer");
    expect(status.adventure.quests.map((quest) => [quest.id, quest.state])).toEqual([
      ["choose-partner", "done"],
      ["scout-codex", "active"],
      ["claim-energy", "locked"],
      ["train-battle", "active"],
      ["win-battle", "locked"],
      ["reach-level-2", "active"]
    ]);
    expect(status.adventure.badges).toContainEqual({
      id: "first-partner",
      titleKey: "badgeFirstPartner",
      detailKey: "badgeFirstPartnerDetail",
      unlocked: true
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

  it("promotes adventure state as the pet trains", () => {
    const state = {
      ...createDefaultPetState(new Date("2026-05-07T00:00:00.000Z")),
      pet: {
        name: "Pathy",
        level: 2,
        xp: 4,
        xpToNextLevel: 200,
        skills: ["token_spark"]
      },
      economy: {
        ...createDefaultPetState().economy,
        initialImportCompleted: true,
        dailyXpLedger: {
          "2026-05-07": 12
        },
        weeklyXpLedger: {
          "2026-05-04": 12
        }
      },
      battle: {
        totalBattles: 2,
        wins: 1,
        losses: 1,
        draws: 0,
        currentStreak: 1,
        bestStreak: 1,
        lastOutcome: "victory" as const,
        lastBattledAt: "2026-05-07T02:00:00.000Z"
      }
    };

    const status = toDashboardStatus(
      state,
      path.resolve("pet_state.local.json"),
      new Date("2026-05-07T12:00:00.000Z")
    );

    expect(status.adventure.rankKey).toBe("rankTrainer");
    expect(status.adventure.quests.every((quest) => quest.state === "done")).toBe(true);
    expect(status.adventure.badges.find((badge) => badge.id === "first-win")?.unlocked).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { createPetCombatant, recordPracticeBattleResult, runPracticeBattle } from "../src/battle/battleEngine.js";
import { createDefaultPetState } from "../src/petStateStore.js";

describe("battleEngine", () => {
  it("runs a deterministic local practice battle with scan-only Codex XP", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));

    const first = runPracticeBattle(state, { difficulty: "normal", seed: "fixed-seed" });
    const second = runPracticeBattle(state, { difficulty: "normal", seed: "fixed-seed" });

    expect(first).toEqual(second);
    expect(first.log.length).toBeGreaterThan(0);
    expect(["victory", "defeat", "draw"]).toContain(first.outcome);
    expect(first.rewards.codexXpAwarded).toBe(0);
    expect(first.rewards.petXpAwarded).toBeGreaterThan(0);
  });

  it("converts unlocked pet skills into available battle moves", () => {
    const state = {
      ...createDefaultPetState(),
      pet: {
        ...createDefaultPetState().pet,
        level: 10,
        skills: ["token_spark", "context_sense", "test_shield", "refactor_aura", "battle_ready"]
      }
    };

    const pet = createPetCombatant(state);

    expect(pet.moves.map((move) => move.id)).toEqual([
      "quick_ping",
      "token_spark",
      "context_read",
      "test_shield",
      "refactor_aura",
      "battle_burst"
    ]);
    expect(pet.maxHp).toBeGreaterThan(createPetCombatant(createDefaultPetState()).maxHp);
  });

  it("records practice battle outcomes and awards local training XP", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const battle = runPracticeBattle(state, { difficulty: "easy", seed: "record-seed" });

    const nextState = recordPracticeBattleResult(
      state,
      battle,
      new Date("2026-05-07T02:00:00.000Z")
    );

    expect(nextState.battle.totalBattles).toBe(1);
    expect(nextState.battle.wins + nextState.battle.losses + nextState.battle.draws).toBe(1);
    expect(nextState.battle.lastOutcome).toBe(battle.outcome);
    expect(nextState.battle.lastBattledAt).toBe("2026-05-07T02:00:00.000Z");
    expect(nextState.updatedAt).toBe("2026-05-07T02:00:00.000Z");
    expect(nextState.pet.xp).toBe(state.pet.xp + battle.rewards.petXpAwarded);
  });

  it("selects varied wild practice opponents deterministically", () => {
    const state = createDefaultPetState(new Date("2026-05-07T00:00:00.000Z"));
    const battles = [
      runPracticeBattle(state, { difficulty: "easy", seed: "easy-0" }),
      runPracticeBattle(state, { difficulty: "easy", seed: "easy-1" }),
      runPracticeBattle(state, { difficulty: "easy", seed: "easy-8" }),
      runPracticeBattle(state, { difficulty: "normal", seed: "normal-1" }),
      runPracticeBattle(state, { difficulty: "normal", seed: "normal-4" }),
      runPracticeBattle(state, { difficulty: "hard", seed: "hard-4" })
    ];
    const opponents = new Map(battles.map((battle) => [
      battle.opponent.name,
      battle.opponent.visualId
    ]));

    expect(Object.fromEntries(opponents)).toEqual({
      "Static Mote": "static_mote",
      "Trace Lancer": "trace_lancer",
      "Cache Shell": "cache_shell",
      "Null Mirror": "null_mirror",
      "Loop Sentinel": "loop_sentinel",
      "Patch Core": "patch_core"
    });
    for (const battle of battles) {
      expect(battle.opponent.visualId).toEqual(expect.any(String));
      expect(battle.opponent.moves.length).toBeGreaterThanOrEqual(2);
      expect(runPracticeBattle(state, {
        difficulty: battle.difficulty,
        seed: battle.seed
      }).opponent).toEqual(battle.opponent);
    }
  });

  it("can level up and unlock skills from training XP", () => {
    const state = {
      ...createDefaultPetState(new Date("2026-05-07T00:00:00.000Z")),
      pet: {
        ...createDefaultPetState().pet,
        level: 1,
        xp: 98,
        xpToNextLevel: 100,
        skills: []
      }
    };
    const battle = runPracticeBattle(state, { difficulty: "normal", seed: "level-up" });

    const nextState = recordPracticeBattleResult(
      state,
      battle,
      new Date("2026-05-07T02:00:00.000Z")
    );

    expect(battle.rewards.petXpAwarded).toBeGreaterThanOrEqual(2);
    expect(nextState.pet.level).toBeGreaterThanOrEqual(2);
    expect(nextState.pet.skills).toContain("token_spark");
    expect(nextState.pet.xpToNextLevel).toBe(180);
  });

  it("uses a preferred pet move as the opening action when unlocked", () => {
    const state = {
      ...createDefaultPetState(),
      pet: {
        ...createDefaultPetState().pet,
        level: 3,
        skills: ["token_spark"]
      }
    };

    const battle = runPracticeBattle(state, {
      difficulty: "normal",
      seed: "preferred-move",
      preferredMoveId: "token_spark"
    });
    const firstPetAction = battle.log.find((entry) => entry.actor === "pet");

    expect(battle.preferredMoveId).toBe("token_spark");
    expect(firstPetAction?.moveId).toBe("token_spark");
  });
});

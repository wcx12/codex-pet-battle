import type { BattleMove } from "./battleTypes.js";

export const PET_BATTLE_MOVES: BattleMove[] = [
  {
    id: "quick_ping",
    displayName: "Quick Ping",
    affinity: "focus",
    category: "attack",
    power: 18,
    accuracy: 1
  },
  {
    id: "token_spark",
    displayName: "Token Spark",
    affinity: "spark",
    category: "attack",
    power: 28,
    accuracy: 0.95,
    unlockSkill: "token_spark"
  },
  {
    id: "context_read",
    displayName: "Context Read",
    affinity: "focus",
    category: "attack",
    power: 24,
    accuracy: 1,
    unlockSkill: "context_sense"
  },
  {
    id: "test_shield",
    displayName: "Test Shield",
    affinity: "guard",
    category: "guard",
    power: 0,
    accuracy: 1,
    unlockSkill: "test_shield"
  },
  {
    id: "refactor_aura",
    displayName: "Refactor Aura",
    affinity: "guard",
    category: "attack",
    power: 36,
    accuracy: 0.92,
    unlockSkill: "refactor_aura"
  },
  {
    id: "battle_burst",
    displayName: "Battle Burst",
    affinity: "spark",
    category: "attack",
    power: 44,
    accuracy: 0.9,
    unlockSkill: "battle_ready"
  }
];

export const OPPONENT_BATTLE_MOVES: BattleMove[] = [
  {
    id: "static_peck",
    displayName: "Static Peck",
    affinity: "spark",
    category: "attack",
    power: 18,
    accuracy: 0.96
  },
  {
    id: "loop_guard",
    displayName: "Loop Guard",
    affinity: "guard",
    category: "guard",
    power: 0,
    accuracy: 1
  },
  {
    id: "cache_bump",
    displayName: "Cache Bump",
    affinity: "focus",
    category: "attack",
    power: 22,
    accuracy: 0.94
  },
  {
    id: "trace_laser",
    displayName: "Trace Laser",
    affinity: "focus",
    category: "attack",
    power: 24,
    accuracy: 0.95
  },
  {
    id: "kernel_shell",
    displayName: "Kernel Shell",
    affinity: "guard",
    category: "guard",
    power: 0,
    accuracy: 1
  },
  {
    id: "null_pulse",
    displayName: "Null Pulse",
    affinity: "guard",
    category: "attack",
    power: 27,
    accuracy: 0.93
  },
  {
    id: "patch_burst",
    displayName: "Patch Burst",
    affinity: "spark",
    category: "attack",
    power: 32,
    accuracy: 0.9
  }
];

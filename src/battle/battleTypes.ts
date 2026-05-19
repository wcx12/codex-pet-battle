export type BattleDifficulty = "easy" | "normal" | "hard";
export type BattleAffinity = "spark" | "focus" | "guard";
export type BattleOutcome = "victory" | "defeat" | "draw";
export type BattleSide = "pet" | "opponent";

export interface BattleMove {
  id: string;
  displayName: string;
  affinity: BattleAffinity;
  category: "attack" | "guard";
  power: number;
  accuracy: number;
  unlockSkill?: string;
}

export interface BattleCombatant {
  id: BattleSide;
  name: string;
  level: number;
  affinity: BattleAffinity;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: BattleMove[];
}

export interface BattleLogEntry {
  round: number;
  actor: BattleSide;
  actorName: string;
  moveId: string;
  moveName: string;
  category: BattleMove["category"];
  damage: number;
  targetHp: number;
  missed: boolean;
  shielded: boolean;
  effectiveness: "strong" | "weak" | "normal";
}

export interface PracticeBattleOptions {
  difficulty?: BattleDifficulty;
  seed?: string;
  preferredMoveId?: string;
}

export interface PracticeBattleResult {
  outcome: BattleOutcome;
  difficulty: BattleDifficulty;
  rounds: number;
  seed: string;
  preferredMoveId?: string;
  pet: BattleCombatant;
  opponent: BattleCombatant;
  log: BattleLogEntry[];
  rewards: {
    codexXpAwarded: 0;
    petXpAwarded: number;
    note: string;
  };
}

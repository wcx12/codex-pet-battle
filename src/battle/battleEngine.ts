import { randomUUID } from "node:crypto";

import type { PetState } from "../types.js";
import { applyLevelCurve, milestoneCurve } from "../economy/levelCurves.js";
import { PET_SKILL_CATALOG } from "../skillCatalog.js";
import { OPPONENT_BATTLE_MOVES, PET_BATTLE_MOVES } from "./battleMoves.js";
import type {
  BattleAffinity,
  BattleCombatant,
  BattleDifficulty,
  BattleLogEntry,
  BattleMove,
  BattleOutcome,
  BattleSide,
  PracticeBattleOptions,
  PracticeBattleResult
} from "./battleTypes.js";

const MAX_ROUNDS = 12;
const TRAINING_XP_REWARDS: Record<BattleDifficulty, Record<BattleOutcome, number>> = {
  easy: { victory: 4, draw: 2, defeat: 1 },
  normal: { victory: 7, draw: 3, defeat: 2 },
  hard: { victory: 12, draw: 5, defeat: 3 }
};

interface WildOpponentTemplate {
  visualId: string;
  name: string;
  affinity: BattleAffinity;
  difficulties: BattleDifficulty[];
  moveIds: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  levelOffset?: number;
}

const WILD_OPPONENTS: WildOpponentTemplate[] = [
  {
    visualId: "static_mote",
    name: "Static Mote",
    affinity: "spark",
    difficulties: ["easy", "normal"],
    moveIds: ["static_peck", "cache_bump"],
    hp: 0.84,
    attack: 1.04,
    defense: 0.86,
    speed: 1.18
  },
  {
    visualId: "cache_shell",
    name: "Cache Shell",
    affinity: "guard",
    difficulties: ["easy", "normal"],
    moveIds: ["cache_bump", "loop_guard"],
    hp: 1.08,
    attack: 0.88,
    defense: 1.16,
    speed: 0.84
  },
  {
    visualId: "trace_lancer",
    name: "Trace Lancer",
    affinity: "focus",
    difficulties: ["easy", "normal", "hard"],
    moveIds: ["trace_laser", "cache_bump"],
    hp: 0.96,
    attack: 1.08,
    defense: 0.96,
    speed: 1.08
  },
  {
    visualId: "loop_sentinel",
    name: "Loop Sentinel",
    affinity: "guard",
    difficulties: ["normal", "hard"],
    moveIds: ["loop_guard", "kernel_shell", "null_pulse"],
    hp: 1.16,
    attack: 0.96,
    defense: 1.18,
    speed: 0.9
  },
  {
    visualId: "null_mirror",
    name: "Null Mirror",
    affinity: "focus",
    difficulties: ["normal", "hard"],
    moveIds: ["null_pulse", "trace_laser", "kernel_shell"],
    hp: 1.02,
    attack: 1.02,
    defense: 1.04,
    speed: 1.02
  },
  {
    visualId: "patch_core",
    name: "Patch Core",
    affinity: "spark",
    difficulties: ["hard"],
    moveIds: ["patch_burst", "static_peck", "kernel_shell"],
    hp: 1.06,
    attack: 1.22,
    defense: 1,
    speed: 1.08,
    levelOffset: 1
  }
];

export function runPracticeBattle(
  state: PetState,
  options: PracticeBattleOptions = {}
): PracticeBattleResult {
  const difficulty = options.difficulty ?? "normal";
  const seed = options.seed ?? randomUUID();
  const random = createSeededRandom(seed);
  const pet = createPetCombatant(state);
  const opponent = createPracticeOpponent(state, difficulty, random);
  const log: BattleLogEntry[] = [];
  let preferredPetMove = pet.moves.find((move) => move.id === options.preferredMoveId);
  const preferredMoveId = preferredPetMove?.id;

  for (let round = 1; round <= MAX_ROUNDS && pet.hp > 0 && opponent.hp > 0; round += 1) {
    const shields = new Set<BattleSide>();
    const petMove = preferredPetMove ?? chooseMove(pet, opponent, random);
    preferredPetMove = undefined;
    const opponentMove = chooseMove(opponent, pet, random);
    const order = actionOrder(pet, opponent, random);

    for (const side of order) {
      const actor = side === "pet" ? pet : opponent;
      const target = side === "pet" ? opponent : pet;
      const move = side === "pet" ? petMove : opponentMove;

      if (actor.hp <= 0 || target.hp <= 0) {
        continue;
      }

      log.push(applyMove(round, actor, target, move, shields, random));
    }
  }

  const outcome = battleOutcome(pet, opponent);
  const rounds = lastRound(log);

  return {
    outcome,
    difficulty,
    rounds,
    seed,
    preferredMoveId,
    pet,
    opponent,
    log,
    rewards: {
      codexXpAwarded: 0,
      petXpAwarded: trainingXpReward(difficulty, outcome),
      note: "Practice battles award local training XP. Codex XP remains scan-only."
    }
  };
}

export function recordPracticeBattleResult(
  state: PetState,
  battle: PracticeBattleResult,
  now = new Date()
): PetState {
  const currentStreak = battle.outcome === "victory" ? state.battle.currentStreak + 1 : 0;
  const levelResult = applyLevelCurve(
    battle.rewards.petXpAwarded,
    milestoneCurve,
    state.pet.level,
    state.pet.xp
  );
  const previousSkills = new Set(state.pet.skills);
  const newlyUnlockedSkills = PET_SKILL_CATALOG.filter(
    ({ id, unlockLevel }) => levelResult.level >= unlockLevel && !previousSkills.has(id)
  ).map(({ id }) => id);

  return {
    ...state,
    pet: {
      ...state.pet,
      level: levelResult.level,
      xp: levelResult.xpIntoLevel,
      xpToNextLevel: levelResult.xpToNextLevel,
      skills: [...state.pet.skills, ...newlyUnlockedSkills]
    },
    battle: {
      totalBattles: state.battle.totalBattles + 1,
      wins: state.battle.wins + (battle.outcome === "victory" ? 1 : 0),
      losses: state.battle.losses + (battle.outcome === "defeat" ? 1 : 0),
      draws: state.battle.draws + (battle.outcome === "draw" ? 1 : 0),
      currentStreak,
      bestStreak: Math.max(state.battle.bestStreak, currentStreak),
      lastOutcome: battle.outcome,
      lastBattledAt: now.toISOString()
    },
    updatedAt: now.toISOString()
  };
}

export function createPetCombatant(state: PetState): BattleCombatant {
  const skillSet = new Set(state.pet.skills);
  const level = Math.max(1, state.pet.level);
  const skillCount = skillSet.size;
  const affinity = petAffinity(skillSet);

  return {
    id: "pet",
    name: state.pet.name,
    level,
    affinity,
    maxHp: 78 + level * 12 + skillCount * 5,
    hp: 78 + level * 12 + skillCount * 5,
    attack: 15 + level * 3 + skillCount * 2 + (skillSet.has("battle_ready") ? 4 : 0),
    defense: 11 + Math.floor(level * 2.2) + (skillSet.has("test_shield") ? 5 : 0),
    speed: 12 + level * 2 + (skillSet.has("context_sense") ? 4 : 0),
    moves: PET_BATTLE_MOVES.filter((move) => !move.unlockSkill || skillSet.has(move.unlockSkill))
  };
}

function createPracticeOpponent(
  state: PetState,
  difficulty: BattleDifficulty,
  random: () => number
): BattleCombatant {
  const template = chooseWildOpponent(difficulty, random);
  const baseLevel = Math.max(
    1,
    state.pet.level + difficultyLevelOffset(difficulty) + (template.levelOffset ?? 0)
  );
  const multiplier = difficultyMultiplier(difficulty);
  const maxHp = Math.round((72 + baseLevel * 11) * multiplier.hp * template.hp);

  return {
    id: "opponent",
    name: template.name,
    visualId: template.visualId,
    level: baseLevel,
    affinity: template.affinity,
    maxHp,
    hp: maxHp,
    attack: Math.round((14 + baseLevel * 3) * multiplier.attack * template.attack),
    defense: Math.round((10 + baseLevel * 2) * multiplier.defense * template.defense),
    speed: Math.round((11 + baseLevel * 2) * multiplier.speed * template.speed),
    moves: movesById(template.moveIds)
  };
}

function chooseWildOpponent(
  difficulty: BattleDifficulty,
  random: () => number
): WildOpponentTemplate {
  const candidates = WILD_OPPONENTS.filter((opponent) => opponent.difficulties.includes(difficulty));
  return candidates[Math.floor(random() * candidates.length)] ?? WILD_OPPONENTS[0];
}

function movesById(moveIds: string[]): BattleMove[] {
  const moveSet = new Set(moveIds);
  const moves = OPPONENT_BATTLE_MOVES.filter((move) => moveSet.has(move.id));
  return moves.length > 0 ? moves : OPPONENT_BATTLE_MOVES;
}

function chooseMove(
  actor: BattleCombatant,
  target: BattleCombatant,
  random: () => number
): BattleMove {
  const guardMove = actor.moves.find((move) => move.category === "guard");
  if (guardMove && actor.hp / actor.maxHp <= 0.35 && random() < 0.65) {
    return guardMove;
  }

  const attacks = actor.moves.filter((move) => move.category === "attack");
  return attacks
    .map((move) => ({
      move,
      score: move.power * affinityMultiplier(move.affinity, target.affinity) * move.accuracy
    }))
    .sort((left, right) => right.score - left.score)[0]?.move ?? actor.moves[0];
}

function actionOrder(
  pet: BattleCombatant,
  opponent: BattleCombatant,
  random: () => number
): BattleSide[] {
  if (pet.speed === opponent.speed) {
    return random() < 0.5 ? ["pet", "opponent"] : ["opponent", "pet"];
  }

  return pet.speed > opponent.speed ? ["pet", "opponent"] : ["opponent", "pet"];
}

function applyMove(
  round: number,
  actor: BattleCombatant,
  target: BattleCombatant,
  move: BattleMove,
  shields: Set<BattleSide>,
  random: () => number
): BattleLogEntry {
  if (move.category === "guard") {
    shields.add(actor.id);
    return logEntry(round, actor, target, move, 0, false, false, "normal");
  }

  const missed = random() > move.accuracy;
  if (missed) {
    return logEntry(round, actor, target, move, 0, true, false, "normal");
  }

  const multiplier = affinityMultiplier(move.affinity, target.affinity);
  const effectiveness = effectivenessLabel(multiplier);
  const shielded = shields.has(target.id);
  const variance = 0.9 + random() * 0.2;
  const rawDamage = (move.power + actor.attack - target.defense * 0.55) * multiplier * variance;
  const damage = Math.max(1, Math.round(rawDamage * (shielded ? 0.45 : 1)));
  target.hp = Math.max(0, target.hp - damage);

  return logEntry(round, actor, target, move, damage, false, shielded, effectiveness);
}

function logEntry(
  round: number,
  actor: BattleCombatant,
  target: BattleCombatant,
  move: BattleMove,
  damage: number,
  missed: boolean,
  shielded: boolean,
  effectiveness: BattleLogEntry["effectiveness"]
): BattleLogEntry {
  return {
    round,
    actor: actor.id,
    actorName: actor.name,
    moveId: move.id,
    moveName: move.displayName,
    category: move.category,
    damage,
    targetHp: target.hp,
    missed,
    shielded,
    effectiveness
  };
}

function battleOutcome(pet: BattleCombatant, opponent: BattleCombatant): BattleOutcome {
  if (pet.hp > 0 && opponent.hp <= 0) {
    return "victory";
  }

  if (opponent.hp > 0 && pet.hp <= 0) {
    return "defeat";
  }

  if (pet.hp === opponent.hp) {
    return "draw";
  }

  return pet.hp > opponent.hp ? "victory" : "defeat";
}

function affinityMultiplier(moveAffinity: BattleAffinity, targetAffinity: BattleAffinity): number {
  if (
    (moveAffinity === "spark" && targetAffinity === "focus") ||
    (moveAffinity === "focus" && targetAffinity === "guard") ||
    (moveAffinity === "guard" && targetAffinity === "spark")
  ) {
    return 1.2;
  }

  if (
    (moveAffinity === "focus" && targetAffinity === "spark") ||
    (moveAffinity === "guard" && targetAffinity === "focus") ||
    (moveAffinity === "spark" && targetAffinity === "guard")
  ) {
    return 0.85;
  }

  return 1;
}

function effectivenessLabel(multiplier: number): BattleLogEntry["effectiveness"] {
  if (multiplier > 1) {
    return "strong";
  }

  if (multiplier < 1) {
    return "weak";
  }

  return "normal";
}

function petAffinity(skills: Set<string>): BattleAffinity {
  if (skills.has("battle_ready") || skills.has("token_spark")) {
    return "spark";
  }

  if (skills.has("test_shield") || skills.has("refactor_aura")) {
    return "guard";
  }

  return "focus";
}

function difficultyLevelOffset(difficulty: BattleDifficulty): number {
  if (difficulty === "easy") {
    return -1;
  }

  if (difficulty === "hard") {
    return 1;
  }

  return 0;
}

function difficultyMultiplier(difficulty: BattleDifficulty): {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
} {
  if (difficulty === "easy") {
    return { hp: 0.86, attack: 0.9, defense: 0.9, speed: 0.95 };
  }

  if (difficulty === "hard") {
    return { hp: 1.12, attack: 1.15, defense: 1.1, speed: 1.05 };
  }

  return { hp: 1, attack: 1, defense: 1, speed: 1 };
}

function trainingXpReward(difficulty: BattleDifficulty, outcome: BattleOutcome): number {
  return TRAINING_XP_REWARDS[difficulty][outcome];
}

function lastRound(log: BattleLogEntry[]): number {
  return log.length === 0 ? 0 : log[log.length - 1].round;
}

function createSeededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

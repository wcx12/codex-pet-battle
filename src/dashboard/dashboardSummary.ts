import path from "node:path";

import { PET_BATTLE_MOVES } from "../battle/battleMoves.js";
import { ECONOMY_VERSION } from "../constants.js";
import { hardWeeklyCap } from "../economy/caps.js";
import { PET_SKILL_CATALOG } from "../skillCatalog.js";
import type { RunPetScanResult } from "../scanWorkflow.js";
import type { PetState } from "../types.js";
import type { DashboardScanSummary, DashboardStatus } from "./dashboardTypes.js";

export function toDashboardStatus(
  state: PetState,
  stateFilePath: string,
  now = new Date()
): DashboardStatus {
  const today = dayBucket(now);
  const week = weekBucket(today);
  const weekXpUsed = round(state.economy.weeklyXpLedger[week] ?? 0);
  const maxWeeklyXp = hardWeeklyCap.maxXpPerWeek ?? 0;
  const unlockedSkills = new Set(state.pet.skills);
  const battle = {
    ...state.battle,
    availableMoves: PET_BATTLE_MOVES.filter((move) => !move.unlockSkill || unlockedSkills.has(move.unlockSkill)).map((move) => ({
      id: move.id,
      displayName: move.displayName,
      affinity: move.affinity,
      category: move.category,
      power: move.power,
      accuracy: move.accuracy
    })),
    moveDetails: PET_BATTLE_MOVES.map((move) => {
      const skill = move.unlockSkill
        ? PET_SKILL_CATALOG.find((candidate) => candidate.id === move.unlockSkill)
        : undefined;
      return {
        id: move.id,
        displayName: move.displayName,
        affinity: move.affinity,
        category: move.category,
        power: move.power,
        accuracy: move.accuracy,
        unlocked: !move.unlockSkill || unlockedSkills.has(move.unlockSkill),
        unlockLevel: skill?.unlockLevel
      };
    })
  };

  return {
    pet: {
      activePetId: state.activePetId,
      name: state.pet.name,
      level: state.pet.level,
      xp: state.pet.xp,
      xpToNextLevel: state.pet.xpToNextLevel,
      skills: [...state.pet.skills],
      skillDetails: PET_SKILL_CATALOG.map((skill) => ({
        id: skill.id,
        displayName: skill.displayName,
        unlockLevel: skill.unlockLevel,
        unlocked: unlockedSkills.has(skill.id),
        effect: skill.effect,
        description: skill.description
      }))
    },
    economy: {
      version: state.economy.version,
      formula: "output-focused",
      levelCurve: "milestone",
      dailyCap: "hard-daily",
      weeklyCap: "hard-weekly",
      initialImportCompleted: state.economy.initialImportCompleted,
      todayXpUsed: round(state.economy.dailyXpLedger[today] ?? 0),
      weekXpUsed,
      weekXpRemaining: round(Math.max(0, maxWeeklyXp - weekXpUsed)),
      xpRemainder: round(state.economy.xpRemainder)
    },
    usage: { ...state.usage },
    battle,
    adventure: buildAdventureStatus(state, battle),
    stateFileLabel: path.basename(stateFilePath),
    createdAt: state.createdAt,
    updatedAt: state.updatedAt
  };
}

export function toDashboardScanSummary(
  result: RunPetScanResult,
  stateFilePath: string,
  now = new Date()
): DashboardScanSummary {
  return {
    dryRun: result.dryRun,
    wroteState: result.wroteState,
    recentDays: result.recentDays,
    filesScanned: result.scanResult.filesScanned,
    newObservations: result.newObservationCount,
    economyVersion: result.progression.economyVersion,
    rawXp: round(result.progression.rawXp),
    dailyCappedXp: round(result.progression.dailyCappedXp),
    weeklyCappedXp: round(result.progression.weeklyCappedXp),
    finalXp: round(result.progression.finalXp),
    gainedXp: result.progression.gainedXp,
    importApplied: result.progression.importApplied,
    importMode: result.progression.importMode,
    newlyUnlockedSkills: [...result.progression.newlyUnlockedSkills],
    warnings: { ...result.scanResult.warnings },
    resultingStatus: toDashboardStatus(result.state, stateFilePath, now)
  };
}

export function createDefaultDashboardConfig(
  writeToken: string,
  stateFilePath: string,
  autoScanDefaults = { defaultIntervalMinutes: 10, minIntervalMinutes: 1 }
) {
  return {
    writeToken,
    defaultRecentDays: 30,
    economyVersion: ECONOMY_VERSION,
    stateFileLabel: path.basename(stateFilePath),
    autoScan: autoScanDefaults
  };
}

function dayBucket(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function weekBucket(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildAdventureStatus(
  state: PetState,
  battle: DashboardStatus["battle"]
): DashboardStatus["adventure"] {
  const hasClaimedCodexXp =
    Object.values(state.economy.dailyXpLedger).some((value) => value > 0) ||
    Object.values(state.economy.weeklyXpLedger).some((value) => value > 0);
  const hasPartner = state.activePetId.length > 0;
  const hasBattle = battle.totalBattles > 0;
  const hasWin = battle.wins > 0;
  const levelProgress = state.pet.level >= 2
    ? `L${state.pet.level}`
    : `${state.pet.xp}/${state.pet.xpToNextLevel}`;

  return {
    rankKey: rankKeyForState(state, battle, hasClaimedCodexXp),
    quests: [
      {
        id: "choose-partner",
        titleKey: "questChoosePartner",
        detailKey: "questChoosePartnerDetail",
        state: hasPartner ? "done" : "active",
        progressLabel: hasPartner ? state.pet.name : "0/1"
      },
      {
        id: "scout-codex",
        titleKey: "questScoutCodex",
        detailKey: "questScoutCodexDetail",
        state: state.economy.initialImportCompleted ? "done" : "active",
        progressLabel: state.economy.initialImportCompleted ? "1/1" : "0/1"
      },
      {
        id: "claim-energy",
        titleKey: "questClaimEnergy",
        detailKey: "questClaimEnergyDetail",
        state: hasClaimedCodexXp ? "done" : state.economy.initialImportCompleted ? "active" : "locked",
        progressLabel: hasClaimedCodexXp ? formatProgressNumber(totalLedgerXp(state)) : "0 XP"
      },
      {
        id: "train-battle",
        titleKey: "questTrainBattle",
        detailKey: "questTrainBattleDetail",
        state: hasBattle ? "done" : "active",
        progressLabel: `${Math.min(1, battle.totalBattles)}/1`
      },
      {
        id: "win-battle",
        titleKey: "questWinBattle",
        detailKey: "questWinBattleDetail",
        state: hasWin ? "done" : hasBattle ? "active" : "locked",
        progressLabel: `${Math.min(1, battle.wins)}/1`
      },
      {
        id: "reach-level-2",
        titleKey: "questReachLevel2",
        detailKey: "questReachLevel2Detail",
        state: state.pet.level >= 2 ? "done" : "active",
        progressLabel: levelProgress
      }
    ],
    badges: [
      {
        id: "first-partner",
        titleKey: "badgeFirstPartner",
        detailKey: "badgeFirstPartnerDetail",
        unlocked: hasPartner
      },
      {
        id: "codex-scout",
        titleKey: "badgeCodexScout",
        detailKey: "badgeCodexScoutDetail",
        unlocked: state.economy.initialImportCompleted
      },
      {
        id: "sparring-card",
        titleKey: "badgeSparringCard",
        detailKey: "badgeSparringCardDetail",
        unlocked: hasBattle
      },
      {
        id: "first-win",
        titleKey: "badgeFirstWin",
        detailKey: "badgeFirstWinDetail",
        unlocked: hasWin
      }
    ]
  };
}

function rankKeyForState(
  state: PetState,
  battle: DashboardStatus["battle"],
  hasClaimedCodexXp: boolean
): string {
  if (state.pet.level >= 10 || battle.bestStreak >= 5) {
    return "rankArenaAce";
  }

  if (battle.wins > 0 || state.pet.level >= 2) {
    return "rankTrainer";
  }

  if (battle.totalBattles > 0 || hasClaimedCodexXp) {
    return "rankRookieBattler";
  }

  if (state.economy.initialImportCompleted) {
    return "rankFieldScout";
  }

  return "rankNewTrainer";
}

function totalLedgerXp(state: PetState): number {
  return round(
    Object.values(state.economy.dailyXpLedger).reduce((total, value) => total + value, 0)
  );
}

function formatProgressNumber(value: number): string {
  return `${round(value)} XP`;
}

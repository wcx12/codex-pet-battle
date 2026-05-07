import path from "node:path";

import { ECONOMY_VERSION } from "../constants.js";
import { hardWeeklyCap } from "../economy/caps.js";
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

  return {
    pet: {
      name: state.pet.name,
      level: state.pet.level,
      xp: state.pet.xp,
      xpToNextLevel: state.pet.xpToNextLevel,
      skills: [...state.pet.skills]
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

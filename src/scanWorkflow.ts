import { resolveCodexHome } from "./codexHomeResolver.js";
import { applyProgression } from "./progressionEngine.js";
import {
  createDefaultPetState,
  filterNewObservations,
  readPetState,
  writePetStateAtomically
} from "./petStateStore.js";
import { scanSessions } from "./sessionScanner.js";
import type { PetState, ProgressionResult, ScanObservationsResult } from "./types.js";

export interface RunPetScanOptions {
  cliCodexHome?: string;
  stateFile: string;
  dryRun: boolean;
  recentDays?: number;
  now?: Date;
}

export interface RunPetScanResult {
  codexHome: string;
  existingState: PetState | null;
  initialState: PetState;
  state: PetState;
  scanResult: ScanObservationsResult;
  progression: ProgressionResult;
  newObservationCount: number;
  wroteState: boolean;
  recentDays?: number;
  dryRun: boolean;
}

export async function runPetScan(options: RunPetScanOptions): Promise<RunPetScanResult> {
  const now = options.now ?? new Date();
  const codexHome = await resolveCodexHome({ cliCodexHome: options.cliCodexHome });
  const existingState = await readPetState(options.stateFile);
  const initialState = existingState ?? createDefaultPetState(now);
  const since =
    options.recentDays === undefined ? undefined : daysBefore(now, options.recentDays);
  const scanResult = await scanSessions(codexHome, { since });
  const newObservations = filterNewObservations(initialState, scanResult.observations);
  const progression = applyProgression(initialState, newObservations, now);

  let wroteState = false;
  if (!options.dryRun && (!existingState || newObservations.length > 0)) {
    await writePetStateAtomically(options.stateFile, progression.state);
    wroteState = true;
  }

  return {
    codexHome,
    existingState,
    initialState,
    state: progression.state,
    scanResult,
    progression,
    newObservationCount: newObservations.length,
    wroteState,
    recentDays: options.recentDays,
    dryRun: options.dryRun
  };
}

export function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

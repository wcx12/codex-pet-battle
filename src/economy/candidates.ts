import { hardDailySoftCap, hardWeeklyCap, moderateDailySoftCap, noDailyCap, noWeeklyCap } from "./caps.js";
import {
  baselineMvpFormula,
  hardLinearFormula,
  logCompressionFormula,
  outputFocusedFormula,
  sqrtCompressionFormula
} from "./formulas.js";
import { baselineLinearCurve, hardQuadraticCurve, milestoneCurve } from "./levelCurves.js";
import type { EconomyCandidate } from "./types.js";

export const economyCandidates: EconomyCandidate[] = [
  {
    name: "candidate-0-mvp-baseline",
    formula: baselineMvpFormula,
    levelCurve: baselineLinearCurve,
    dailyCap: noDailyCap,
    weeklyCap: noWeeklyCap,
    importMode: "none"
  },
  {
    name: "candidate-1-hard-linear",
    formula: hardLinearFormula,
    levelCurve: hardQuadraticCurve,
    dailyCap: hardDailySoftCap,
    weeklyCap: hardWeeklyCap,
    importMode: "profile-only"
  },
  {
    name: "candidate-2-output-focused",
    formula: outputFocusedFormula,
    levelCurve: milestoneCurve,
    dailyCap: hardDailySoftCap,
    weeklyCap: hardWeeklyCap,
    importMode: "profile-only"
  },
  {
    name: "candidate-3-sqrt-compression",
    formula: sqrtCompressionFormula,
    levelCurve: hardQuadraticCurve,
    dailyCap: moderateDailySoftCap,
    weeklyCap: hardWeeklyCap,
    importMode: "cap",
    importCapXp: 25
  },
  {
    name: "candidate-4-log-compression",
    formula: logCompressionFormula,
    levelCurve: milestoneCurve,
    dailyCap: moderateDailySoftCap,
    weeklyCap: hardWeeklyCap,
    importMode: "cap",
    importCapXp: 25
  }
];

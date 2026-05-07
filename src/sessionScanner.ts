import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import type {
  ScanObservationsResult,
  ScanSessionsOptions,
  ScannerWarnings,
  TokenObservation,
  TokenUsage
} from "./types.js";

type RawUsage = Record<string, unknown>;

const EMPTY_WARNINGS: ScannerWarnings = {
  malformedJsonLines: 0,
  unknownTokenShapes: 0,
  unreadableFiles: 0
};

export async function scanSessions(
  codexHome: string,
  options: ScanSessionsOptions = {}
): Promise<ScanObservationsResult> {
  const sessionsDir = path.join(codexHome, "sessions");
  const warnings = { ...EMPTY_WARNINGS };

  if (!(await directoryExists(sessionsDir))) {
    return {
      observations: [],
      warnings,
      filesScanned: 0
    };
  }

  const sessionFiles = await findRolloutFiles(sessionsDir, warnings);
  const observations: TokenObservation[] = [];
  let filesScanned = 0;

  for (const sessionFile of sessionFiles) {
    const result = await scanSessionFile(codexHome, sessionFile, warnings, options);
    if (result !== null) {
      filesScanned += 1;
      observations.push(...result);
    }
  }

  return {
    observations,
    warnings,
    filesScanned
  };
}

async function findRolloutFiles(
  directory: string,
  warnings: ScannerWarnings
): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    warnings.unreadableFiles += 1;
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findRolloutFiles(absolutePath, warnings)));
      continue;
    }

    if (entry.isFile() && /^rollout-.*\.jsonl$/u.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function scanSessionFile(
  codexHome: string,
  sessionFile: string,
  warnings: ScannerWarnings,
  options: ScanSessionsOptions
): Promise<TokenObservation[] | null> {
  const relativePath = toPosixRelativePath(codexHome, sessionFile);
  const observations: TokenObservation[] = [];
  let previousTotalUsage: TokenUsage | null = null;
  let lineNumber = 0;

  try {
    const lineReader = createInterface({
      input: createReadStream(sessionFile, { encoding: "utf8" }),
      crlfDelay: Number.POSITIVE_INFINITY
    });

    for await (const line of lineReader) {
      lineNumber += 1;

      if (line.trim().length === 0) {
        continue;
      }

      const parsed = parseJsonLine(line, warnings);
      if (parsed === null) {
        continue;
      }

      const tokenEvent = extractTokenEvent(parsed);
      if (tokenEvent === null) {
        continue;
      }

      const timestamp = extractTimestamp(parsed) ?? `line-${lineNumber}`;
      const usage = extractUsage(tokenEvent, previousTotalUsage);

      if (usage.kind === "invalid") {
        warnings.unknownTokenShapes += 1;
        continue;
      }

      if (tokenEvent.totalUsage !== null) {
        previousTotalUsage = tokenEvent.totalUsage;
      }

      if (usage.kind === "none") {
        continue;
      }

      if (!isWithinSince(timestamp, options.since)) {
        continue;
      }

      observations.push({
        id: createObservationId(relativePath, lineNumber, timestamp, usage.usage, tokenEvent.totalUsage),
        sessionRelativePath: relativePath,
        lineNumber,
        timestamp,
        usage: usage.usage
      });
    }
  } catch {
    warnings.unreadableFiles += 1;
    return null;
  }

  return observations;
}

function isWithinSince(timestamp: string, since: Date | undefined): boolean {
  if (!since) {
    return true;
  }

  const parsedTime = Date.parse(timestamp);
  if (Number.isNaN(parsedTime)) {
    return false;
  }

  return parsedTime >= since.getTime();
}

function createObservationId(
  relativePath: string,
  lineNumber: number,
  timestamp: string,
  usage: TokenUsage,
  totalUsage: TokenUsage | null
): string {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        relativePath,
        lineNumber,
        timestamp,
        usage,
        totalUsage
      })
    )
    .digest("hex")
    .slice(0, 32);

  return `${relativePath}:${hash}`;
}

function parseJsonLine(line: string, warnings: ScannerWarnings): unknown | null {
  try {
    return JSON.parse(line);
  } catch {
    warnings.malformedJsonLines += 1;
    return null;
  }
}

interface TokenEventUsage {
  lastUsage: TokenUsage | null;
  totalUsage: TokenUsage | null;
}

function extractTokenEvent(value: unknown): TokenEventUsage | null {
  if (!isRecord(value)) {
    return null;
  }

  const tokenContainer = findTokenCountContainer(value);
  if (!tokenContainer) {
    return null;
  }

  const usageContainers = [
    tokenContainer.info,
    tokenContainer,
    tokenContainer.msg,
    tokenContainer.payload
  ].filter(isRecord);

  return {
    lastUsage: normalizeUsageFromContainers(usageContainers, "last_token_usage"),
    totalUsage: normalizeUsageFromContainers(usageContainers, "total_token_usage")
  };
}

function findTokenCountContainer(value: Record<string, unknown>): Record<string, unknown> | null {
  const queue: Array<{ value: Record<string, unknown>; depth: number }> = [{ value, depth: 0 }];
  const seen = new Set<Record<string, unknown>>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.value)) {
      continue;
    }

    seen.add(current.value);
    if (current.value.type === "token_count") {
      return current.value;
    }

    if (current.depth >= 4) {
      continue;
    }

    for (const child of Object.values(current.value)) {
      if (isRecord(child)) {
        queue.push({ value: child, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

function normalizeUsageFromContainers(
  containers: Record<string, unknown>[],
  key: "last_token_usage" | "total_token_usage"
): TokenUsage | null {
  for (const container of containers) {
    const usage = normalizeUsage(container[key]);
    if (usage !== null) {
      return usage;
    }
  }

  return null;
}

type ExtractUsageResult =
  | { kind: "usage"; usage: TokenUsage }
  | { kind: "none" }
  | { kind: "invalid" };

function extractUsage(
  tokenEvent: TokenEventUsage,
  previousTotalUsage: TokenUsage | null
): ExtractUsageResult {
  if (tokenEvent.lastUsage !== null) {
    return { kind: "usage", usage: tokenEvent.lastUsage };
  }

  if (tokenEvent.totalUsage === null) {
    return { kind: "invalid" };
  }

  if (previousTotalUsage === null) {
    return { kind: "none" };
  }

  const delta = subtractUsage(tokenEvent.totalUsage, previousTotalUsage);
  return isPositiveDelta(delta) ? { kind: "usage", usage: delta } : { kind: "none" };
}

function subtractUsage(current: TokenUsage, previous: TokenUsage): TokenUsage {
  return {
    inputTokens: current.inputTokens - previous.inputTokens,
    cachedInputTokens: current.cachedInputTokens - previous.cachedInputTokens,
    outputTokens: current.outputTokens - previous.outputTokens,
    reasoningOutputTokens: current.reasoningOutputTokens - previous.reasoningOutputTokens,
    totalTokens: current.totalTokens - previous.totalTokens
  };
}

function normalizeUsage(value: unknown): TokenUsage | null {
  if (!isRecord(value)) {
    return null;
  }

  const raw = value as RawUsage;
  const inputTokens = toOptionalNumber(raw.input_tokens);
  const cachedInputTokens = toOptionalNumber(raw.cached_input_tokens);
  const outputTokens = toOptionalNumber(raw.output_tokens);
  const reasoningOutputTokens = toOptionalNumber(raw.reasoning_output_tokens);
  const totalTokens = toOptionalNumber(raw.total_tokens);

  if (
    inputTokens === null ||
    cachedInputTokens === null ||
    outputTokens === null ||
    reasoningOutputTokens === null ||
    totalTokens === null
  ) {
    return null;
  }

  if (
    raw.input_tokens === undefined &&
    raw.cached_input_tokens === undefined &&
    raw.output_tokens === undefined &&
    raw.reasoning_output_tokens === undefined &&
    raw.total_tokens === undefined
  ) {
    return null;
  }

  const normalizedInputTokens = inputTokens ?? 0;
  const normalizedCachedInputTokens = cachedInputTokens ?? 0;
  const normalizedOutputTokens = outputTokens ?? 0;
  const normalizedReasoningOutputTokens = reasoningOutputTokens ?? 0;
  const normalizedTotalTokens =
    totalTokens ??
    normalizedInputTokens +
      normalizedOutputTokens +
      normalizedReasoningOutputTokens;

  return {
    inputTokens: normalizedInputTokens,
    cachedInputTokens: normalizedCachedInputTokens,
    outputTokens: normalizedOutputTokens,
    reasoningOutputTokens: normalizedReasoningOutputTokens,
    totalTokens: normalizedTotalTokens
  };
}

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.floor(value);
}

function isPositiveDelta(usage: TokenUsage): boolean {
  if (
    usage.inputTokens < 0 ||
    usage.cachedInputTokens < 0 ||
    usage.outputTokens < 0 ||
    usage.reasoningOutputTokens < 0 ||
    usage.totalTokens < 0
  ) {
    return false;
  }

  return (
    usage.inputTokens > 0 ||
    usage.cachedInputTokens > 0 ||
    usage.outputTokens > 0 ||
    usage.reasoningOutputTokens > 0 ||
    usage.totalTokens > 0
  );
}

function extractTimestamp(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return typeof value.timestamp === "string" ? value.timestamp : null;
}

async function directoryExists(directory: string): Promise<boolean> {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

function toPosixRelativePath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

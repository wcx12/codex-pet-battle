import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import path from "node:path";

import { recordPracticeBattleResult, runPracticeBattle } from "../battle/battleEngine.js";
import type { BattleDifficulty } from "../battle/battleTypes.js";
import { DEFAULT_STATE_FILE_NAME, ECONOMY_VERSION } from "../constants.js";
import { createDoctorReport } from "../diagnostics.js";
import { UserFacingError } from "../errors.js";
import { backupPetState, createDefaultPetState, readPetState, writePetStateAtomically } from "../petStateStore.js";
import { sanitizeErrorMessage } from "../privacy.js";
import { runPetScan } from "../scanWorkflow.js";
import { dashboardHtml, dashboardScript, dashboardStyles } from "./dashboardAssets.js";
import {
  listDashboardPetPackages,
  loadDashboardPetPackage,
  readDashboardPetSpritesheet
} from "./dashboardPetAssets.js";
import {
  createDefaultDashboardConfig,
  toDashboardScanSummary,
  toDashboardStatus
} from "./dashboardSummary.js";
import type { DashboardAutoScanStatus, DashboardScanSummary } from "./dashboardTypes.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4317;
const DEFAULT_AUTO_SCAN_INTERVAL_MINUTES = 10;
const DEFAULT_AUTO_SCAN_RECENT_DAYS = 30;
const MIN_AUTO_SCAN_INTERVAL_MINUTES = 1;
const MAX_BODY_BYTES = 1024 * 1024;

export interface DashboardServerOptions {
  cliCodexHome?: string;
  stateFile?: string;
  host?: string;
  port?: number;
  petId?: string;
  petAssetRoot?: string;
  autoScan?: {
    enabled?: boolean;
    intervalMinutes?: number;
    recentDays?: number | null;
  };
}

export interface DashboardServerHandle {
  server: Server;
  host: string;
  port: number;
  url: string;
  close(): Promise<void>;
}

interface ScanRequestBody {
  recentDays?: unknown;
  confirm?: unknown;
}

interface AutoScanRequestBody {
  intervalMinutes?: unknown;
  recentDays?: unknown;
  runImmediately?: unknown;
}

interface BattleRequestBody {
  difficulty?: unknown;
  seed?: unknown;
  moveId?: unknown;
}

interface PetSelectRequestBody {
  petId?: unknown;
}

interface DashboardRequestBody extends ScanRequestBody, AutoScanRequestBody, BattleRequestBody, PetSelectRequestBody {}

class DashboardHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "DashboardHttpError";
  }
}

export async function startDashboardServer(
  options: DashboardServerOptions = {}
): Promise<DashboardServerHandle> {
  const host = options.host ?? DEFAULT_HOST;
  const requestedPort = options.port ?? DEFAULT_PORT;
  const stateFile = path.resolve(options.stateFile ?? DEFAULT_STATE_FILE_NAME);
  const writeToken = randomUUID();
  let lastDryRunKey: string | null = null;
  let scanChain: Promise<void> = Promise.resolve();
  const autoScan = createAutoScanController();

  const server = createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      sendError(response, error);
    });
  });

  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? "/", `http://${host}`);

    if (request.method === "GET" && url.pathname === "/") {
      sendText(response, 200, dashboardHtml, "text/html; charset=utf-8");
      return;
    }

    if (request.method === "GET" && url.pathname === "/styles.css") {
      sendText(response, 200, dashboardStyles, "text/css; charset=utf-8");
      return;
    }

    if (request.method === "GET" && url.pathname === "/app.js") {
      sendText(response, 200, dashboardScript, "text/javascript; charset=utf-8");
      return;
    }

    if (request.method === "GET" && url.pathname === "/pet/pet.json") {
      const petPackage = await loadDashboardPetPackage({
        cliCodexHome: options.cliCodexHome,
        petId: options.petId,
        petAssetRoot: options.petAssetRoot
      });
      if (petPackage === null) {
        throw new DashboardHttpError(404, "Pet package not found.");
      }

      sendJson(response, 200, petPackage.manifest);
      return;
    }

    if (request.method === "GET" && url.pathname === "/pet/spritesheet.webp") {
      const petPackage = await loadDashboardPetPackage({
        cliCodexHome: options.cliCodexHome,
        petId: options.petId,
        petAssetRoot: options.petAssetRoot
      });
      if (petPackage === null) {
        throw new DashboardHttpError(404, "Pet package not found.");
      }

      sendBinary(response, 200, await readDashboardPetSpritesheet(petPackage), "image/webp");
      return;
    }

    const petAssetRoute = parsePetAssetRoute(url.pathname);
    if (request.method === "GET" && petAssetRoute?.asset === "manifest") {
      const petPackage = await loadDashboardPetPackage({
        cliCodexHome: options.cliCodexHome,
        petId: petAssetRoute.petId,
        petAssetRoot: options.petAssetRoot
      });
      if (petPackage === null) {
        throw new DashboardHttpError(404, "Pet package not found.");
      }

      sendJson(response, 200, petPackage.manifest);
      return;
    }

    if (request.method === "GET" && petAssetRoute?.asset === "spritesheet") {
      const petPackage = await loadDashboardPetPackage({
        cliCodexHome: options.cliCodexHome,
        petId: petAssetRoute.petId,
        petAssetRoot: options.petAssetRoot
      });
      if (petPackage === null) {
        throw new DashboardHttpError(404, "Pet package not found.");
      }

      sendBinary(response, 200, await readDashboardPetSpritesheet(petPackage), "image/webp");
      return;
    }

    if (request.method === "GET" && url.pathname === "/favicon.ico") {
      response.writeHead(204, {
        "Cache-Control": "no-store"
      });
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(
        response,
        200,
        createDefaultDashboardConfig(writeToken, stateFile, {
          defaultIntervalMinutes: DEFAULT_AUTO_SCAN_INTERVAL_MINUTES,
          minIntervalMinutes: MIN_AUTO_SCAN_INTERVAL_MINUTES
        })
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/pets") {
      sendJson(
        response,
        200,
        await listDashboardPetPackages({
          cliCodexHome: options.cliCodexHome,
          petId: options.petId,
          petAssetRoot: options.petAssetRoot
        })
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/pet/select") {
      requireWriteToken(request, writeToken);
      const body = await readJsonBody(request);
      const petId = parseRequiredPetId(body.petId);
      const result = await runSerializedScan(async () => {
        const petPackage = await loadDashboardPetPackage({
          cliCodexHome: options.cliCodexHome,
          petId,
          petAssetRoot: options.petAssetRoot
        });
        if (petPackage === null) {
          throw new DashboardHttpError(404, "Pet package not found.");
        }
        const now = new Date();
        const state = (await readPetState(stateFile)) ?? createDefaultPetState(now);
        const nextState = {
          ...state,
          activePetId: petPackage.manifest.id,
          pet: {
            ...state.pet,
            name: petPackage.manifest.displayName
          },
          updatedAt: now.toISOString()
        };
        await writePetStateAtomically(stateFile, nextState);
        lastDryRunKey = null;
        return {
          selectedPet: petPackage.manifest,
          resultingStatus: toDashboardStatus(nextState, stateFile, now)
        };
      });
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auto-scan") {
      sendJson(response, 200, {
        autoScan: autoScan.getStatus()
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auto-scan/start") {
      requireWriteToken(request, writeToken);
      const body = await readJsonBody(request);
      const intervalMinutes = parseOptionalAutoScanInterval(body.intervalMinutes);
      const recentDays = parseOptionalRecentDays(body.recentDays);
      autoScan.enable({
        intervalMinutes: intervalMinutes ?? autoScan.getStatus().intervalMinutes,
        recentDays
      });

      if (body.runImmediately === true) {
        await autoScan.runNow();
      }

      sendJson(response, 200, {
        autoScan: autoScan.getStatus()
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auto-scan/stop") {
      requireWriteToken(request, writeToken);
      autoScan.disable();
      sendJson(response, 200, {
        autoScan: autoScan.getStatus()
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      const state = (await readPetState(stateFile)) ?? createDefaultPetState(new Date());
      sendJson(response, 200, {
        status: toDashboardStatus(state, stateFile, new Date())
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/doctor") {
      sendJson(
        response,
        200,
        {
          doctor: await createDoctorReport({
            cliCodexHome: options.cliCodexHome,
            stateFile,
            petAssetRoot: options.petAssetRoot
          })
        }
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/state/backup") {
      requireWriteToken(request, writeToken);
      const backup = await backupPetState(stateFile);
      sendJson(response, 200, {
        backup: {
          stateFileLabel: path.basename(stateFile),
          backupFileLabel: path.basename(backup.backupFilePath),
          backedUpAt: backup.backedUpAt
        }
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/battle/practice") {
      requireWriteToken(request, writeToken);
      const body = await readJsonBody(request);
      const difficulty = parseOptionalBattleDifficulty(body.difficulty);
      const seed = parseOptionalBattleSeed(body.seed);
      const preferredMoveId = parseOptionalBattleMoveId(body.moveId);
      const result = await runSerializedScan(async () => {
        const state = (await readPetState(stateFile)) ?? createDefaultPetState(new Date());
        const battle = runPracticeBattle(state, { difficulty, seed, preferredMoveId });
        if (preferredMoveId && battle.preferredMoveId !== preferredMoveId) {
          throw new DashboardHttpError(400, "moveId must be one of the pet's unlocked moves.");
        }
        const now = new Date();
        const nextState = recordPracticeBattleResult(state, battle, now);
        await writePetStateAtomically(stateFile, nextState);
        lastDryRunKey = null;
        return {
          battle,
          resultingStatus: toDashboardStatus(nextState, stateFile, now)
        };
      });
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/scan/dry-run") {
      requireWriteToken(request, writeToken);
      const body = await readJsonBody(request);
      const recentDays = parseOptionalRecentDays(body.recentDays);
      const scan = await runSerializedScan(() =>
        runPetScan({
          cliCodexHome: options.cliCodexHome,
          stateFile,
          dryRun: true,
          recentDays
        })
      );
      lastDryRunKey = scanKey(recentDays);
      sendJson(response, 200, toDashboardScanSummary(scan, stateFile, new Date()));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/scan/confirm") {
      requireWriteToken(request, writeToken);
      const body = await readJsonBody(request);
      if (body.confirm !== true) {
        throw new DashboardHttpError(400, "Confirm scan requires confirm=true.");
      }

      const recentDays = parseOptionalRecentDays(body.recentDays);
      if (lastDryRunKey !== scanKey(recentDays)) {
        throw new DashboardHttpError(409, "Run dry-run before confirming scan.");
      }

      const confirmKey = scanKey(recentDays);
      const scan = await runSerializedScan(async () => {
        if (lastDryRunKey !== confirmKey) {
          throw new DashboardHttpError(409, "Run dry-run before confirming scan.");
        }

        const result = await runPetScan({
          cliCodexHome: options.cliCodexHome,
          stateFile,
          dryRun: false,
          recentDays
        });
        lastDryRunKey = null;
        return result;
      });
      sendJson(response, 200, toDashboardScanSummary(scan, stateFile, new Date()));
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      throw new DashboardHttpError(
        request.method === "GET" || request.method === "POST" ? 404 : 405,
        request.method === "GET" || request.method === "POST"
          ? "Dashboard API route not found."
          : "Dashboard API method not allowed."
      );
    }

    throw new DashboardHttpError(404, "Dashboard route not found.");
  }

  const port = await listenOnAvailablePort(server, host, requestedPort);
  if (options.autoScan?.enabled) {
    autoScan.enable({
      intervalMinutes: options.autoScan.intervalMinutes ?? DEFAULT_AUTO_SCAN_INTERVAL_MINUTES,
      recentDays:
        options.autoScan.recentDays === null
          ? undefined
          : options.autoScan.recentDays ?? DEFAULT_AUTO_SCAN_RECENT_DAYS
    });
    void autoScan.runNow();
  }

  return {
    server,
    host,
    port,
    url: `http://${host}:${port}`,
    close() {
      autoScan.disable();
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };

  function runSerializedScan<T>(task: () => Promise<T>): Promise<T> {
    const run = scanChain.then(task, task);
    scanChain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  function createAutoScanController() {
    let enabled = false;
    let runningPromise: Promise<void> | null = null;
    let timer: NodeJS.Timeout | null = null;
    let intervalMinutes = options.autoScan?.intervalMinutes ?? DEFAULT_AUTO_SCAN_INTERVAL_MINUTES;
    let recentDays: number | undefined =
      options.autoScan?.recentDays === null
        ? undefined
        : options.autoScan?.recentDays ?? DEFAULT_AUTO_SCAN_RECENT_DAYS;
    let lastStartedAt: string | undefined;
    let lastFinishedAt: string | undefined;
    let nextRunAt: string | undefined;
    let lastError: string | undefined;
    let lastSummary: DashboardScanSummary | undefined;

    function enable(config: { intervalMinutes: number; recentDays?: number }): void {
      intervalMinutes = config.intervalMinutes;
      recentDays = config.recentDays;
      enabled = true;
      scheduleNextRun(intervalMinutesToMs(intervalMinutes));
    }

    function disable(): void {
      enabled = false;
      clearTimer();
      nextRunAt = undefined;
    }

    async function runNow(): Promise<void> {
      if (!enabled) {
        throw new DashboardHttpError(409, "Auto scan is disabled.");
      }

      clearTimer();
      if (!runningPromise) {
        runningPromise = runOnce().finally(() => {
          runningPromise = null;
          if (enabled) {
            scheduleNextRun(intervalMinutesToMs(intervalMinutes));
          }
        });
      }

      await runningPromise;
    }

    function getStatus(): DashboardAutoScanStatus {
      return {
        enabled,
        running: runningPromise !== null,
        intervalMinutes,
        recentDays,
        lastStartedAt,
        lastFinishedAt,
        nextRunAt,
        lastError,
        lastSummary
      };
    }

    function scheduleNextRun(delayMs: number): void {
      clearTimer();
      if (!enabled) {
        nextRunAt = undefined;
        return;
      }

      const next = new Date(Date.now() + delayMs);
      nextRunAt = next.toISOString();
      timer = setTimeout(() => {
        void runNow();
      }, delayMs);
    }

    async function runOnce(): Promise<void> {
      lastStartedAt = new Date().toISOString();
      nextRunAt = undefined;
      lastDryRunKey = null;
      try {
        const scan = await runSerializedScan(() =>
          runPetScan({
            cliCodexHome: options.cliCodexHome,
            stateFile,
            dryRun: false,
            recentDays
          })
        );
        lastDryRunKey = null;
        lastSummary = toDashboardScanSummary(scan, stateFile, new Date());
        lastError = undefined;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastError = sanitizeErrorMessage(message);
      } finally {
        lastFinishedAt = new Date().toISOString();
      }
    }

    function clearTimer(): void {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    return {
      enable,
      disable,
      runNow,
      getStatus
    };
  }
}

function requireWriteToken(request: IncomingMessage, expectedToken: string): void {
  if (request.headers["x-codex-pet-dashboard-token"] !== expectedToken) {
    throw new DashboardHttpError(403, "Dashboard write token is missing or invalid.");
  }
}

function parseOptionalRecentDays(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "all") {
    return undefined;
  }

  if (!Number.isInteger(value) || typeof value !== "number" || value < 1) {
    throw new DashboardHttpError(400, "recentDays must be a positive integer or omitted.");
  }

  return value;
}

function parseOptionalAutoScanInterval(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    !Number.isInteger(value) ||
    typeof value !== "number" ||
    value < MIN_AUTO_SCAN_INTERVAL_MINUTES
  ) {
    throw new DashboardHttpError(
      400,
      `intervalMinutes must be an integer greater than or equal to ${MIN_AUTO_SCAN_INTERVAL_MINUTES}.`
    );
  }

  return value;
}

function parseOptionalBattleDifficulty(value: unknown): BattleDifficulty | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (value === "easy" || value === "normal" || value === "hard") {
    return value;
  }

  throw new DashboardHttpError(400, "difficulty must be easy, normal, or hard.");
}

function parseOptionalBattleSeed(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string" || value.length > 128) {
    throw new DashboardHttpError(400, "seed must be a short string when provided.");
  }

  return value;
}

function parseOptionalBattleMoveId(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    !/^[a-z0-9](?:[a-z0-9_:-]{0,62}[a-z0-9])?$/u.test(value)
  ) {
    throw new DashboardHttpError(400, "moveId must be a safe move id.");
  }

  return value;
}

function parseRequiredPetId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u.test(value)
  ) {
    throw new DashboardHttpError(400, "petId must be a safe pet id.");
  }

  return value;
}

async function readJsonBody(request: IncomingMessage): Promise<DashboardRequestBody> {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      throw new DashboardHttpError(413, "Request body is too large.");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Invalid body");
    }
    return parsed as DashboardRequestBody;
  } catch {
    throw new DashboardHttpError(400, "Request body must be valid JSON.");
  }
}

function intervalMinutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  const body = `${JSON.stringify(payload)}\n`;
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

function sendText(
  response: ServerResponse,
  statusCode: number,
  body: string,
  contentType: string
): void {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

function sendBinary(
  response: ServerResponse,
  statusCode: number,
  body: Buffer,
  contentType: string
): void {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "Content-Length": body.byteLength
  });
  response.end(body);
}

function sendError(response: ServerResponse, error: unknown): void {
  if (response.headersSent) {
    response.end();
    return;
  }

  if (error instanceof DashboardHttpError) {
    sendJson(response, error.statusCode, {
      error: sanitizeErrorMessage(error.message)
    });
    return;
  }

  if (error instanceof UserFacingError) {
    sendJson(response, 400, {
      error: sanitizeErrorMessage(error.message)
    });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  sendJson(response, 500, {
    error: `Unexpected dashboard error: ${sanitizeErrorMessage(message)}`
  });
}

function listenOnAvailablePort(server: Server, host: string, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryListen = (candidatePort: number, attemptsLeft: number) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.off("listening", onListening);
        if (error.code === "EADDRINUSE" && candidatePort !== 0 && attemptsLeft > 0) {
          tryListen(candidatePort + 1, attemptsLeft - 1);
          return;
        }
        reject(error);
      };

      const onListening = () => {
        server.off("error", onError);
        const address = server.address();
        if (typeof address === "object" && address !== null) {
          resolve(address.port);
          return;
        }
        resolve(candidatePort);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(candidatePort, host);
    };

    tryListen(port, 20);
  });
}

function scanKey(recentDays: number | undefined): string {
  return recentDays === undefined ? "all" : String(recentDays);
}

function parsePetAssetRoute(pathname: string): { petId: string; asset: "manifest" | "spritesheet" } | null {
  const match = /^\/pet\/([^/]+)\/(pet\.json|spritesheet\.webp)$/u.exec(pathname);
  if (!match) {
    return null;
  }

  try {
    return {
      petId: decodeURIComponent(match[1]),
      asset: match[2] === "pet.json" ? "manifest" : "spritesheet"
    };
  } catch {
    throw new DashboardHttpError(400, "Pet id must be a safe slug.");
  }
}

export const dashboardServerDefaults = {
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  economyVersion: ECONOMY_VERSION
} as const;

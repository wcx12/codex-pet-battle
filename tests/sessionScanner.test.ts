import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { scanSessions } from "../src/sessionScanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("scanSessions", () => {
  it("returns zero activity when the sessions directory is missing", async () => {
    const codexHome = await makeTempDir();

    await expect(scanSessions(codexHome)).resolves.toEqual({
      observations: [],
      warnings: {
        malformedJsonLines: 0,
        unknownTokenShapes: 0,
        unreadableFiles: 0
      },
      filesScanned: 0
    });
  });

  it("parses token_count events from current Codex payload.info shape", async () => {
    const codexHome = fixturePath("codex-home-basic");
    const result = await scanSessions(codexHome);

    expect(result.filesScanned).toBe(1);
    expect(result.warnings).toEqual({
      malformedJsonLines: 0,
      unknownTokenShapes: 0,
      unreadableFiles: 0
    });
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]).toMatchObject({
      sessionRelativePath: "sessions/2026/05/07/rollout-basic.jsonl",
      lineNumber: 1,
      timestamp: "2026-05-07T00:00:00.000Z",
      usage: {
        inputTokens: 1000,
        cachedInputTokens: 0,
        outputTokens: 250,
        reasoningOutputTokens: 250,
        totalTokens: 1500
      }
    });
    expect(result.observations[0]?.id).toMatch(
      /^sessions\/2026\/05\/07\/rollout-basic\.jsonl:[a-f0-9]{32}$/u
    );
    expect(result.observations[0]?.id).not.toContain(":1:");
    expect(result.observations[0]?.id).not.toContain("2026-05-07T00:00:00.000Z");

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("SECRET_PROMPT_SHOULD_NOT_LEAK");
    expect(serialized).not.toContain("TOOL_OUTPUT_SHOULD_NOT_LEAK");
    expect(serialized).not.toContain("sk-test-privacy");
    expect(serialized).not.toContain(codexHome);
  });

  it("counts malformed JSON and unknown token usage shapes without stopping the scan", async () => {
    const result = await scanSessions(fixturePath("codex-home-malformed"));

    expect(result.filesScanned).toBe(1);
    expect(result.warnings).toEqual({
      malformedJsonLines: 1,
      unknownTokenShapes: 1,
      unreadableFiles: 0
    });
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.usage.totalTokens).toBe(10);
  });

  it("computes positive deltas from total_token_usage when last_token_usage is absent", async () => {
    const result = await scanSessions(fixturePath("codex-home-total-delta"));

    expect(result.warnings).toEqual({
      malformedJsonLines: 0,
      unknownTokenShapes: 0,
      unreadableFiles: 0
    });
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.id).toMatch(
      /^sessions\/2026\/05\/07\/rollout-total-delta\.jsonl:[a-f0-9]{32}$/u
    );
    expect(result.observations[0]?.usage).toEqual({
      inputTokens: 1500,
      cachedInputTokens: 500,
      outputTokens: 250,
      reasoningOutputTokens: 0,
      totalTokens: 2250
    });
  });

  it("filters observations by since while preserving earlier total_usage baselines", async () => {
    const result = await scanSessions(fixturePath("codex-home-total-delta"), {
      since: new Date("2026-05-07T00:00:00.500Z")
    });

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.timestamp).toBe("2026-05-07T00:00:01.000Z");
    expect(result.observations[0]?.usage.totalTokens).toBe(2250);
  });

  it("excludes observations older than since", async () => {
    const result = await scanSessions(fixturePath("codex-home-basic"), {
      since: new Date("2026-05-08T00:00:00.000Z")
    });

    expect(result.filesScanned).toBe(1);
    expect(result.observations).toHaveLength(0);
  });

  it("includes observations exactly at since and excludes observations just before it", async () => {
    const codexHome = await makeTempDir();
    const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      path.join(sessionDir, "rollout-boundary.jsonl"),
      `${tokenCountLine("2026-05-07T00:00:00.499Z", 100)}\n${tokenCountLine(
        "2026-05-07T00:00:00.500Z",
        200
      )}\n`,
      "utf8"
    );

    const result = await scanSessions(codexHome, {
      since: new Date("2026-05-07T00:00:00.500Z")
    });

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.timestamp).toBe("2026-05-07T00:00:00.500Z");
    expect(result.observations[0]?.usage.inputTokens).toBe(200);
  });

  it("excludes missing timestamps when since filtering is active", async () => {
    const codexHome = await makeTempDir();
    const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      path.join(sessionDir, "rollout-missing-timestamp.jsonl"),
      `${JSON.stringify({
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            last_token_usage: {
              input_tokens: 100,
              cached_input_tokens: 0,
              output_tokens: 0,
              reasoning_output_tokens: 0,
              total_tokens: 100
            }
          }
        }
      })}\n`,
      "utf8"
    );

    expect((await scanSessions(codexHome)).observations).toHaveLength(1);
    expect(
      (await scanSessions(codexHome, { since: new Date("2026-05-07T00:00:00.000Z") }))
        .observations
    ).toHaveLength(0);
  });

  it("also accepts token_count events with usage nested under msg", async () => {
    const codexHome = await makeTempDir();
    const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      path.join(sessionDir, "rollout-msg-shape.jsonl"),
      `${JSON.stringify({
        type: "token_count",
        timestamp: "2026-05-07T00:00:00.000Z",
        msg: {
          last_token_usage: {
            input_tokens: 250,
            cached_input_tokens: 0,
            output_tokens: 0,
            reasoning_output_tokens: 0,
            total_tokens: 250
          }
        }
      })}\n`,
      "utf8"
    );

    const result = await scanSessions(codexHome);

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.usage.inputTokens).toBe(250);
  });

  it("defaults missing usage buckets to zero and finds deeper token_count containers", async () => {
    const codexHome = await makeTempDir();
    const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      path.join(sessionDir, "rollout-deep-shape.jsonl"),
      `${JSON.stringify({
        type: "event_msg",
        timestamp: "2026-05-07T00:00:00.000Z",
        payload: {
          envelope: {
            nested: {
              type: "token_count",
              info: {
                last_token_usage: {
                  input_tokens: 100,
                  output_tokens: 25
                }
              }
            }
          }
        }
      })}\n`,
      "utf8"
    );

    const result = await scanSessions(codexHome);

    expect(result.warnings.unknownTokenShapes).toBe(0);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]?.usage).toEqual({
      inputTokens: 100,
      cachedInputTokens: 0,
      outputTokens: 25,
      reasoningOutputTokens: 0,
      totalTokens: 125
    });
  });

  it("keeps repeated identical token_count lines distinct", async () => {
    const codexHome = await makeTempDir();
    const sessionDir = path.join(codexHome, "sessions", "2026", "05", "07");
    const event = JSON.stringify({
      type: "event_msg",
      timestamp: "2026-05-07T00:00:00.000Z",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 100,
            cached_input_tokens: 0,
            output_tokens: 0,
            reasoning_output_tokens: 0,
            total_tokens: 100
          }
        }
      }
    });
    await mkdir(sessionDir, { recursive: true });
    await writeFile(path.join(sessionDir, "rollout-repeat.jsonl"), `${event}\n${event}\n`, "utf8");

    const result = await scanSessions(codexHome);

    expect(result.observations).toHaveLength(2);
    expect(new Set(result.observations.map(({ id }) => id)).size).toBe(2);
  });
});

function fixturePath(name: string): string {
  return path.join(fixturesDir, name);
}

function tokenCountLine(timestamp: string, inputTokens: number): string {
  return JSON.stringify({
    type: "event_msg",
    timestamp,
    payload: {
      type: "token_count",
      info: {
        last_token_usage: {
          input_tokens: inputTokens,
          cached_input_tokens: 0,
          output_tokens: 0,
          reasoning_output_tokens: 0,
          total_tokens: inputTokens
        }
      }
    }
  });
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "codex-pet-battle-scanner-"));
  tempDirs.push(dir);
  return dir;
}

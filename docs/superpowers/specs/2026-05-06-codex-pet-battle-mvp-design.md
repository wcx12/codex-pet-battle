# Codex Pet Battle MVP Design

## Summary

Codex Pet Battle starts as a local Codex Pets RPG companion. The MVP reads local Codex session logs, extracts token usage events, converts activity into pet experience, and writes a local pet state file that can be shown by a CLI command.

This first milestone intentionally avoids cloud sync, account login, anti-cheat, and live battles. Those features depend on having a stable local growth model first.

## Goals

- Read Codex session JSONL files from the user's local Codex home directory.
- Extract `token_count` events with `total_token_usage` and `last_token_usage`.
- Convert newly observed token usage into experience points.
- Maintain a local pet state with level, experience, lifetime token totals, unlocked skills, and timestamps.
- Provide a simple CLI output that shows the pet's current progression.
- Keep all state local and avoid uploading Codex logs or conversation content.

## Non-Goals

- No online accounts or remote database in the MVP.
- No player-versus-player combat in the MVP.
- No modification of official Codex app internals.
- No attempt to infer code quality from private conversation content.
- No use of local Codex auth tokens or private credentials.

## Recommended Approach

Build a small local command-line application first. It should scan session logs, update pet state, and print a concise status view. This gives us a reliable core loop before we spend effort on desktop UI, custom sprites, cloud sync, or battles.

Alternative approaches considered:

- Desktop companion first: more exciting visually, but it adds windowing, animation, packaging, and platform-specific work before the progression model is proven.
- Web app first: useful for later battles, but premature because local Codex data collection and privacy boundaries are the main unknowns.

## Architecture

The MVP has five small modules:

1. `codexHomeResolver`
   Finds the Codex home directory. It should default to `%USERPROFILE%\.codex` on Windows and allow an override through a CLI flag or environment variable.

2. `sessionScanner`
   Walks `sessions/**/rollout-*.jsonl`, reads JSONL incrementally, and returns token usage observations. It should only parse event metadata needed for progression.

3. `progressionEngine`
   Converts token observations into experience, levels, and skill unlocks. It owns formulas and avoids coupling game rules to file parsing.

4. `petStateStore`
   Reads and writes a local state file, initially `pet_state.local.json`. It tracks processed observations so repeated scans do not double-count experience.

5. `cli`
   Provides commands such as `scan` and `status`. `scan` updates state from Codex logs; `status` prints the current pet summary without changing state.

## Data Flow

1. User runs `scan`.
2. The CLI resolves Codex home.
3. The scanner finds session JSONL files and token usage events.
4. The scanner emits observations keyed by session path, line number, timestamp, and token totals.
5. The state store filters out already processed observations.
6. The progression engine calculates gained experience.
7. The state store writes the updated pet state.
8. The CLI prints gained experience, current level, and newly unlocked skills.

## Pet State Shape

The local state should be explicit and versioned:

```json
{
  "schemaVersion": 1,
  "pet": {
    "name": "Pathy",
    "level": 1,
    "xp": 0,
    "xpToNextLevel": 100,
    "skills": []
  },
  "usage": {
    "lifetimeInputTokens": 0,
    "lifetimeCachedInputTokens": 0,
    "lifetimeOutputTokens": 0,
    "lifetimeReasoningOutputTokens": 0,
    "lifetimeTotalTokens": 0
  },
  "processedObservations": [],
  "createdAt": "2026-05-06T00:00:00.000Z",
  "updatedAt": "2026-05-06T00:00:00.000Z"
}
```

`processedObservations` can start as an array of stable IDs in the form `relative-session-path:line-number:timestamp`. If it becomes large, a later migration can replace it with per-file offsets or checkpoints.

## Experience Rules

The MVP should reward real activity while avoiding runaway growth from cached context:

- Each `token_count` event should use `last_token_usage` for newly earned XP and lifetime totals.
- If `last_token_usage` is absent but `total_token_usage` exists, the scanner may compute a positive delta from the previous token total in the same session.
- Uncached input tokens are `max(input_tokens - cached_input_tokens, 0)`.
- Uncached `input_tokens`: 1 XP per 1,000 uncached input tokens.
- `cached_input_tokens`: 1 XP per 5,000 cached input tokens.
- `output_tokens`: 1 XP per 250 output tokens.
- `reasoning_output_tokens`: 1 XP per 250 reasoning output tokens.
- Each scan rounds down fractional XP after summing all new observations.
- A scan that finds new activity always grants at least 1 XP.

Level curve:

- Level 1 starts at 0 XP.
- XP required for next level is `100 + (level - 1) * 50`.
- Excess XP carries over after leveling.

Initial skill unlocks:

- Level 2: `token_spark`
- Level 3: `context_sense`
- Level 5: `test_shield`
- Level 8: `refactor_aura`
- Level 10: `battle_ready`

`battle_ready` is only a future-facing milestone in the MVP. It does not enable combat yet.

## Error Handling

- Missing Codex home: show a clear message and exit without creating pet state.
- Missing sessions directory: create pet state if needed and report zero activity.
- Malformed JSONL line: skip the line, count it as a warning, and continue.
- Unknown token event shape: skip the event and report a warning count.
- State file parse failure: stop and ask the user to back up or remove the file before continuing.
- File read permission errors: skip that file, report the path count, and keep scanning other sessions.

## Privacy

The scanner must not store prompts, responses, tool outputs, or conversation text. It should only persist token counters, observation IDs, and pet progression. The README should state this clearly once the MVP is implemented.

## Testing

The first implementation should include focused automated tests:

- Parse a JSONL fixture with valid token events.
- Skip malformed JSONL lines without failing the whole scan.
- Avoid double-counting processed observations across repeated scans.
- Calculate XP and level-ups from known token totals.
- Unlock expected skills at levels 2, 3, 5, 8, and 10.
- Handle a missing sessions directory gracefully.

Manual verification should run the CLI against a fixture directory and, separately, against the developer's local Codex home.

## Future Phases

Phase 2: richer local UI

- Add a small desktop or browser UI.
- Show pet mood, level, XP bar, and recent growth events.
- Optionally integrate custom Codex pet sprites.

Phase 3: cloud sync

- Add accounts, signed pet snapshots, and privacy-preserving sync.
- Upload derived stats only, not Codex logs.

Phase 4: battles

- Add asynchronous battle simulation.
- Match pets within level bands.
- Derive battle stats from level, skills, and traits.
- Add anti-cheat only after the local loop is fun enough to justify online play.

## Acceptance Criteria

- Running `scan` updates local pet state from Codex token events.
- Running `scan` twice without new sessions does not grant additional XP.
- Running `status` shows level, XP, next level progress, lifetime token totals, and skills.
- The implementation does not persist conversation content.
- Tests cover scanner, state storage, and progression rules.

export const dashboardHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Codex Pet Battle</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <div class="app-shell">
      <header class="topbar">
        <div>
          <h1>Codex Pet Battle</h1>
          <p id="stateFileLabel">local state</p>
        </div>
        <div class="topbar-actions">
          <div class="language-toggle" role="group" aria-label="Language">
            <button id="langZh" class="language-button" type="button" data-lang="zh">中文</button>
            <button id="langEn" class="language-button" type="button" data-lang="en">EN</button>
          </div>
          <div id="shareModePill" class="local-pill">127.0.0.1</div>
        </div>
      </header>

      <main class="dashboard-grid">
        <section class="pet-panel" aria-labelledby="petName">
          <div class="pet-stage">
            <div class="pet-device">
              <div id="petSpriteMount" class="pet-sprite-mount" aria-hidden="true">
                <div id="petSprite" class="pet-sprite"></div>
                <div class="pet-avatar pet-avatar-fallback">
                  <span class="pet-eye left"></span>
                  <span class="pet-eye right"></span>
                  <span class="pet-mouth"></span>
                </div>
              </div>
            </div>
            <div class="pet-copy">
              <h2 id="petName">Pathy</h2>
              <p id="petLevel">Level 1</p>
            </div>
          </div>
          <div class="pet-tools">
            <label class="field-label" for="petSelect">
              <span data-i18n="activePet">Pet</span>
              <select id="petSelect" class="select-input"></select>
            </label>
            <div id="petAssetStatus" class="asset-status" role="status"></div>
          </div>
          <div class="xp-block">
            <div class="row-label">
              <span>XP</span>
              <strong id="xpText">0/100</strong>
            </div>
            <div class="xp-track" aria-hidden="true">
              <div id="xpFill" class="xp-fill"></div>
            </div>
          </div>
          <div>
            <div class="section-label" data-i18n="skills">Skills</div>
            <div id="skillsList" class="skill-list"></div>
          </div>
          <div class="updated-line" id="updatedAt">Updated: --</div>
        </section>

        <section class="panel battle-panel" aria-label="Battle">
          <div class="panel-title">
            <h2 data-i18n="battle">Battle</h2>
            <span id="battleMode" data-i18n="battleWaiting">training</span>
          </div>
          <p class="help-text" data-i18n="battleHelp">Run a local turn-based practice battle using your pet level and unlocked skills.</p>
          <div class="battle-controls">
            <label class="field-label" for="battleDifficulty">
              <span data-i18n="difficulty">Difficulty</span>
              <select id="battleDifficulty" class="select-input">
                <option value="easy">Easy</option>
                <option value="normal" selected>Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label class="field-label" for="battleMove">
              <span data-i18n="battleMove">Move</span>
              <select id="battleMove" class="select-input"></select>
            </label>
            <button id="practiceBattleButton" class="button primary" type="button">Practice battle</button>
          </div>
          <div id="battleArena" class="battle-arena" aria-label="Battle arena">
            <div id="battlePetCard" class="combatant-card pet-side">
              <div>
                <strong id="battlePetName">Pathy</strong>
                <span id="battlePetLevel">L1</span>
              </div>
              <div class="hp-track small" aria-hidden="true">
                <div id="battlePetHpFill" class="hp-fill"></div>
              </div>
              <span id="battlePetHpText">--</span>
            </div>
            <div class="arena-versus">
              <span id="battleCue" class="battle-cue">VS</span>
            </div>
            <div id="battleOpponentCard" class="combatant-card opponent-side">
              <div>
                <strong id="battleOpponentName">Practice Rival</strong>
                <span id="battleOpponentLevel">L1</span>
              </div>
              <div class="hp-track small" aria-hidden="true">
                <div id="battleOpponentHpFill" class="hp-fill"></div>
              </div>
              <span id="battleOpponentHpText">--</span>
            </div>
          </div>
          <div>
            <div class="section-label" data-i18n="moveDex">Move Dex</div>
            <div id="moveDexList" class="move-dex-list"></div>
          </div>
          <div class="metric-list battle-list">
            <div><span data-i18n="battleOutcome">Outcome</span><strong id="battleOutcome">--</strong></div>
            <div><span data-i18n="battleOpponent">Opponent</span><strong id="battleOpponent">--</strong></div>
            <div><span data-i18n="battleHp">HP</span><strong id="battleHp" aria-live="polite" aria-atomic="true">--</strong></div>
            <div><span data-i18n="battleTrainingXp">Training XP</span><strong id="battleTrainingXp">--</strong></div>
            <div><span data-i18n="battleRounds">Rounds</span><strong id="battleRounds">--</strong></div>
            <div><span data-i18n="battleRecord">Record</span><strong id="battleRecord">0-0-0</strong></div>
            <div><span data-i18n="battleStreak">Streak</span><strong id="battleStreak">0 / 0</strong></div>
          </div>
          <ol id="battleLog" class="battle-log" aria-live="polite" aria-relevant="additions text"></ol>
          <div id="battleMessageLine" class="message-line" role="status"></div>
        </section>

        <section class="panel adventure-panel" aria-label="Adventure">
          <div class="panel-title">
            <h2 data-i18n="adventure">Adventure</h2>
            <span id="adventureRank">new trainer</span>
          </div>
          <p class="help-text" data-i18n="adventureHelp">Follow the local trainer path: scout, train, win, and level up.</p>
          <div id="questList" class="quest-list"></div>
          <div class="section-label badge-heading" data-i18n="badges">Badges</div>
          <div id="badgeList" class="badge-list"></div>
        </section>

        <section class="panel economy-panel" aria-label="Economy">
          <div class="panel-title">
            <h2>hard-v1</h2>
            <span id="importStatus">profile pending</span>
          </div>
          <div class="metric-list">
            <div><span><span data-i18n="formula">Formula</span><button class="help-dot" type="button" data-tooltip="formula">?</button></span><strong id="formulaName">output-focused</strong></div>
            <div><span><span data-i18n="levelCurve">Level curve</span><button class="help-dot" type="button" data-tooltip="levelCurve">?</button></span><strong id="levelCurveName">milestone</strong></div>
            <div><span><span data-i18n="todayXpUsed">Today XP used</span><button class="help-dot" type="button" data-tooltip="dailyCap">?</button></span><strong id="todayXpUsed">0</strong></div>
            <div><span><span data-i18n="weekXpUsed">Week XP used</span><button class="help-dot" type="button" data-tooltip="weeklyCap">?</button></span><strong id="weekXpUsed">0</strong></div>
            <div><span data-i18n="weekXpLeft">Week XP left</span><strong id="weekXpRemaining">80</strong></div>
            <div><span><span data-i18n="xpRemainder">XP remainder</span><button class="help-dot" type="button" data-tooltip="xpRemainder">?</button></span><strong id="xpRemainder">0</strong></div>
          </div>
        </section>

        <section class="panel scan-panel" aria-label="Scan controls">
          <div class="panel-title">
            <h2 data-i18n="scan">Scan</h2>
            <span id="scanMode">dry-run first</span>
          </div>
          <p id="scanHelp" class="help-text" data-i18n="scanHelp">Run Dry run first. It previews local token metadata and does not write state.</p>
          <div class="segmented" role="group" aria-label="Recent days">
            <button class="segment active" data-days="30" type="button">30</button>
            <button class="segment" data-days="7" type="button">7</button>
            <button class="segment" data-days="all" type="button" data-i18n="all">All</button>
          </div>
          <p id="scanWindowHelp" class="help-text compact" data-i18n="scanWindowHelp">7/30 means the last N x 24 hours. All scans every local session.</p>
          <div class="action-row">
            <button id="dryRunButton" class="button primary" type="button">Dry run</button>
            <button id="confirmButton" class="button guarded" type="button" disabled>Confirm scan</button>
          </div>
          <div id="confirmNote" class="confirm-note" hidden></div>
          <div id="messageLine" class="message-line" role="status"></div>
        </section>

        <section class="panel dex-panel" aria-label="Pet dex">
          <div class="panel-title">
            <h2 data-i18n="petDex">Dex</h2>
            <span data-i18n="dexAvailable">available</span>
          </div>
          <p class="help-text" data-i18n="petDexHelp">Known local pet packages. The active partner is saved in the local state file.</p>
          <div id="petDexList" class="dex-list"></div>
        </section>

        <section class="panel auto-panel" aria-label="Auto scan">
          <div class="panel-title">
            <h2 data-i18n="autoScan">Auto Scan</h2>
            <span id="autoScanMode">off</span>
          </div>
          <p class="help-text" data-i18n="autoScanHelp">Auto scan writes local state on a timer. It uses the selected scan window when you start it.</p>
          <div class="auto-controls">
            <label class="field-label" for="autoInterval">
              <span data-i18n="intervalMinutes">Interval minutes</span>
              <input id="autoInterval" class="number-input" type="number" min="1" step="1" value="10">
            </label>
            <button id="autoStartButton" class="button primary" type="button">Start auto</button>
            <button id="autoStopButton" class="button guarded" type="button" disabled>Stop auto</button>
          </div>
          <div class="metric-list auto-list">
            <div><span data-i18n="lastAutoScan">Last auto scan</span><strong id="autoLastFinished">--</strong></div>
            <div><span data-i18n="nextAutoScan">Next auto scan</span><strong id="autoNextRun">--</strong></div>
            <div><span data-i18n="autoLastResult">Last result</span><strong id="autoLastResult">--</strong></div>
          </div>
          <div id="autoMessageLine" class="message-line" role="status"></div>
        </section>

        <section class="panel maintenance-panel" aria-label="Maintenance">
          <div class="panel-title">
            <h2 data-i18n="maintenance">Maintenance</h2>
            <span data-i18n="localOnly">local only</span>
          </div>
          <div class="metric-list doctor-list">
            <div><span data-i18n="doctorState">State</span><strong id="doctorState">--</strong></div>
            <div><span data-i18n="doctorCodex">Codex home</span><strong id="doctorCodex">--</strong></div>
            <div><span data-i18n="doctorPets">Pets</span><strong id="doctorPets">--</strong></div>
          </div>
          <p class="help-text" data-i18n="maintenanceHelp">Create a local backup beside the current state file without sending state data to the browser.</p>
          <div class="maintenance-actions">
            <button id="refreshDoctorButton" class="button primary" type="button">Refresh check</button>
            <button id="backupStateButton" class="button guarded" type="button">Backup state</button>
          </div>
          <div id="maintenanceMessageLine" class="message-line" role="status"></div>
        </section>

        <section class="panel usage-panel" aria-label="Lifetime tokens">
          <div class="panel-title">
            <h2 data-i18n="lifetimeTokens">Lifetime Tokens</h2>
            <span id="totalTokens">0</span>
          </div>
          <div class="token-grid">
            <div><span data-i18n="input">Input</span><strong id="inputTokens">0</strong></div>
            <div><span><span data-i18n="cached">Cached</span><button class="help-dot" type="button" data-tooltip="cached">?</button></span><strong id="cachedTokens">0</strong></div>
            <div><span data-i18n="output">Output</span><strong id="outputTokens">0</strong></div>
            <div><span data-i18n="reasoning">Reasoning</span><strong id="reasoningTokens">0</strong></div>
          </div>
        </section>

        <section class="panel result-panel" aria-label="Recent scan result">
          <div class="panel-title">
            <h2 data-i18n="recentResult">Recent Result</h2>
            <span id="resultMode">none</span>
          </div>
          <div class="result-grid">
            <div><span data-i18n="files">Files</span><strong id="filesScanned">0</strong></div>
            <div><span data-i18n="newObservations">New observations</span><strong id="newObservations">0</strong></div>
            <div><span><span data-i18n="rawXp">Raw XP</span><button class="help-dot" type="button" data-tooltip="rawXp">?</button></span><strong id="rawXp">0</strong></div>
            <div><span><span data-i18n="dailyCapped">Daily capped</span><button class="help-dot" type="button" data-tooltip="dailyCapped">?</button></span><strong id="dailyCappedXp">0</strong></div>
            <div><span><span data-i18n="weeklyCapped">Weekly capped</span><button class="help-dot" type="button" data-tooltip="weeklyCapped">?</button></span><strong id="weeklyCappedXp">0</strong></div>
            <div><span><span data-i18n="finalXp">Final XP</span><button class="help-dot" type="button" data-tooltip="finalXp">?</button></span><strong id="finalXp">0</strong></div>
            <div><span data-i18n="xpGained">XP gained</span><strong id="gainedXp">0</strong></div>
            <div><span data-i18n="importMode">Import mode</span><strong id="importMode">none</strong></div>
            <div><span data-i18n="recentWindow">Window</span><strong id="recentWindow">30d</strong></div>
            <div><span data-i18n="newlyUnlockedSkills">New skills</span><strong id="newlyUnlockedSkills">none</strong></div>
            <div><span><span data-i18n="warnings">Warnings</span><button class="help-dot" type="button" data-tooltip="warnings">?</button></span><strong id="warnings">0</strong></div>
          </div>
          <div id="resultNote" class="result-note" hidden></div>
        </section>
      </main>
    </div>
    <script src="/app.js"></script>
  </body>
</html>`;

export const dashboardStyles = `:root {
  color-scheme: light;
  --bg: #111713;
  --surface: #f7f1dc;
  --surface-strong: #e9d8ad;
  --ink: #151915;
  --muted: #676453;
  --line: #4d6b55;
  --teal: #168574;
  --teal-dark: #0d4d46;
  --amber: #d99124;
  --red: #b94b3e;
  --leaf: #5f9d59;
  --sky: #8fd1c4;
  --shadow: 0 22px 0 rgba(13, 20, 14, 0.72), 0 34px 70px rgba(4, 9, 7, 0.45);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 15% 12%, rgba(255, 226, 137, 0.16), transparent 27%),
    radial-gradient(circle at 86% 0%, rgba(61, 164, 139, 0.18), transparent 24%),
    linear-gradient(135deg, #101611 0%, #1f3025 44%, #121713 100%);
  color: var(--ink);
  font-family: "Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.28;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 22px 22px;
}

button {
  font: inherit;
}

.app-shell {
  position: relative;
  width: min(1280px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-height: 72px;
  margin-bottom: 16px;
  border: 2px solid #8bbf75;
  border-bottom-width: 5px;
  border-radius: 8px;
  padding: 14px 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent),
    #21352f;
  box-shadow: 0 10px 0 rgba(9, 16, 12, 0.62);
}

.topbar h1 {
  margin: 0;
  color: #fff4c8;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.42);
  font-size: 26px;
  line-height: 1.1;
  font-weight: 860;
}

.topbar p {
  margin: 7px 0 0;
  color: #bcd5c3;
  font-family: "Cascadia Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
}

.local-pill {
  border: 1px solid #9bd6be;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(13, 77, 70, 0.86);
  color: #eff9e9;
  font-size: 12px;
  font-weight: 700;
}

.local-pill.readonly {
  border-color: #f3c25f;
  background: #f3c25f;
  color: #1c2218;
}

.topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.language-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(48px, 1fr));
  overflow: hidden;
  border: 1px solid #9bd6be;
  border-radius: 999px;
  background: rgba(247, 241, 220, 0.13);
}

.language-button {
  min-height: 31px;
  border: 0;
  border-right: 1px solid rgba(155, 214, 190, 0.42);
  padding: 0 10px;
  background: transparent;
  color: #d6e7d8;
  font-size: 12px;
  font-weight: 780;
  cursor: pointer;
}

.language-button:last-child {
  border-right: 0;
}

.language-button.active {
  background: #f3c25f;
  color: #1c2218;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1.18fr) minmax(310px, 0.9fr) minmax(280px, 0.82fr);
  grid-template-areas:
    "pet adventure battle"
    "pet scan battle"
    "economy dex auto"
    "result usage maintenance";
  gap: 16px;
  align-items: start;
}

.panel,
.pet-panel {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.45), transparent 24%),
    var(--surface);
  border: 2px solid #2d4638;
  border-bottom-width: 6px;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.panel::before,
.pet-panel::before {
  content: "";
  position: absolute;
  inset: 7px;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 5px;
}

.pet-panel {
  grid-area: pet;
  min-height: 560px;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(143, 209, 196, 0.68) 0 43%, rgba(233, 216, 173, 0.78) 43% 100%),
    var(--surface);
}

.panel {
  padding: 18px;
}

.pet-stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: center;
  justify-items: center;
  margin-bottom: 20px;
}

.pet-device {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 520px);
  height: 320px;
  border: 3px solid #2c4b3a;
  border-bottom-width: 8px;
  border-radius: 8px;
  background:
    radial-gradient(ellipse at 50% 72%, rgba(255, 244, 200, 0.78) 0 22%, rgba(91, 125, 70, 0.6) 23% 33%, transparent 34%),
    linear-gradient(180deg, #94d8c9 0 47%, #7dad68 48% 56%, #dfc36e 57% 100%);
  box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.24), inset 0 -28px 0 rgba(64, 78, 42, 0.18);
}

.pet-device::before {
  content: "";
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 40px;
  height: 28px;
  border-radius: 50%;
  background: rgba(30, 43, 25, 0.22);
  filter: blur(2px);
}

.pet-sprite-mount {
  position: relative;
  display: grid;
  place-items: center;
  width: 186px;
  height: 201px;
  overflow: hidden;
  z-index: 1;
  transform: translateY(18px) scale(1.18);
  filter: drop-shadow(0 14px 0 rgba(31, 41, 28, 0.2));
}

.pet-sprite {
  display: none;
  width: 186px;
  height: 201px;
  background-repeat: no-repeat;
  background-size: calc(186px * 8) calc(201px * 9);
  image-rendering: pixelated;
}

.pet-sprite.ready {
  display: block;
}

.pet-sprite.ready + .pet-avatar-fallback {
  display: none;
}

.pet-avatar {
  position: relative;
  width: 86px;
  height: 96px;
  border-radius: 32px 32px 24px 24px;
  background: linear-gradient(180deg, #63bcb2, #167b73);
  border: 3px solid #0f4c49;
  box-shadow: inset 0 -10px 0 rgba(13, 88, 83, 0.22);
}

.pet-avatar::before,
.pet-avatar::after {
  content: "";
  position: absolute;
  bottom: -10px;
  width: 27px;
  height: 18px;
  border-radius: 6px;
  background: #0f4c49;
}

.pet-avatar::before {
  left: 12px;
}

.pet-avatar::after {
  right: 12px;
}

.pet-eye {
  position: absolute;
  top: 36px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #102220;
}

.pet-eye.left {
  left: 24px;
}

.pet-eye.right {
  right: 24px;
}

.pet-mouth {
  position: absolute;
  left: 34px;
  top: 58px;
  width: 18px;
  height: 8px;
  border-bottom: 3px solid #102220;
  border-radius: 0 0 16px 16px;
}

.pet-copy h2 {
  margin: 0;
  font-size: 46px;
  line-height: 1;
  font-weight: 900;
  text-align: center;
  color: #172015;
}

.pet-copy p {
  margin: 8px 0 0;
  color: #38513f;
  font-size: 18px;
  font-weight: 850;
  text-align: center;
}

.pet-tools {
  display: grid;
  grid-template-columns: minmax(180px, 240px) 1fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 20px;
}

.asset-status {
  min-height: 42px;
  display: flex;
  align-items: center;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}

.xp-block {
  margin-bottom: 22px;
}

.row-label,
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row-label span,
.section-label,
.metric-list span,
.token-grid span,
.result-grid span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  text-transform: uppercase;
}

.metric-list span,
.token-grid span,
.result-grid span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.help-dot {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border: 1px solid #b8aa93;
  border-radius: 999px;
  background: #fbf7ef;
  color: var(--teal-dark);
  font-size: 10px;
  font-weight: 860;
  line-height: 1;
  cursor: help;
}

.row-label strong {
  font-size: 14px;
}

.xp-track {
  height: 18px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 5px;
  border: 2px solid #2f4937;
  background: #263421;
}

.xp-fill {
  width: 0%;
  height: 100%;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.28), transparent 18%),
    repeating-linear-gradient(90deg, #18a486 0 18px, #f0be50 18px 32px);
  transition: width 180ms ease;
}

.section-label {
  margin-bottom: 10px;
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 30px;
}

.skill-chip {
  border: 2px solid #31513f;
  border-radius: 6px;
  padding: 7px 10px;
  color: #123c33;
  background: #e6f0c6;
  font-size: 12px;
  font-weight: 850;
}

.skill-chip.locked {
  color: #625f56;
  background: #d9cdaa;
  opacity: 0.82;
}

.updated-line,
.message-line {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.updated-line {
  margin-top: 18px;
}

.panel-title {
  margin-bottom: 14px;
  border-bottom: 2px solid rgba(49, 81, 63, 0.22);
  padding-bottom: 10px;
}

.panel-title h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  color: #172015;
}

.panel-title span {
  border: 1px solid rgba(49, 81, 63, 0.38);
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.36);
  color: #38513f;
  font-size: 12px;
  font-weight: 850;
}

.metric-list,
.result-grid,
.token-grid {
  display: grid;
  gap: 10px;
}

.metric-list div,
.result-grid div,
.token-grid div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  border-top: 1px solid rgba(49, 81, 63, 0.18);
  padding-top: 9px;
}

.metric-list strong,
.result-grid strong,
.token-grid strong {
  font-size: 14px;
  text-align: right;
}

.scan-panel {
  border-color: #8f6c31;
  background:
    linear-gradient(180deg, rgba(255, 246, 207, 0.6), transparent 28%),
    #f2deb0;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 2px solid #3e5743;
  border-radius: 8px;
  overflow: hidden;
  background: #e1c98e;
}

.segment {
  min-height: 38px;
  border: 0;
  border-right: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 760;
  cursor: pointer;
}

.segment:last-child {
  border-right: 0;
}

.segment.active {
  background: #21352f;
  color: #fff4c8;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 12px;
}

.button {
  min-height: 42px;
  border-radius: 7px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(31, 41, 28, 0.28);
  transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
}

.button.primary {
  border-color: #173f37;
  background: linear-gradient(180deg, #1ba58d, #11695d);
  color: #fff8dd;
}

.button.guarded {
  background: linear-gradient(180deg, #ffe6a3, #d9962b);
  border-color: #8f5b18;
  color: #3f260d;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.button.single-action {
  width: min(220px, 100%);
  margin-bottom: 12px;
}

.button:not(:disabled):hover,
.segment:hover {
  filter: brightness(0.98);
}

.button:not(:disabled):active,
.segment:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(31, 41, 28, 0.28);
}

.auto-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin: 14px 0 12px;
}

.battle-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 12px;
}

.battle-controls .button {
  grid-column: 1 / -1;
}

.maintenance-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.doctor-list {
  margin-bottom: 12px;
}

.field-label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  text-transform: uppercase;
}

.number-input,
.select-input {
  min-height: 42px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 10px;
  background: #fffdf8;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  font-weight: 760;
}

.message-line.error {
  color: var(--red);
}

.message-line.ok {
  color: var(--teal-dark);
}

.help-text,
.confirm-note,
.result-note {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.help-text.compact {
  margin: 8px 0 0;
}

.confirm-note {
  margin-top: 2px;
  border: 1px solid #e2bd85;
  border-radius: 8px;
  padding: 9px 10px;
  background: #fff7e8;
  color: #754514;
}

.result-note {
  margin: 12px 0 0;
  border-top: 1px solid #ece5d8;
  padding-top: 10px;
}

.result-grid strong {
  overflow-wrap: anywhere;
}

.usage-panel,
.result-panel {
  grid-column: span 1;
}

.economy-panel {
  grid-area: economy;
}

.battle-panel {
  grid-area: battle;
  background:
    linear-gradient(180deg, rgba(255, 244, 200, 0.48), transparent 22%),
    #f5e7bd;
}

.adventure-panel {
  grid-area: adventure;
  background:
    linear-gradient(180deg, rgba(243, 194, 95, 0.32), transparent 28%),
    #f6e8bd;
}

.scan-panel {
  grid-area: scan;
}

.dex-panel {
  grid-area: dex;
  background:
    linear-gradient(180deg, rgba(143, 209, 196, 0.28), transparent 30%),
    #e6efd1;
}

.dex-list {
  display: grid;
  gap: 8px;
}

.dex-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 10px;
  align-items: center;
  border: 2px solid rgba(49, 81, 63, 0.42);
  border-radius: 7px;
  padding: 9px 10px;
  background: rgba(255, 249, 223, 0.7);
}

.dex-entry.active {
  border-color: #168574;
  background: #fff3be;
  box-shadow: inset 0 0 0 2px rgba(22, 133, 116, 0.16);
}

.dex-entry strong {
  color: #172015;
  font-size: 13px;
}

.dex-entry span {
  border: 1px solid rgba(49, 81, 63, 0.35);
  border-radius: 999px;
  padding: 3px 7px;
  color: #38513f;
  font-size: 11px;
  font-weight: 850;
}

.dex-entry p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

.quest-list {
  display: grid;
  gap: 8px;
}

.quest-entry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px 10px;
  align-items: center;
  border: 2px solid rgba(49, 81, 63, 0.38);
  border-radius: 7px;
  padding: 9px 10px;
  background: rgba(255, 249, 223, 0.68);
}

.quest-entry.done {
  border-color: rgba(22, 133, 116, 0.68);
  background: #e8f0c8;
}

.quest-entry.locked {
  opacity: 0.58;
}

.quest-mark {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid #31513f;
  border-radius: 999px;
  color: #172015;
  font-size: 12px;
  font-weight: 900;
}

.quest-entry.done .quest-mark {
  background: #12a28d;
  color: #fffbed;
}

.quest-copy {
  min-width: 0;
}

.quest-copy strong {
  display: block;
  color: #172015;
  font-size: 13px;
}

.quest-copy span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
}

.quest-progress {
  color: #172015;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.badge-heading {
  margin-top: 14px;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.badge-chip {
  max-width: 100%;
  border: 2px solid rgba(49, 81, 63, 0.38);
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(255, 249, 223, 0.72);
  color: var(--muted);
  font-size: 11px;
  font-weight: 850;
}

.badge-chip.unlocked {
  border-color: #d99a23;
  background: #f3c25f;
  color: #1c2218;
}

.auto-panel {
  grid-area: auto;
  background:
    linear-gradient(180deg, rgba(143, 209, 196, 0.34), transparent 34%),
    #e4efd2;
}

.maintenance-panel {
  grid-area: maintenance;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent 22%),
    #ead9b8;
}

.usage-panel {
  grid-area: usage;
  background:
    linear-gradient(180deg, rgba(143, 209, 196, 0.26), transparent 34%),
    #edf2d4;
}

.result-panel {
  grid-area: result;
  background:
    linear-gradient(180deg, rgba(255, 246, 207, 0.48), transparent 26%),
    #f3e5bd;
}

.battle-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  margin: 12px 0 14px;
  border: 2px solid rgba(49, 81, 63, 0.38);
  border-radius: 8px;
  padding: 10px;
  background:
    linear-gradient(180deg, #e9d18f 0 46%, #7cad67 47% 56%, #d9bd66 57% 100%);
}

.combatant-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  border: 2px solid rgba(49, 81, 63, 0.42);
  border-radius: 7px;
  padding: 8px;
  background: rgba(255, 249, 223, 0.86);
  transform: translateX(0);
  transition: box-shadow 140ms ease, filter 140ms ease, transform 140ms ease;
}

.combatant-card.acting.pet-side {
  animation: pet-lunge 360ms ease;
}

.combatant-card.acting.opponent-side {
  animation: opponent-lunge 360ms ease;
}

.combatant-card.hit {
  animation: battle-hit 360ms ease;
  box-shadow: inset 0 0 0 2px rgba(199, 68, 47, 0.38);
}

.combatant-card.guarding {
  animation: battle-guard 420ms ease;
  box-shadow: inset 0 0 0 2px rgba(22, 133, 116, 0.45), 0 0 0 3px rgba(22, 133, 116, 0.14);
}

.combatant-card.missed {
  animation: battle-miss 360ms ease;
  filter: saturate(0.72);
}

.combatant-card > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.combatant-card strong {
  overflow: hidden;
  color: #172015;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combatant-card span {
  color: #38513f;
  font-size: 11px;
  font-weight: 850;
}

.hp-track.small {
  height: 12px;
  overflow: hidden;
  border: 2px solid #2f4937;
  border-radius: 999px;
  background: #263421;
}

.hp-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #16a084, #f0be50);
  transition: width 180ms ease;
}

.hp-fill.low {
  background: linear-gradient(90deg, #c7442f, #f0be50);
}

.arena-versus {
  color: #172015;
  font-size: 12px;
  font-weight: 950;
  text-align: center;
}

.battle-cue {
  display: inline-grid;
  min-width: 30px;
  min-height: 30px;
  place-items: center;
  border: 2px solid rgba(49, 81, 63, 0.38);
  border-radius: 999px;
  background: rgba(255, 249, 223, 0.9);
  color: #172015;
  font-size: 11px;
  font-weight: 950;
}

.battle-cue.active {
  animation: battle-cue-pop 360ms ease;
}

.move-dex-list {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
}

.move-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 8px;
  align-items: center;
  border: 2px solid rgba(49, 81, 63, 0.34);
  border-radius: 7px;
  padding: 7px 9px;
  background: rgba(255, 249, 223, 0.68);
}

.move-entry.locked {
  opacity: 0.62;
}

.move-entry strong {
  color: #172015;
  font-size: 12px;
}

.move-entry span {
  color: #38513f;
  font-size: 11px;
  font-weight: 850;
}

.move-entry p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
}

.battle-log {
  display: grid;
  gap: 7px;
  min-height: 96px;
  max-height: 190px;
  margin: 12px 0;
  padding: 10px;
  overflow: auto;
  list-style: none;
  border: 2px solid #31513f;
  border-radius: 8px;
  background: #fff9df;
}

.battle-log li {
  border-top: 1px solid rgba(49, 81, 63, 0.16);
  padding-top: 7px;
  color: #4b4a3d;
  font-size: 12px;
  line-height: 1.45;
}

.battle-log li.latest {
  color: #172015;
  font-weight: 850;
}

@keyframes pet-lunge {
  0%, 100% { transform: translateX(0); }
  45% { transform: translateX(9px) translateY(-2px); }
}

@keyframes opponent-lunge {
  0%, 100% { transform: translateX(0); }
  45% { transform: translateX(-9px) translateY(-2px); }
}

@keyframes battle-hit {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

@keyframes battle-guard {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.12); }
}

@keyframes battle-miss {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

@keyframes battle-cue-pop {
  0%, 100% { transform: scale(1); }
  45% { transform: scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .combatant-card,
  .combatant-card.acting.pet-side,
  .combatant-card.acting.opponent-side,
  .combatant-card.hit,
  .combatant-card.guarding,
  .combatant-card.missed,
  .battle-cue.active,
  .hp-fill {
    animation: none;
    transition: none;
  }
}

@media (max-width: 920px) {
  .app-shell {
    width: min(100% - 20px, 720px);
    padding-top: 14px;
  }

  .topbar {
    align-items: flex-start;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "pet"
      "adventure"
      "battle"
      "economy"
      "scan"
      "dex"
      "auto"
      "maintenance"
      "usage"
      "result";
  }

  .pet-panel {
    grid-area: pet;
  }

  .pet-stage {
    grid-template-columns: 1fr;
  }

  .pet-device {
    height: 260px;
  }

  .pet-avatar {
    transform: scale(0.76);
  }

  .pet-copy h2 {
    font-size: 34px;
  }
}

@media (max-width: 520px) {
  .topbar {
    flex-direction: column;
  }

  .topbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .pet-stage,
  .pet-tools,
  .action-row,
  .battle-controls,
  .battle-arena,
  .auto-controls,
  .maintenance-actions {
    grid-template-columns: 1fr;
  }

  .arena-versus {
    text-align: center;
  }

  .pet-device {
    height: clamp(216px, 62vw, 250px);
  }

  .pet-sprite-mount {
    transform: translateY(12px) scale(0.98);
  }
}`;

export const dashboardScript = `const translations = {
  en: {
    languageLabel: "Language",
    skills: "Skills",
    activePet: "Pet",
    noPetsFound: "No pets found",
    petReady: "{pet} ready",
    petUnavailable: "Pet package unavailable.",
    petDex: "Dex",
    petDexHelp: "Known local pet packages. The active partner is saved in the local state file.",
    dexAvailable: "available",
    dexCurrent: "current",
    dexKnown: "known",
    adventure: "Adventure",
    adventureHelp: "Follow the local trainer path: scout, train, win, and level up.",
    badges: "Badges",
    questDone: "done",
    questActive: "active",
    questLocked: "locked",
    questChoosePartner: "Choose a partner",
    questChoosePartnerDetail: "Pick one local pet package as the current companion.",
    questScoutCodex: "Scout Codex trails",
    questScoutCodexDetail: "Run a scout mission to profile local activity.",
    questClaimEnergy: "Claim Codex energy",
    questClaimEnergyDetail: "Confirm a scan that writes earned XP into the save.",
    questTrainBattle: "Enter training battle",
    questTrainBattleDetail: "Finish one local practice battle.",
    questWinBattle: "Win a match",
    questWinBattleDetail: "Defeat a practice rival in the local arena.",
    questReachLevel2: "Reach Level 2",
    questReachLevel2Detail: "Earn enough XP to unlock the first skill.",
    badgeFirstPartner: "First Partner",
    badgeFirstPartnerDetail: "A companion joined the adventure.",
    badgeCodexScout: "Codex Scout",
    badgeCodexScoutDetail: "The local profile has been scouted once.",
    badgeSparringCard: "Sparring Card",
    badgeSparringCardDetail: "A practice battle has been recorded.",
    badgeFirstWin: "First Win",
    badgeFirstWinDetail: "The first arena victory is recorded.",
    rankNewTrainer: "new trainer",
    rankFieldScout: "field scout",
    rankRookieBattler: "rookie battler",
    rankTrainer: "trainer",
    rankArenaAce: "arena ace",
    readOnlyShare: "read-only",
    readOnlyMessage: "This shared preview is read-only. Open the local dashboard to write state.",
    lockedLevel: "L{level}",
    none: "none",
    updated: "Updated",
    level: "Level",
    formula: "Formula",
    levelCurve: "Level curve",
    todayXpUsed: "Today XP used",
    weekXpUsed: "Week XP used",
    weekXpLeft: "Week XP left",
    xpRemainder: "XP remainder",
    battle: "Battle",
    battleWaiting: "training",
    battleRunning: "battling",
    battleHelp: "Local arena rules use level, unlocked skills, and spark/focus/guard affinity.",
    difficulty: "Difficulty",
    difficultyEasy: "Easy",
    difficultyNormal: "Normal",
    difficultyHard: "Hard",
    battleMove: "Move",
    battleMoveAuto: "Auto",
    battleCueReady: "VS",
    battleCueHit: "Hit",
    battleCueMiss: "Miss",
    battleCueGuard: "Guard",
    moveDex: "Move Dex",
    moveReady: "ready",
    practiceBattle: "Practice battle",
    battleOutcome: "Outcome",
    battleOpponent: "Opponent",
    battleHp: "HP",
    battleTrainingXp: "Training XP",
    battleRounds: "Rounds",
    battleRecord: "Record",
    battleStreak: "Streak",
    battleVictory: "victory",
    battleDefeat: "defeat",
    battleDraw: "draw",
    battleComplete: "Battle complete. Training XP +{xp}. Codex XP stays scan-only.",
    battleGuard: "{actor} used {move} and guarded.",
    battleMiss: "{actor} used {move} and missed.",
    battleHit: "{actor} used {move} for {damage} damage.",
    scan: "Missions",
    scanHelp: "Scout Codex activity, then commit earned XP to the save.",
    scanWindowHelp: "7/30 means the last N x 24 hours. All checks every local session.",
    all: "All",
    dryRun: "Scout",
    confirmScan: "Claim XP",
    confirmNote: "Claim XP writes the local save. First import records profile and XP ledgers, but final XP can still be 0.",
    autoScan: "Patrol",
    autoScanHelp: "Patrol mode writes local state on a timer. It uses the selected mission window when you start it.",
    intervalMinutes: "Interval minutes",
    startAutoScan: "Start patrol",
    stopAutoScan: "Stop patrol",
    lastAutoScan: "Last patrol",
    nextAutoScan: "Next patrol",
    autoLastResult: "Last result",
    autoOff: "off",
    autoIdle: "on",
    autoRunning: "running",
    autoStarting: "Starting auto scan...",
    autoStopping: "Stopping auto scan...",
    autoStarted: "Patrol started.",
    autoStopped: "Patrol stopped.",
    autoStatusFailed: "Patrol status failed.",
    autoNoResult: "no patrol yet",
    autoResultSummary: "XP +{xp}, {observations} new",
    maintenance: "Save",
    localOnly: "local only",
    maintenanceHelp: "Create a local backup beside the current state file without sending state data to the browser.",
    doctorState: "State",
    doctorCodex: "Codex home",
    doctorPets: "Pets",
    refreshDoctor: "Refresh check",
    doctorOk: "ok",
    doctorNeedsAttention: "needs attention",
    doctorMissing: "missing",
    doctorFound: "found",
    doctorPetsSummary: "{count} found",
    backupState: "Backup state",
    backupStarting: "Creating backup...",
    backupComplete: "Backup created: {file}",
    never: "never",
    lifetimeTokens: "Codex Energy",
    input: "Input",
    cached: "Cached",
    output: "Output",
    reasoning: "Reasoning",
    recentResult: "Mission Report",
    files: "Files",
    newObservations: "New observations",
    rawXp: "Raw XP",
    dailyCapped: "Daily capped",
    weeklyCapped: "Weekly capped",
    finalXp: "Final XP",
    xpGained: "XP gained",
    importMode: "Import mode",
    recentWindow: "Window",
    newlyUnlockedSkills: "New skills",
    warnings: "Warnings",
    profilePending: "profile pending",
    importComplete: "import complete",
    dryRunFirst: "dry-run first",
    previewReady: "preview ready",
    scanCompleteMode: "scan complete",
    scanningMetadata: "Scanning metadata...",
    writingLocalState: "Writing local state...",
    dryRunComplete: "Dry run complete.",
    scanComplete: "Scan complete.",
    requestFailed: "Request failed.",
    resultNone: "none",
    resultDryRun: "dry-run",
    resultScan: "scan",
    resultAutoScan: "auto",
    importModeNone: "none",
    importModeProfileOnly: "profile-only",
    recentWindowAll: "all",
    recentWindowDaysSuffix: "d",
    profileOnlyNote: "First import is profile-only: the dashboard records your token profile and cap ledgers, then starts XP from future scans.",
    warningMalformed: "malformed JSON",
    warningUnknown: "unknown token shape",
    warningUnreadable: "unreadable files",
    tooltips: {
      formula: "hard-v1 rewards uncached input lightly and output/reasoning more strongly. Cached input gives no XP.",
      levelCurve: "Milestone curve makes later levels much harder than early levels.",
      dailyCap: "Daily cap applies diminishing returns to XP earned in the current UTC day.",
      weeklyCap: "Weekly cap prevents a single heavy week from pushing too many levels.",
      xpRemainder: "Fractional XP carried forward until it becomes a whole XP.",
      cached: "Cached input is counted in lifetime stats, but hard-v1 does not award XP for it.",
      rawXp: "XP before daily, weekly, or import rules.",
      dailyCapped: "Raw XP after the daily diminishing-return cap.",
      weeklyCapped: "Daily-capped XP after the weekly hard cap.",
      finalXp: "XP after all import rules. First import uses profile-only, so this can be 0.",
      warnings: "Parser warnings are counted only as totals: malformed JSON lines, unknown token shapes, and unreadable files."
    }
  },
  zh: {
    activePet: "宠物",
    noPetsFound: "未找到宠物",
    petReady: "{pet} 已就绪",
    petUnavailable: "宠物包不可用。",
    lockedLevel: "L{level}",
    maintenance: "维护",
    localOnly: "仅本地",
    maintenanceHelp: "在当前状态文件旁创建本地备份，不把状态数据发送给浏览器。",
    doctorState: "状态",
    doctorCodex: "Codex home",
    doctorPets: "宠物包",
    refreshDoctor: "刷新检查",
    doctorOk: "正常",
    doctorNeedsAttention: "需处理",
    doctorMissing: "缺失",
    doctorFound: "已找到",
    doctorPetsSummary: "找到 {count} 个",
    battle: "战斗",
    battleWaiting: "训练",
    battleRunning: "战斗中",
    battleHelp: "使用宠物等级和已解锁技能，进行一场本地回合制训练战斗。",
    difficulty: "难度",
    difficultyEasy: "简单",
    difficultyNormal: "普通",
    difficultyHard: "困难",
    practiceBattle: "训练战斗",
    battleOutcome: "结果",
    battleOpponent: "对手",
    battleHp: "HP",
    battleRecord: "战绩",
    battleStreak: "连胜",
    battleVictory: "胜利",
    battleDefeat: "失败",
    battleDraw: "平局",
    battleComplete: "战斗完成。获得 Codex XP：{xp}。",
    battleGuard: "{actor} 使用 {move}，进入防守。",
    battleMiss: "{actor} 使用 {move}，但是落空了。",
    battleHit: "{actor} 使用 {move}，造成 {damage} 点伤害。",
    backupState: "备份状态",
    backupStarting: "正在创建备份...",
    backupComplete: "已创建备份：{file}",
    languageLabel: "语言",
    skills: "技能",
    none: "暂无",
    updated: "更新于",
    level: "等级",
    formula: "公式",
    levelCurve: "等级曲线",
    todayXpUsed: "今日已用 XP",
    weekXpUsed: "本周已用 XP",
    weekXpLeft: "本周剩余 XP",
    xpRemainder: "小数 XP",
    scan: "扫描",
    scanHelp: "建议先运行预览扫描。它只读取本地 token 元数据并计算结果，不会写入状态。",
    scanWindowHelp: "7/30 表示最近 N x 24 小时。全部会扫描本地所有 session。",
    all: "全部",
    dryRun: "预览扫描",
    confirmScan: "确认写入",
    confirmNote: "确认写入会修改本地状态文件。首次导入只记录画像和 XP ledger，最终 XP 仍可能是 0。",
    autoScan: "自动扫描",
    autoScanHelp: "自动扫描会按时间间隔写入本地状态。启动时会使用当前选择的扫描窗口。",
    intervalMinutes: "间隔分钟",
    startAutoScan: "开启自动",
    stopAutoScan: "停止自动",
    lastAutoScan: "上次自动扫描",
    nextAutoScan: "下次自动扫描",
    autoLastResult: "最近结果",
    autoOff: "关闭",
    autoIdle: "已开启",
    autoRunning: "扫描中",
    autoStarting: "正在开启自动扫描...",
    autoStopping: "正在停止自动扫描...",
    autoStarted: "自动扫描已开启。",
    autoStopped: "自动扫描已停止。",
    autoStatusFailed: "自动扫描状态获取失败。",
    autoNoResult: "尚未扫描",
    autoResultSummary: "XP +{xp}，新增 {observations}",
    never: "从未",
    lifetimeTokens: "累计 Token",
    input: "输入",
    cached: "缓存输入",
    output: "输出",
    reasoning: "推理输出",
    recentResult: "最近结果",
    files: "文件",
    newObservations: "新增记录",
    rawXp: "原始 XP",
    dailyCapped: "每日 cap 后",
    weeklyCapped: "每周 cap 后",
    finalXp: "最终 XP",
    xpGained: "获得 XP",
    importMode: "导入模式",
    recentWindow: "窗口",
    newlyUnlockedSkills: "新技能",
    warnings: "警告",
    profilePending: "等待首次导入",
    importComplete: "已完成导入",
    dryRunFirst: "先预览扫描",
    previewReady: "预览已就绪",
    scanCompleteMode: "写入完成",
    scanningMetadata: "正在扫描元数据...",
    writingLocalState: "正在写入本地状态...",
    dryRunComplete: "预览扫描完成。",
    scanComplete: "扫描写入完成。",
    requestFailed: "请求失败。",
    resultNone: "暂无",
    resultDryRun: "预览",
    resultScan: "扫描",
    resultAutoScan: "自动",
    importModeNone: "无",
    importModeProfileOnly: "profile-only",
    recentWindowAll: "全部",
    recentWindowDaysSuffix: "天",
    profileOnlyNote: "首次导入是 profile-only：Dashboard 只记录你的 token 画像和上限账本，之后的扫描才开始给 XP。",
    warningMalformed: "JSON 格式错误",
    warningUnknown: "未知 token 结构",
    warningUnreadable: "不可读文件",
    tooltips: {
      formula: "hard-v1 轻量奖励非缓存输入，更重视输出和推理输出。缓存输入不获得 XP。",
      levelCurve: "里程碑曲线会让后续等级明显更难。",
      dailyCap: "每日 cap 会对当前 UTC 日获得的 XP 做递减收益。",
      weeklyCap: "每周 cap 用来避免单个高强度周直接冲过太多等级。",
      xpRemainder: "小数 XP 会结转，累积到整数后才进入宠物 XP。",
      cached: "缓存输入会计入累计统计，但 hard-v1 不给它 XP。",
      rawXp: "每日、每周和导入规则之前的 XP。",
      dailyCapped: "经过每日递减收益后的 XP。",
      weeklyCapped: "再经过每周硬上限后的 XP。",
      finalXp: "应用所有导入规则后的 XP。首次导入是 profile-only，所以这里可能是 0。",
      warnings: "解析警告只显示汇总数量：JSON 格式错误、未知 token 结构和不可读文件。"
    }
  }
};

Object.assign(translations.zh, {
  battleTrainingXp: "\u8bad\u7ec3 XP",
  battleRounds: "\u56de\u5408",
  battleMove: "\u62db\u5f0f",
  battleMoveAuto: "\u81ea\u52a8",
  battleCueReady: "VS",
  battleCueHit: "\u547d\u4e2d",
  battleCueMiss: "\u843d\u7a7a",
  battleCueGuard: "\u9632\u5b88",
  moveDex: "\u62db\u5f0f\u56fe\u9274",
  moveReady: "\u5df2\u4f1a",
  petDex: "\u56fe\u9274",
  petDexHelp: "\u5df2\u53d1\u73b0\u7684\u672c\u5730\u5ba0\u7269\u5305\u3002\u5f53\u524d\u4f19\u4f34\u4f1a\u5199\u5165\u672c\u5730\u5b58\u6863\u3002",
  dexAvailable: "\u53ef\u7528",
  dexCurrent: "\u5f53\u524d",
  dexKnown: "\u5df2\u53d1\u73b0",
  adventure: "\u5192\u9669",
  adventureHelp: "\u6cbf\u7740\u672c\u5730\u8bad\u7ec3\u5e08\u8def\u7ebf\u63a8\u8fdb\uff1a\u4fa6\u5bdf\u3001\u8bad\u7ec3\u3001\u83b7\u80dc\u3001\u5347\u7ea7\u3002",
  badges: "\u5fbd\u7ae0",
  questDone: "\u5df2\u5b8c\u6210",
  questActive: "\u8fdb\u884c\u4e2d",
  questLocked: "\u672a\u89e3\u9501",
  questChoosePartner: "\u9009\u62e9\u4f19\u4f34",
  questChoosePartnerDetail: "\u4ece\u672c\u5730\u5ba0\u7269\u5305\u91cc\u9009\u62e9\u5f53\u524d\u4f19\u4f34\u3002",
  questScoutCodex: "\u4fa6\u5bdf Codex \u8db3\u8ff9",
  questScoutCodexDetail: "\u6267\u884c\u4e00\u6b21\u4fa6\u5bdf\u4efb\u52a1\uff0c\u5efa\u7acb\u672c\u5730\u6d3b\u52a8\u6863\u6848\u3002",
  questClaimEnergy: "\u9886\u53d6 Codex \u80fd\u91cf",
  questClaimEnergyDetail: "\u786e\u8ba4\u4e00\u6b21\u626b\u63cf\uff0c\u628a\u83b7\u5f97\u7684 XP \u5199\u5165\u5b58\u6863\u3002",
  questTrainBattle: "\u8fdb\u5165\u8bad\u7ec3\u6218\u6597",
  questTrainBattleDetail: "\u5b8c\u6210\u4e00\u573a\u672c\u5730\u8bad\u7ec3\u6218\u6597\u3002",
  questWinBattle: "\u8d62\u4e0b\u4e00\u573a",
  questWinBattleDetail: "\u5728\u672c\u5730\u7ade\u6280\u573a\u51fb\u8d25\u7ec3\u4e60\u5bf9\u624b\u3002",
  questReachLevel2: "\u8fbe\u5230 2 \u7ea7",
  questReachLevel2Detail: "\u83b7\u5f97\u8db3\u591f XP\uff0c\u89e3\u9501\u7b2c\u4e00\u4e2a\u6280\u80fd\u3002",
  badgeFirstPartner: "\u521d\u59cb\u4f19\u4f34",
  badgeFirstPartnerDetail: "\u4e00\u4f4d\u4f19\u4f34\u52a0\u5165\u4e86\u5192\u9669\u3002",
  badgeCodexScout: "Codex \u4fa6\u5bdf\u5458",
  badgeCodexScoutDetail: "\u672c\u5730\u6d3b\u52a8\u6863\u6848\u5df2\u5b8c\u6210\u4e00\u6b21\u4fa6\u5bdf\u3002",
  badgeSparringCard: "\u8bad\u7ec3\u5361",
  badgeSparringCardDetail: "\u5df2\u7ecf\u8bb0\u5f55\u8fc7\u4e00\u573a\u8bad\u7ec3\u6218\u6597\u3002",
  badgeFirstWin: "\u9996\u80dc\u5fbd\u7ae0",
  badgeFirstWinDetail: "\u5df2\u7ecf\u8bb0\u5f55\u7b2c\u4e00\u6b21\u7ade\u6280\u573a\u80dc\u5229\u3002",
  rankNewTrainer: "\u65b0\u624b\u8bad\u7ec3\u5e08",
  rankFieldScout: "\u91ce\u5916\u4fa6\u5bdf\u5458",
  rankRookieBattler: "\u89c1\u4e60\u6218\u6597\u5458",
  rankTrainer: "\u8bad\u7ec3\u5e08",
  rankArenaAce: "\u7ade\u6280\u573a\u9ad8\u624b",
  readOnlyShare: "\u53ea\u8bfb\u9884\u89c8",
  readOnlyMessage: "\u8fd9\u662f\u53ea\u8bfb\u8fdc\u7a0b\u9884\u89c8\u3002\u9700\u8981\u5199\u5165\u5b58\u6863\u65f6\u8bf7\u6253\u5f00\u672c\u5730 Dashboard\u3002",
  battleComplete: "\u6218\u6597\u5b8c\u6210\u3002\u8bad\u7ec3 XP +{xp}\u3002Codex XP \u4ecd\u7136\u53ea\u80fd\u901a\u8fc7\u4efb\u52a1\u9886\u53d6\u3002",
  battleHelp: "本地竞技场按等级、已解锁技能和 spark/focus/guard 属性结算。",
  scan: "任务",
  scanHelp: "先侦察 Codex 活动，再把获得的 XP 写入存档。",
  scanWindowHelp: "7/30 表示最近 N x 24 小时。全部会检查本地所有 session。",
  dryRun: "侦察",
  confirmScan: "领取 XP",
  confirmNote: "领取 XP 会写入本地存档。首次导入只记录画像和 XP ledger，最终 XP 仍可能是 0。",
  autoScan: "巡逻",
  autoScanHelp: "巡逻会按时间间隔写入本地状态。启动时会使用当前选择的任务窗口。",
  startAutoScan: "开始巡逻",
  stopAutoScan: "停止巡逻",
  lastAutoScan: "上次巡逻",
  nextAutoScan: "下次巡逻",
  autoStarted: "巡逻已开始。",
  autoStopped: "巡逻已停止。",
  autoStatusFailed: "巡逻状态获取失败。",
  autoNoResult: "尚未巡逻",
  autoResultSummary: "XP +{xp}，新增 {observations}",
  maintenance: "存档",
  lifetimeTokens: "Codex 能量",
  recentResult: "任务报告",
  resultDryRun: "侦察",
  resultScan: "领取",
  resultAutoScan: "巡逻",
  dryRunFirst: "先侦察",
  previewReady: "侦察完成",
  scanCompleteMode: "领取完成",
  scanningMetadata: "正在侦察活动...",
  writingLocalState: "正在写入存档...",
  dryRunComplete: "侦察完成。",
  scanComplete: "XP 已领取。"
});

const state = {
  config: null,
  selectedDays: 30,
  lastDryRun: null,
  lastStatus: null,
  lastSummary: null,
  autoStatus: null,
  doctorReport: null,
  battleResult: null,
  battlePlaybackId: 0,
  autoPollTimer: null,
  manualScanBusy: false,
  petCatalog: null,
  selectedPetId: null,
  petManifest: null,
  petMotion: "idle",
  petFrameIndex: 0,
  petAnimationTimer: null,
  petMotionReturnTimer: null,
  lastAutoError: null,
  prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  scanModeKey: "dryRunFirst",
  messageKey: null,
  messageKind: "",
  autoMessageKey: null,
  autoMessageKind: "",
  maintenanceMessageKey: null,
  maintenanceMessageKind: "",
  maintenanceMessageArgs: null,
  language: detectLanguage()
};

const els = {
  stateFileLabel: document.getElementById("stateFileLabel"),
  shareModePill: document.getElementById("shareModePill"),
  petSprite: document.getElementById("petSprite"),
  petName: document.getElementById("petName"),
  petLevel: document.getElementById("petLevel"),
  petSelect: document.getElementById("petSelect"),
  petAssetStatus: document.getElementById("petAssetStatus"),
  petDexList: document.getElementById("petDexList"),
  adventureRank: document.getElementById("adventureRank"),
  questList: document.getElementById("questList"),
  badgeList: document.getElementById("badgeList"),
  xpText: document.getElementById("xpText"),
  xpFill: document.getElementById("xpFill"),
  skillsList: document.getElementById("skillsList"),
  updatedAt: document.getElementById("updatedAt"),
  importStatus: document.getElementById("importStatus"),
  formulaName: document.getElementById("formulaName"),
  levelCurveName: document.getElementById("levelCurveName"),
  todayXpUsed: document.getElementById("todayXpUsed"),
  weekXpUsed: document.getElementById("weekXpUsed"),
  weekXpRemaining: document.getElementById("weekXpRemaining"),
  xpRemainder: document.getElementById("xpRemainder"),
  battleMode: document.getElementById("battleMode"),
  battleDifficulty: document.getElementById("battleDifficulty"),
  battleMove: document.getElementById("battleMove"),
  practiceBattleButton: document.getElementById("practiceBattleButton"),
  battlePetCard: document.getElementById("battlePetCard"),
  battlePetName: document.getElementById("battlePetName"),
  battlePetLevel: document.getElementById("battlePetLevel"),
  battlePetHpFill: document.getElementById("battlePetHpFill"),
  battlePetHpText: document.getElementById("battlePetHpText"),
  battleCue: document.getElementById("battleCue"),
  battleOpponentCard: document.getElementById("battleOpponentCard"),
  battleOpponentName: document.getElementById("battleOpponentName"),
  battleOpponentLevel: document.getElementById("battleOpponentLevel"),
  battleOpponentHpFill: document.getElementById("battleOpponentHpFill"),
  battleOpponentHpText: document.getElementById("battleOpponentHpText"),
  moveDexList: document.getElementById("moveDexList"),
  battleOutcome: document.getElementById("battleOutcome"),
  battleOpponent: document.getElementById("battleOpponent"),
  battleHp: document.getElementById("battleHp"),
  battleTrainingXp: document.getElementById("battleTrainingXp"),
  battleRounds: document.getElementById("battleRounds"),
  battleRecord: document.getElementById("battleRecord"),
  battleStreak: document.getElementById("battleStreak"),
  battleLog: document.getElementById("battleLog"),
  battleMessageLine: document.getElementById("battleMessageLine"),
  totalTokens: document.getElementById("totalTokens"),
  inputTokens: document.getElementById("inputTokens"),
  cachedTokens: document.getElementById("cachedTokens"),
  outputTokens: document.getElementById("outputTokens"),
  reasoningTokens: document.getElementById("reasoningTokens"),
  dryRunButton: document.getElementById("dryRunButton"),
  confirmButton: document.getElementById("confirmButton"),
  confirmNote: document.getElementById("confirmNote"),
  messageLine: document.getElementById("messageLine"),
  scanMode: document.getElementById("scanMode"),
  autoScanMode: document.getElementById("autoScanMode"),
  autoInterval: document.getElementById("autoInterval"),
  autoStartButton: document.getElementById("autoStartButton"),
  autoStopButton: document.getElementById("autoStopButton"),
  autoLastFinished: document.getElementById("autoLastFinished"),
  autoNextRun: document.getElementById("autoNextRun"),
  autoLastResult: document.getElementById("autoLastResult"),
  autoMessageLine: document.getElementById("autoMessageLine"),
  doctorState: document.getElementById("doctorState"),
  doctorCodex: document.getElementById("doctorCodex"),
  doctorPets: document.getElementById("doctorPets"),
  refreshDoctorButton: document.getElementById("refreshDoctorButton"),
  backupStateButton: document.getElementById("backupStateButton"),
  maintenanceMessageLine: document.getElementById("maintenanceMessageLine"),
  resultMode: document.getElementById("resultMode"),
  filesScanned: document.getElementById("filesScanned"),
  newObservations: document.getElementById("newObservations"),
  rawXp: document.getElementById("rawXp"),
  dailyCappedXp: document.getElementById("dailyCappedXp"),
  weeklyCappedXp: document.getElementById("weeklyCappedXp"),
  finalXp: document.getElementById("finalXp"),
  gainedXp: document.getElementById("gainedXp"),
  importMode: document.getElementById("importMode"),
  recentWindow: document.getElementById("recentWindow"),
  newlyUnlockedSkills: document.getElementById("newlyUnlockedSkills"),
  warnings: document.getElementById("warnings"),
  resultNote: document.getElementById("resultNote"),
  langZh: document.getElementById("langZh"),
  langEn: document.getElementById("langEn")
};

const petRows = {
  idle: { row: 0, frames: 6, durations: [280, 110, 110, 140, 140, 320] },
  "running-right": { row: 1, frames: 8, durations: [90, 90, 90, 90, 90, 90, 90, 90] },
  "running-left": { row: 2, frames: 8, durations: [90, 90, 90, 90, 90, 90, 90, 90] },
  waving: { row: 3, frames: 4, durations: [140, 140, 140, 180] },
  jumping: { row: 4, frames: 5, durations: [130, 120, 150, 120, 170] },
  failed: { row: 5, frames: 8, durations: [130, 130, 140, 140, 160, 140, 130, 180] },
  waiting: { row: 6, frames: 6, durations: [260, 180, 180, 260, 180, 220] },
  running: { row: 7, frames: 6, durations: [120, 110, 120, 110, 120, 130] },
  review: { row: 8, frames: 6, durations: [170, 170, 220, 170, 170, 240] }
};

async function init() {
  bindControls();
  applyTranslations();
  state.config = await fetchJson("/api/config");
  renderConfig(state.config);
  const statusPayload = await fetchJson("/api/status");
  renderStatus(statusPayload.status);
  await loadPetCatalog();
  await loadDoctorReport();
  const autoPayload = await fetchJson("/api/auto-scan");
  renderAutoScan(autoPayload.autoScan);
  startAutoScanPolling();
}

function bindControls() {
  for (const button of document.querySelectorAll(".segment")) {
    button.addEventListener("click", () => {
      for (const item of document.querySelectorAll(".segment")) {
        item.classList.remove("active");
      }
      button.classList.add("active");
      state.selectedDays = button.dataset.days === "all" ? undefined : Number(button.dataset.days);
      state.lastDryRun = null;
      els.confirmButton.disabled = true;
      els.confirmNote.hidden = true;
      state.scanModeKey = "dryRunFirst";
      renderScanMode();
      updatePetMotionForIdle();
    });
  }

  for (const button of document.querySelectorAll(".language-button")) {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  }

  els.petSelect.addEventListener("change", () => {
    const petId = els.petSelect.value;
    saveSelectedPetId(petId);
    void selectActivePet(petId);
  });

  els.dryRunButton.addEventListener("click", () => runScan(true));
  els.confirmButton.addEventListener("click", () => runScan(false));
  els.practiceBattleButton.addEventListener("click", () => runPracticeBattle());
  els.autoStartButton.addEventListener("click", () => startAutoScan());
  els.autoStopButton.addEventListener("click", () => stopAutoScan());
  els.refreshDoctorButton.addEventListener("click", () => loadDoctorReport());
  els.backupStateButton.addEventListener("click", () => backupState());
}

async function runScan(dryRun) {
  if (isReadOnlyShare()) {
    setTranslatedMessage("readOnlyMessage", "");
    return;
  }
  state.manualScanBusy = true;
  setBusy(true);
  setTranslatedMessage(dryRun ? "scanningMetadata" : "writingLocalState", "");
  setPetMotion(dryRun ? "review" : "running");
  try {
    const body = dryRun
      ? { recentDays: state.selectedDays }
      : { recentDays: state.selectedDays, confirm: true };
    const summary = await fetchJson(dryRun ? "/api/scan/dry-run" : "/api/scan/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify(body)
    });
    renderScanSummary(summary);
    if (dryRun) {
      state.lastDryRun = summary;
      els.confirmButton.disabled = false;
      els.confirmNote.hidden = false;
      state.scanModeKey = "previewReady";
      renderScanMode();
      setTranslatedMessage("dryRunComplete", "ok");
      setPetMotion("review");
    } else {
      renderStatus(summary.resultingStatus);
      state.lastDryRun = null;
      els.confirmButton.disabled = true;
      els.confirmNote.hidden = true;
      state.scanModeKey = "scanCompleteMode";
      renderScanMode();
      setTranslatedMessage("scanComplete", "ok");
      celebratePet(summary);
    }
  } catch (error) {
    setMessage(error.message, "error");
    showPetFailure();
  } finally {
    state.manualScanBusy = false;
    setBusy(false);
  }
}

async function startAutoScan() {
  if (isReadOnlyShare()) {
    setTranslatedAutoMessage("readOnlyMessage", "");
    return;
  }
  setAutoBusy(true);
  setTranslatedAutoMessage("autoStarting", "");
  setPetMotion("running");
  try {
    const intervalMinutes = Number(els.autoInterval.value);
    const payload = await fetchJson("/api/auto-scan/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify({
        intervalMinutes,
        recentDays: state.selectedDays,
        runImmediately: true
      })
    });
    renderAutoScan(payload.autoScan);
    state.lastDryRun = null;
    els.confirmNote.hidden = true;
    setTranslatedAutoMessage("autoStarted", "ok");
  } catch (error) {
    setAutoMessage(error.message, "error");
    showPetFailure();
  } finally {
    setAutoBusy(false);
  }
}

async function runPracticeBattle() {
  if (isReadOnlyShare()) {
    setBattleMessage(t("readOnlyMessage"), "");
    return;
  }
  setBattleBusy(true);
  els.battleMode.textContent = t("battleRunning");
  setPetMotion("running");
  try {
    const payload = await fetchJson("/api/battle/practice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify({
        difficulty: els.battleDifficulty.value,
        moveId: els.battleMove.value || undefined
      })
    });
    await playBattleResult(payload.battle);
    if (payload.resultingStatus) {
      renderStatus(payload.resultingStatus);
      state.lastDryRun = null;
      els.confirmButton.disabled = true;
      els.confirmNote.hidden = true;
      state.scanModeKey = "dryRunFirst";
      renderScanMode();
    }
    setBattleMessage(formatTranslatedMessage("battleComplete", {
      xp: formatNumber(payload.battle.rewards.petXpAwarded)
    }), "ok");
    if (payload.battle.outcome === "victory") {
      playTemporaryPetMotion("jumping", 1400);
    } else if (payload.battle.outcome === "defeat") {
      showPetFailure();
    } else {
      playTemporaryPetMotion("waving", 1200);
    }
  } catch (error) {
    state.battlePlaybackId += 1;
    clearBattleCardEffects();
    restoreBattleMode();
    setBattleMessage(error.message, "error");
    showPetFailure();
  } finally {
    setBattleBusy(false);
  }
}

async function stopAutoScan() {
  if (isReadOnlyShare()) {
    setTranslatedAutoMessage("readOnlyMessage", "");
    return;
  }
  setAutoBusy(true);
  setTranslatedAutoMessage("autoStopping", "");
  try {
    const payload = await fetchJson("/api/auto-scan/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify({})
    });
    renderAutoScan(payload.autoScan);
    setTranslatedAutoMessage("autoStopped", "ok");
    updatePetMotionForIdle();
  } catch (error) {
    setAutoMessage(error.message, "error");
    showPetFailure();
  } finally {
    setAutoBusy(false);
  }
}

async function backupState() {
  if (isReadOnlyShare()) {
    setTranslatedMaintenanceMessage("readOnlyMessage", "", null);
    return;
  }
  setMaintenanceBusy(true);
  setTranslatedMaintenanceMessage("backupStarting", "", null);
  try {
    const payload = await fetchJson("/api/state/backup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify({})
    });
    setTranslatedMaintenanceMessage("backupComplete", "ok", {
      file: payload.backup.backupFileLabel
    });
  } catch (error) {
    setMaintenanceMessage(error.message, "error");
    showPetFailure();
  } finally {
    setMaintenanceBusy(false);
  }
}

async function refreshAutoScanStatus() {
  try {
    const payload = await fetchJson("/api/auto-scan");
    renderAutoScan(payload.autoScan);
  } catch {
    setTranslatedAutoMessage("autoStatusFailed", "error");
  }
}

async function loadDoctorReport() {
  els.refreshDoctorButton.disabled = true;
  try {
    const payload = await fetchJson("/api/doctor");
    renderDoctorReport(payload.doctor);
  } catch (error) {
    setMaintenanceMessage(error.message, "error");
  } finally {
    els.refreshDoctorButton.disabled = false;
  }
}

function startAutoScanPolling() {
  if (state.autoPollTimer) {
    clearInterval(state.autoPollTimer);
  }
  state.autoPollTimer = setInterval(refreshAutoScanStatus, 5000);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || t("requestFailed"));
  }
  return payload;
}

async function loadPetCatalog() {
  try {
    const catalog = await fetchJson("/api/pets");
    state.petCatalog = catalog;
    renderPetCatalog(catalog);
    await loadPetSprite(resolveSelectedPetId(catalog));
  } catch {
    state.petCatalog = { defaultPetId: "pathy", pets: [] };
    renderPetCatalog(state.petCatalog);
    await loadPetSprite();
  }
}

function renderPetCatalog(catalog) {
  const selectedPetId = resolveSelectedPetId(catalog);
  els.petSelect.replaceChildren();
  if (!catalog.pets || catalog.pets.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("noPetsFound");
    els.petSelect.append(option);
    els.petSelect.disabled = true;
    renderPetDex(catalog);
    return;
  }

  for (const pet of catalog.pets) {
    const option = document.createElement("option");
    option.value = pet.id;
    option.textContent = pet.displayName;
    els.petSelect.append(option);
  }

  els.petSelect.disabled = false;
  els.petSelect.value = selectedPetId;
  renderPetDex(catalog);
}

function renderPetDex(catalog) {
  els.petDexList.replaceChildren();
  const pets = catalog?.pets ?? [];
  if (pets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "help-text compact";
    empty.textContent = t("noPetsFound");
    els.petDexList.append(empty);
    return;
  }

  const activePetId = state.lastStatus?.pet?.activePetId ?? state.selectedPetId ?? resolveSelectedPetId(catalog);
  for (const pet of pets) {
    const entry = document.createElement("div");
    entry.className = "dex-entry" + (pet.id === activePetId ? " active" : "");
    const name = document.createElement("strong");
    name.textContent = pet.displayName;
    const badge = document.createElement("span");
    badge.textContent = pet.id === activePetId ? t("dexCurrent") : t("dexKnown");
    const description = document.createElement("p");
    description.textContent = pet.description;
    entry.append(name, badge, description);
    els.petDexList.append(entry);
  }
}

async function selectActivePet(petId) {
  els.petSelect.disabled = true;
  try {
    await loadPetSprite(petId);

    if (state.config?.readOnlyShare) {
      return;
    }

    const payload = await fetchJson("/api/pet/select", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Codex-Pet-Dashboard-Token": state.config.writeToken
      },
      body: JSON.stringify({ petId })
    });
    if (payload.resultingStatus) {
      renderStatus(payload.resultingStatus);
    }
    if (payload.selectedPet) {
      els.petAssetStatus.textContent = t("petReady").replace("{pet}", payload.selectedPet.displayName);
    }
    playTemporaryPetMotion("waving", 1200);
  } catch (error) {
    els.petAssetStatus.textContent = error.message;
    const fallbackPetId = resolveSelectedPetId(state.petCatalog);
    els.petSelect.value = fallbackPetId;
    await loadPetSprite(fallbackPetId);
  } finally {
    els.petSelect.disabled = false;
  }
}

function resolveSelectedPetId(catalog) {
  const pets = catalog?.pets ?? [];
  const activePetId = state.lastStatus?.pet?.activePetId;
  if (activePetId && pets.some((pet) => pet.id === activePetId)) {
    return activePetId;
  }
  const storedPetId = readSelectedPetId();
  if (storedPetId && pets.some((pet) => pet.id === storedPetId)) {
    return storedPetId;
  }
  if (catalog?.defaultPetId && pets.some((pet) => pet.id === catalog.defaultPetId)) {
    return catalog.defaultPetId;
  }
  return pets[0]?.id;
}

function readSelectedPetId() {
  try {
    return localStorage.getItem("codexPetBattlePetId");
  } catch {
    return null;
  }
}

function saveSelectedPetId(petId) {
  try {
    localStorage.setItem("codexPetBattlePetId", petId);
  } catch {
    // The server-side active pet remains the source of truth.
  }
}

async function loadPetSprite(petId) {
  if (state.petAnimationTimer) {
    clearTimeout(state.petAnimationTimer);
    state.petAnimationTimer = null;
  }
  if (state.petMotionReturnTimer) {
    clearTimeout(state.petMotionReturnTimer);
    state.petMotionReturnTimer = null;
  }

  try {
    const manifest = await fetchJson(petId ? "/pet/" + encodeURIComponent(petId) + "/pet.json" : "/pet/pet.json");
    await preloadImage(manifest.spritesheetUrl);
    state.selectedPetId = manifest.id;
    state.petManifest = manifest;
    els.petSprite.style.backgroundImage = "url('" + manifest.spritesheetUrl + "')";
    els.petSprite.classList.add("ready");
    els.petAssetStatus.textContent = t("petReady").replace("{pet}", manifest.displayName);
    if (state.lastStatus) {
      renderStatus(state.lastStatus);
    }
    setPetMotion("idle");
  } catch {
    state.selectedPetId = null;
    state.petManifest = null;
    els.petSprite.style.backgroundImage = "";
    els.petSprite.classList.remove("ready");
    els.petAssetStatus.textContent = t("petUnavailable");
  }
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Pet image failed to load."));
    image.src = src;
  });
}

function setPetMotion(motion, restart = false) {
  if (!state.petManifest || !petRows[motion]) {
    return;
  }
  if (!restart && state.petMotion === motion && (state.petAnimationTimer || state.prefersReducedMotion)) {
    return;
  }
  if (state.petAnimationTimer) {
    clearTimeout(state.petAnimationTimer);
    state.petAnimationTimer = null;
  }
  if (state.petMotionReturnTimer) {
    clearTimeout(state.petMotionReturnTimer);
    state.petMotionReturnTimer = null;
  }
  state.petMotion = motion;
  state.petFrameIndex = 0;
  renderPetFrame();
  schedulePetFrame();
}

function playTemporaryPetMotion(motion, durationMs) {
  if (!state.petManifest) {
    return;
  }
  setPetMotion(motion, true);
  state.petMotionReturnTimer = setTimeout(() => {
    state.petMotionReturnTimer = null;
    updatePetMotionForIdle();
  }, durationMs);
}

function updatePetMotionForIdle() {
  if (!state.petManifest) {
    return;
  }
  if (state.manualScanBusy) {
    return;
  }
  if (state.petMotionReturnTimer) {
    return;
  }
  if (state.lastDryRun !== null) {
    setPetMotion("review");
    return;
  }
  if (state.autoStatus?.running) {
    setPetMotion("running");
    return;
  }
  if (state.autoStatus?.enabled) {
    setPetMotion("waiting");
    return;
  }
  setPetMotion("idle");
}

function celebratePet(summary) {
  if (summary.newlyUnlockedSkills.length > 0) {
    playTemporaryPetMotion("jumping", 1500);
    return;
  }
  if (summary.gainedXp > 0) {
    playTemporaryPetMotion("waving", 1300);
    return;
  }
  updatePetMotionForIdle();
}

function showPetFailure() {
  playTemporaryPetMotion("failed", 1800);
}

function renderPetFrame() {
  const row = petRows[state.petMotion] ?? petRows.idle;
  const width = els.petSprite.clientWidth || 124;
  const height = els.petSprite.clientHeight || 134;
  const frame = state.prefersReducedMotion ? 0 : state.petFrameIndex % row.frames;
  els.petSprite.style.backgroundPosition = "-" + (frame * width) + "px -" + (row.row * height) + "px";
}

function schedulePetFrame() {
  if (state.prefersReducedMotion) {
    return;
  }
  const row = petRows[state.petMotion] ?? petRows.idle;
  const duration = row.durations[state.petFrameIndex % row.durations.length] ?? 140;
  state.petAnimationTimer = setTimeout(() => {
    state.petFrameIndex = (state.petFrameIndex + 1) % row.frames;
    renderPetFrame();
    schedulePetFrame();
  }, duration);
}

function renderConfig(config) {
  els.stateFileLabel.textContent = config.stateFileLabel;
  els.shareModePill.textContent = config.readOnlyShare ? t("readOnlyShare") : "127.0.0.1";
  els.shareModePill.classList.toggle("readonly", config.readOnlyShare === true);
  if (config.readOnlyShare) {
    setTranslatedMessage("readOnlyMessage", "");
    setTranslatedAutoMessage("readOnlyMessage", "");
    setBattleMessage(t("readOnlyMessage"), "");
    setTranslatedMaintenanceMessage("readOnlyMessage", "", null);
    setBusy(false);
    setAutoBusy(false);
    setBattleBusy(false);
    setMaintenanceBusy(false);
  }
}

function renderStatus(status) {
  state.lastStatus = status;
  if (state.petCatalog) {
    renderPetCatalog(state.petCatalog);
  }
  els.petName.textContent = state.petManifest?.displayName ?? status.pet.name;
  els.petLevel.textContent = t("level") + " " + status.pet.level;
  els.xpText.textContent = status.pet.xp + "/" + status.pet.xpToNextLevel;
  const percent = status.pet.xpToNextLevel === 0 ? 0 : Math.min(100, Math.round((status.pet.xp / status.pet.xpToNextLevel) * 100));
  els.xpFill.style.width = percent + "%";
  els.skillsList.replaceChildren();
  const skillDetails = status.pet.skillDetails ?? status.pet.skills.map((skill) => ({
    id: skill,
    displayName: skill,
    unlockLevel: 0,
    unlocked: true,
    effect: "",
    description: ""
  }));
  if (skillDetails.length === 0) {
    const empty = document.createElement("span");
    empty.className = "skill-chip locked";
    empty.textContent = t("none");
    els.skillsList.append(empty);
  }
  for (const skill of skillDetails) {
    const chip = document.createElement("span");
    chip.className = "skill-chip" + (skill.unlocked ? "" : " locked");
    chip.textContent = skill.unlocked
      ? skill.displayName
      : skill.displayName + " " + t("lockedLevel").replace("{level}", String(skill.unlockLevel));
    chip.title = skill.effect || skill.description;
    els.skillsList.append(chip);
  }
  els.updatedAt.textContent = t("updated") + ": " + status.updatedAt;
  els.importStatus.textContent = status.economy.initialImportCompleted ? t("importComplete") : t("profilePending");
  els.formulaName.textContent = status.economy.formula;
  els.levelCurveName.textContent = status.economy.levelCurve;
  els.todayXpUsed.textContent = formatNumber(status.economy.todayXpUsed);
  els.weekXpUsed.textContent = formatNumber(status.economy.weekXpUsed);
  els.weekXpRemaining.textContent = formatNumber(status.economy.weekXpRemaining);
  els.xpRemainder.textContent = formatNumber(status.economy.xpRemainder);
  els.totalTokens.textContent = formatNumber(status.usage.lifetimeTotalTokens);
  els.inputTokens.textContent = formatNumber(status.usage.lifetimeInputTokens);
  els.cachedTokens.textContent = formatNumber(status.usage.lifetimeCachedInputTokens);
  els.outputTokens.textContent = formatNumber(status.usage.lifetimeOutputTokens);
  els.reasoningTokens.textContent = formatNumber(status.usage.lifetimeReasoningOutputTokens);
  renderBattleMoves(status.battle.availableMoves ?? []);
  renderBattleStats(status.battle);
  renderBattleArena(status, state.battleResult);
  renderMoveDex(status.battle.moveDetails ?? []);
  renderAdventure(status.adventure);
}

function renderBattleMoves(moves) {
  const selectedMoveId = els.battleMove.value;
  els.battleMove.replaceChildren();
  const autoOption = document.createElement("option");
  autoOption.value = "";
  autoOption.textContent = t("battleMoveAuto");
  els.battleMove.append(autoOption);
  for (const move of moves) {
    const option = document.createElement("option");
    option.value = move.id;
    const detail = move.category === "guard"
      ? move.affinity + " guard"
      : move.affinity + " " + formatNumber(move.power);
    option.textContent = move.displayName + " (" + detail + ")";
    els.battleMove.append(option);
  }
  if ([...els.battleMove.options].some((option) => option.value === selectedMoveId)) {
    els.battleMove.value = selectedMoveId;
  }
}

function renderMoveDex(moves) {
  els.moveDexList.replaceChildren();
  for (const move of moves) {
    const entry = document.createElement("div");
    entry.className = "move-entry" + (move.unlocked ? "" : " locked");
    const name = document.createElement("strong");
    name.textContent = move.displayName;
    const stateText = document.createElement("span");
    stateText.textContent = move.unlocked
      ? t("moveReady")
      : t("lockedLevel").replace("{level}", String(move.unlockLevel ?? "?"));
    const detail = document.createElement("p");
    detail.textContent = formatMoveDetail(move);
    entry.append(name, stateText, detail);
    els.moveDexList.append(entry);
  }
}

function renderBattleArena(status, battle) {
  renderBattleCombatants(
    battle?.pet ?? { name: status.pet.name, level: status.pet.level },
    battle?.opponent ?? { name: "Practice Rival", level: Math.max(1, status.pet.level) }
  );
}

function renderBattleCombatants(pet, opponent) {
  els.battlePetName.textContent = pet.name;
  els.battlePetLevel.textContent = "L" + pet.level;
  updateHpMeter(
    els.battlePetHpFill,
    els.battlePetHpText,
    pet.hp,
    pet.maxHp
  );
  els.battleOpponentName.textContent = opponent.name;
  els.battleOpponentLevel.textContent = "L" + opponent.level;
  updateHpMeter(
    els.battleOpponentHpFill,
    els.battleOpponentHpText,
    opponent.hp,
    opponent.maxHp
  );
}

function updateHpMeter(fill, text, hp, maxHp) {
  if (typeof hp !== "number" || typeof maxHp !== "number" || maxHp <= 0) {
    fill.style.width = "0%";
    fill.classList.remove("low");
    text.textContent = "--";
    return;
  }

  const percent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
  fill.style.width = percent + "%";
  fill.classList.toggle("low", percent <= 25);
  text.textContent = hp + "/" + maxHp;
}

function formatMoveDetail(move) {
  const power = move.category === "guard"
    ? "guard"
    : formatNumber(move.power);
  return move.affinity + " / " + power + " / " + Math.round(move.accuracy * 100) + "%";
}

function renderAdventure(adventure) {
  if (!adventure) {
    return;
  }

  els.adventureRank.textContent = t(adventure.rankKey);
  els.questList.replaceChildren();
  for (const quest of adventure.quests ?? []) {
    const item = document.createElement("div");
    item.className = "quest-entry " + quest.state;
    const mark = document.createElement("span");
    mark.className = "quest-mark";
    mark.textContent = quest.state === "done" ? "OK" : quest.state === "locked" ? "-" : "!";
    mark.title = t("quest" + capitalize(quest.state));

    const copy = document.createElement("div");
    copy.className = "quest-copy";
    const title = document.createElement("strong");
    title.textContent = t(quest.titleKey);
    const detail = document.createElement("span");
    detail.textContent = t(quest.detailKey);
    copy.append(title, detail);

    const progress = document.createElement("span");
    progress.className = "quest-progress";
    progress.textContent = quest.progressLabel;
    item.append(mark, copy, progress);
    els.questList.append(item);
  }

  els.badgeList.replaceChildren();
  for (const badge of adventure.badges ?? []) {
    const chip = document.createElement("span");
    chip.className = "badge-chip" + (badge.unlocked ? " unlocked" : "");
    chip.textContent = t(badge.titleKey);
    chip.title = t(badge.detailKey);
    els.badgeList.append(chip);
  }
}

function renderScanSummary(summary) {
  state.lastSummary = summary;
  els.resultMode.textContent = summary.dryRun ? t("resultDryRun") : t("resultScan");
  els.filesScanned.textContent = formatNumber(summary.filesScanned);
  els.newObservations.textContent = formatNumber(summary.newObservations);
  els.rawXp.textContent = formatNumber(summary.rawXp);
  els.dailyCappedXp.textContent = formatNumber(summary.dailyCappedXp);
  els.weeklyCappedXp.textContent = formatNumber(summary.weeklyCappedXp);
  els.finalXp.textContent = formatNumber(summary.finalXp);
  els.gainedXp.textContent = formatNumber(summary.gainedXp);
  els.importMode.textContent = summary.importMode === "profile-only" ? t("importModeProfileOnly") : t("importModeNone");
  els.recentWindow.textContent = formatRecentWindow(summary.recentDays);
  els.newlyUnlockedSkills.textContent = summary.newlyUnlockedSkills.length === 0 ? t("none") : summary.newlyUnlockedSkills.join(", ");
  els.warnings.textContent = formatNumber(
    summary.warnings.malformedJsonLines + summary.warnings.unknownTokenShapes + summary.warnings.unreadableFiles
  );
  renderResultNote(summary);
}

function renderAutoScan(autoScan) {
  state.autoStatus = autoScan;
  if (document.activeElement !== els.autoInterval) {
    els.autoInterval.value = String(autoScan.intervalMinutes);
  }
  els.autoScanMode.textContent = autoScan.running ? t("autoRunning") : autoScan.enabled ? t("autoIdle") : t("autoOff");
  els.autoStartButton.disabled = isReadOnlyShare() || autoScan.enabled || autoScan.running;
  els.autoStopButton.disabled = isReadOnlyShare() || !autoScan.enabled;
  els.autoInterval.disabled = isReadOnlyShare() || autoScan.enabled || autoScan.running;
  els.autoLastFinished.textContent = autoScan.lastFinishedAt ? formatDateTime(autoScan.lastFinishedAt) : t("never");
  els.autoNextRun.textContent = autoScan.nextRunAt ? formatDateTime(autoScan.nextRunAt) : "--";
  els.autoLastResult.textContent = autoScan.lastSummary
    ? formatAutoResult(autoScan.lastSummary)
    : t("autoNoResult");
  if (autoScan.lastError) {
    setAutoMessage(autoScan.lastError, "error");
    if (autoScan.lastError !== state.lastAutoError) {
      state.lastAutoError = autoScan.lastError;
      showPetFailure();
    }
  } else {
    state.lastAutoError = null;
  }
  if (autoScan.lastSummary) {
    renderScanSummary(autoScan.lastSummary);
    els.resultMode.textContent = t("resultAutoScan");
    renderStatus(autoScan.lastSummary.resultingStatus);
  }
  if (!autoScan.lastError && !state.manualScanBusy) {
    updatePetMotionForIdle();
  }
  setBusy(false);
}

function renderDoctorReport(report) {
  state.doctorReport = report;
  els.doctorState.textContent = report.state.readable
    ? "v" + report.state.schemaVersion + " / " + t("level") + " " + report.state.petLevel
    : t(report.state.exists ? "doctorNeedsAttention" : "doctorMissing");
  els.doctorCodex.textContent = report.codexHome.accessible
    ? t(report.codexHome.sessionsDirExists ? "doctorFound" : "doctorMissing")
    : t("doctorNeedsAttention");
  els.doctorPets.textContent = formatTranslatedMessage("doctorPetsSummary", {
    count: formatNumber(report.pets.availableCount)
  });

  if (!report.ok) {
    setMaintenanceMessage(report.warnings.join(" "), "error");
  } else if (!state.maintenanceMessageKey) {
    setMaintenanceMessage(t("doctorOk"), "ok");
  }
}

async function playBattleResult(battle) {
  const playbackId = state.battlePlaybackId + 1;
  state.battlePlaybackId = playbackId;
  const playbackState = {
    petHp: battle.pet.maxHp,
    opponentHp: battle.opponent.maxHp
  };
  prepareBattlePlayback(battle, playbackState);

  if (!state.prefersReducedMotion) {
    await waitForBattleFrame(220);
  }

  for (const entry of battle.log) {
    if (state.battlePlaybackId !== playbackId) {
      return;
    }
    await playBattleLogEntry(battle, entry, playbackState);
  }

  if (state.battlePlaybackId === playbackId) {
    clearBattleCardEffects();
    renderBattleResult(battle);
  }
}

function prepareBattlePlayback(battle, playbackState) {
  state.battleResult = battle;
  clearBattleCardEffects();
  els.battleMode.textContent = t("battleRunning");
  els.battleOutcome.textContent = "--";
  els.battleOpponent.textContent = battle.opponent.name + " L" + battle.opponent.level;
  setBattleHpText(playbackState, battle);
  els.battleTrainingXp.textContent = "--";
  els.battleRounds.textContent = "--";
  els.battleLog.replaceChildren();
  setBattleMessage("", "");
  setBattleCue(t("battleCueReady"));
  renderBattleCombatants(
    { ...battle.pet, hp: playbackState.petHp },
    { ...battle.opponent, hp: playbackState.opponentHp }
  );
}

async function playBattleLogEntry(battle, entry, playbackState) {
  clearBattleCardEffects();
  const actorCard = entry.actor === "pet" ? els.battlePetCard : els.battleOpponentCard;
  const targetCard = entry.actor === "pet" ? els.battleOpponentCard : els.battlePetCard;
  actorCard.classList.add(entry.category === "guard" ? "guarding" : "acting");
  setBattleCue(entry.category === "guard"
    ? t("battleCueGuard")
    : entry.missed
      ? t("battleCueMiss")
      : t("battleCueHit"));
  appendBattleLogEntry(entry, true);

  await waitForBattleFrame(180);

  if (entry.category !== "guard") {
    if (entry.missed) {
      actorCard.classList.remove("acting");
      actorCard.classList.add("missed");
    } else {
      targetCard.classList.add("hit");
      if (entry.actor === "pet") {
        playbackState.opponentHp = entry.targetHp;
      } else {
        playbackState.petHp = entry.targetHp;
      }
      renderBattleCombatants(
        { ...battle.pet, hp: playbackState.petHp },
        { ...battle.opponent, hp: playbackState.opponentHp }
      );
      setBattleHpText(playbackState, battle);
    }
  }

  await waitForBattleFrame(360);
}

function appendBattleLogEntry(entry, latest = false) {
  for (const item of els.battleLog.querySelectorAll(".latest")) {
    item.classList.remove("latest");
  }
  const item = document.createElement("li");
  item.className = latest ? "latest" : "";
  item.textContent = formatBattleLogEntry(entry);
  els.battleLog.append(item);
  els.battleLog.scrollTop = els.battleLog.scrollHeight;
}

function formatBattleLogEntry(entry) {
  if (entry.category === "guard") {
    return formatTranslatedMessage("battleGuard", {
      actor: entry.actorName,
      move: entry.moveName
    });
  }

  if (entry.missed) {
    return formatTranslatedMessage("battleMiss", {
      actor: entry.actorName,
      move: entry.moveName
    });
  }

  return formatTranslatedMessage("battleHit", {
    actor: entry.actorName,
    move: entry.moveName,
    damage: formatNumber(entry.damage)
  });
}

function clearBattleCardEffects() {
  for (const card of [els.battlePetCard, els.battleOpponentCard]) {
    card.classList.remove("acting", "hit", "guarding", "missed");
  }
}

function setBattleCue(label) {
  els.battleCue.textContent = label;
  els.battleCue.classList.remove("active");
  void els.battleCue.offsetWidth;
  els.battleCue.classList.add("active");
}

function setBattleHpText(playbackState, battle) {
  els.battleHp.textContent = playbackState.petHp + "/" + battle.pet.maxHp
    + " / " + playbackState.opponentHp + "/" + battle.opponent.maxHp;
}

function restoreBattleMode() {
  if (state.battleResult) {
    els.battleMode.textContent = t("battle" + capitalize(state.battleResult.outcome));
    return;
  }
  els.battleMode.textContent = t("battleWaiting");
}

function waitForBattleFrame(durationMs) {
  if (state.prefersReducedMotion) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function renderBattleResult(battle) {
  state.battleResult = battle;
  if (state.lastStatus) {
    renderBattleArena(state.lastStatus, battle);
  }
  els.battleMode.textContent = t("battle" + capitalize(battle.outcome));
  els.battleOutcome.textContent = t("battle" + capitalize(battle.outcome));
  els.battleOpponent.textContent = battle.opponent.name + " L" + battle.opponent.level;
  els.battleHp.textContent = battle.pet.hp + "/" + battle.pet.maxHp + " / " + battle.opponent.hp + "/" + battle.opponent.maxHp;
  els.battleTrainingXp.textContent = "+" + formatNumber(battle.rewards.petXpAwarded);
  els.battleRounds.textContent = formatNumber(battle.rounds);
  els.battleLog.replaceChildren();
  for (const entry of battle.log.slice(-8)) {
    appendBattleLogEntry(entry);
  }
  setBattleCue(t("battleCueReady"));
}

function renderBattleStats(battle) {
  if (!battle) {
    els.battleTrainingXp.textContent = "--";
    els.battleRounds.textContent = "--";
    els.battleRecord.textContent = "0-0-0";
    els.battleStreak.textContent = "0 / 0";
    return;
  }
  els.battleRecord.textContent = battle.wins + "-" + battle.losses + "-" + battle.draws;
  els.battleStreak.textContent = formatNumber(battle.currentStreak) + " / " + formatNumber(battle.bestStreak);
}

function setBusy(isBusy) {
  const manualIsRunning = state.manualScanBusy === true;
  const autoIsRunning = state.autoStatus?.running === true;
  const autoIsEnabled = state.autoStatus?.enabled === true;
  els.dryRunButton.disabled = isReadOnlyShare() || isBusy || manualIsRunning || autoIsRunning;
  els.confirmButton.disabled = isReadOnlyShare() || isBusy || manualIsRunning || state.lastDryRun === null || autoIsRunning || autoIsEnabled;
}

function setAutoBusy(isBusy) {
  els.autoStartButton.disabled = isReadOnlyShare() || isBusy || state.autoStatus?.enabled === true;
  els.autoStopButton.disabled = isReadOnlyShare() || isBusy || state.autoStatus?.enabled !== true;
  els.autoInterval.disabled = isReadOnlyShare() || isBusy || state.autoStatus?.enabled === true;
}

function setBattleBusy(isBusy) {
  els.practiceBattleButton.disabled = isReadOnlyShare() || isBusy;
  els.battleDifficulty.disabled = isBusy;
  els.battleMove.disabled = isBusy;
}

function setMaintenanceBusy(isBusy) {
  els.backupStateButton.disabled = isReadOnlyShare() || isBusy;
  els.refreshDoctorButton.disabled = isBusy;
}

function isReadOnlyShare() {
  return state.config?.readOnlyShare === true;
}

function setMessage(message, kind) {
  state.messageKey = null;
  state.messageKind = kind;
  els.messageLine.textContent = message;
  els.messageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setTranslatedMessage(key, kind) {
  state.messageKey = key;
  state.messageKind = kind;
  els.messageLine.textContent = t(key);
  els.messageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setAutoMessage(message, kind) {
  state.autoMessageKey = null;
  state.autoMessageKind = kind;
  els.autoMessageLine.textContent = message;
  els.autoMessageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setBattleMessage(message, kind) {
  els.battleMessageLine.textContent = message;
  els.battleMessageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setTranslatedAutoMessage(key, kind) {
  state.autoMessageKey = key;
  state.autoMessageKind = kind;
  els.autoMessageLine.textContent = t(key);
  els.autoMessageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setMaintenanceMessage(message, kind) {
  state.maintenanceMessageKey = null;
  state.maintenanceMessageArgs = null;
  state.maintenanceMessageKind = kind;
  els.maintenanceMessageLine.textContent = message;
  els.maintenanceMessageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setTranslatedMaintenanceMessage(key, kind, args) {
  state.maintenanceMessageKey = key;
  state.maintenanceMessageArgs = args;
  state.maintenanceMessageKind = kind;
  els.maintenanceMessageLine.textContent = formatTranslatedMessage(key, args);
  els.maintenanceMessageLine.className = "message-line" + (kind ? " " + kind : "");
}

function setLanguage(language) {
  state.language = language === "zh" ? "zh" : "en";
  try {
    localStorage.setItem("codexPetBattleLanguage", state.language);
  } catch {
    // Language choice is a UI preference only.
  }
  applyTranslations();
  if (state.lastStatus) {
    renderStatus(state.lastStatus);
  }
  if (state.lastSummary) {
    renderScanSummary(state.lastSummary);
  } else {
    els.resultMode.textContent = t("resultNone");
  }
  updatePetMotionForIdle();
}

function applyTranslations() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.querySelector(".language-toggle").setAttribute("aria-label", t("languageLabel"));
  els.langZh.classList.toggle("active", state.language === "zh");
  els.langEn.classList.toggle("active", state.language === "en");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-tooltip]")) {
    const value = t("tooltips." + element.dataset.tooltip);
    element.title = value;
    element.setAttribute("aria-label", value);
  }
  els.dryRunButton.textContent = t("dryRun");
  els.confirmButton.textContent = t("confirmScan");
  els.practiceBattleButton.textContent = t("practiceBattle");
  els.battleDifficulty.querySelector('option[value="easy"]').textContent = t("difficultyEasy");
  els.battleDifficulty.querySelector('option[value="normal"]').textContent = t("difficultyNormal");
  els.battleDifficulty.querySelector('option[value="hard"]').textContent = t("difficultyHard");
  els.autoStartButton.textContent = t("startAutoScan");
  els.autoStopButton.textContent = t("stopAutoScan");
  els.refreshDoctorButton.textContent = t("refreshDoctor");
  els.backupStateButton.textContent = t("backupState");
  els.confirmNote.textContent = t("confirmNote");
  if (state.petCatalog) {
    renderPetCatalog(state.petCatalog);
  }
  if (state.petManifest) {
    els.petAssetStatus.textContent = t("petReady").replace("{pet}", state.petManifest.displayName);
  }
  if (state.lastStatus) {
    renderBattleMoves(state.lastStatus.battle.availableMoves ?? []);
  }
  renderScanMode();
  if (state.messageKey) {
    els.messageLine.textContent = t(state.messageKey);
  }
  if (state.autoMessageKey) {
    els.autoMessageLine.textContent = t(state.autoMessageKey);
  }
  if (state.maintenanceMessageKey) {
    els.maintenanceMessageLine.textContent = formatTranslatedMessage(
      state.maintenanceMessageKey,
      state.maintenanceMessageArgs
    );
  }
  if (!state.lastSummary) {
    els.resultMode.textContent = t("resultNone");
    els.importMode.textContent = t("importModeNone");
    els.recentWindow.textContent = formatRecentWindow(state.selectedDays);
    els.newlyUnlockedSkills.textContent = t("none");
    els.resultNote.hidden = true;
  }
  if (state.autoStatus) {
    renderAutoScan(state.autoStatus);
  }
  if (state.doctorReport) {
    renderDoctorReport(state.doctorReport);
  }
  if (state.battleResult) {
    renderBattleResult(state.battleResult);
  }
}

function renderScanMode() {
  els.scanMode.textContent = t(state.scanModeKey);
}

function renderResultNote(summary) {
  const notes = [];
  if (summary.importMode === "profile-only") {
    notes.push(t("profileOnlyNote"));
  }
  if (warningTotal(summary.warnings) > 0) {
    notes.push(formatWarningBreakdown(summary.warnings));
  }
  els.resultNote.textContent = notes.join(" ");
  els.resultNote.hidden = notes.length === 0;
}

function formatTranslatedMessage(key, args) {
  let message = t(key);
  for (const [name, value] of Object.entries(args ?? {})) {
    message = message.replace("{" + name + "}", String(value));
  }
  return message;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatWarningBreakdown(warnings) {
  return t("warnings") + ": "
    + t("warningMalformed") + " " + formatNumber(warnings.malformedJsonLines) + ", "
    + t("warningUnknown") + " " + formatNumber(warnings.unknownTokenShapes) + ", "
    + t("warningUnreadable") + " " + formatNumber(warnings.unreadableFiles) + ".";
}

function warningTotal(warnings) {
  return warnings.malformedJsonLines + warnings.unknownTokenShapes + warnings.unreadableFiles;
}

function formatRecentWindow(recentDays) {
  if (recentDays === undefined) {
    return t("recentWindowAll");
  }
  return formatNumber(recentDays) + t("recentWindowDaysSuffix");
}

function formatAutoResult(summary) {
  return t("autoResultSummary")
    .replace("{xp}", formatNumber(summary.gainedXp))
    .replace("{observations}", formatNumber(summary.newObservations));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(state.language === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function detectLanguage() {
  try {
    const stored = localStorage.getItem("codexPetBattleLanguage");
    if (stored === "zh" || stored === "en") {
      return stored;
    }
  } catch {
    // Fall through to browser language.
  }
  return navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function t(key) {
  const value = lookupTranslation(translations[state.language], key) ?? lookupTranslation(translations.en, key);
  return typeof value === "string" ? value : key;
}

function lookupTranslation(root, key) {
  const parts = key.split(".");
  let value = root;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

function formatNumber(value) {
  return new Intl.NumberFormat(state.language === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 2 }).format(value);
}

init().catch((error) => setMessage(error.message, "error"));`;

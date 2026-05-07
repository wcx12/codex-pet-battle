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
          <div class="local-pill">127.0.0.1</div>
        </div>
      </header>

      <main class="dashboard-grid">
        <section class="pet-panel" aria-labelledby="petName">
          <div class="pet-stage">
            <div class="pet-device">
              <div class="pet-avatar" aria-hidden="true">
                <span class="pet-eye left"></span>
                <span class="pet-eye right"></span>
                <span class="pet-mouth"></span>
              </div>
            </div>
            <div class="pet-copy">
              <h2 id="petName">Pathy</h2>
              <p id="petLevel">Level 1</p>
            </div>
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
  --bg: #f5f2eb;
  --surface: #fffdf8;
  --surface-strong: #f0ebe0;
  --ink: #18211f;
  --muted: #69706b;
  --line: #d9d2c3;
  --teal: #167b73;
  --teal-dark: #0d5853;
  --amber: #b56a1a;
  --red: #a7483f;
  --shadow: 0 18px 42px rgba(40, 35, 25, 0.09);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

button {
  font: inherit;
}

.app-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 36px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  margin-bottom: 18px;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 760;
}

.topbar p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.local-pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255, 253, 248, 0.72);
  color: var(--teal-dark);
  font-size: 12px;
  font-weight: 700;
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
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 253, 248, 0.72);
}

.language-button {
  min-height: 31px;
  border: 0;
  border-right: 1px solid var(--line);
  padding: 0 10px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 780;
  cursor: pointer;
}

.language-button:last-child {
  border-right: 0;
}

.language-button.active {
  background: var(--teal);
  color: #fff;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.18fr) minmax(280px, 0.82fr);
  grid-template-areas:
    "pet economy"
    "usage scan"
    "usage auto"
    "usage result";
  gap: 16px;
  align-items: start;
}

.panel,
.pet-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.pet-panel {
  grid-area: pet;
  padding: 22px;
}

.panel {
  padding: 18px;
}

.pet-stage {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 22px;
  align-items: center;
  margin-bottom: 20px;
}

.pet-device {
  display: grid;
  place-items: center;
  height: 168px;
  border: 1px solid #cabfaddd;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(22, 123, 115, 0.08), transparent 52%),
    #ebe3d5;
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
  font-size: 44px;
  line-height: 1;
  font-weight: 820;
}

.pet-copy p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 650;
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
  height: 14px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid #b8aa93;
  background: #e5dccb;
}

.xp-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, var(--teal), #e0a03a);
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
  border: 1px solid #b8aa93;
  border-radius: 999px;
  padding: 7px 10px;
  color: var(--teal-dark);
  background: #f3ecdf;
  font-size: 12px;
  font-weight: 760;
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
}

.panel-title h2 {
  margin: 0;
  font-size: 17px;
  line-height: 1.2;
  font-weight: 780;
}

.panel-title span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
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
  border-top: 1px solid #ece5d8;
  padding-top: 9px;
}

.metric-list strong,
.result-grid strong,
.token-grid strong {
  font-size: 14px;
  text-align: right;
}

.scan-panel {
  border-color: #cdb58e;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: #f4eee3;
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
  background: var(--teal);
  color: white;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 14px 0 12px;
}

.button {
  min-height: 42px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.button.primary {
  background: var(--teal);
  color: #fff;
}

.button.guarded {
  background: #fff6e8;
  border-color: #d49f59;
  color: #7b4614;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.button:not(:disabled):hover,
.segment:hover {
  filter: brightness(0.98);
}

.auto-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin: 14px 0 12px;
}

.field-label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  text-transform: uppercase;
}

.number-input {
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

.scan-panel {
  grid-area: scan;
}

.auto-panel {
  grid-area: auto;
}

.usage-panel {
  grid-area: usage;
}

.result-panel {
  grid-area: result;
}

@media (max-width: 840px) {
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
      "economy"
      "scan"
      "auto"
      "usage"
      "result";
  }

  .pet-panel {
    grid-area: pet;
  }

  .pet-stage {
    grid-template-columns: 124px 1fr;
  }

  .pet-device {
    height: 124px;
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
  .action-row,
  .auto-controls {
    grid-template-columns: 1fr;
  }

  .pet-device {
    height: 156px;
  }
}`;

export const dashboardScript = `const translations = {
  en: {
    languageLabel: "Language",
    skills: "Skills",
    none: "none",
    updated: "Updated",
    level: "Level",
    formula: "Formula",
    levelCurve: "Level curve",
    todayXpUsed: "Today XP used",
    weekXpUsed: "Week XP used",
    weekXpLeft: "Week XP left",
    xpRemainder: "XP remainder",
    scan: "Scan",
    scanHelp: "Run Dry run first. It previews local token metadata and does not write state.",
    scanWindowHelp: "7/30 means the last N x 24 hours. All scans every local session.",
    all: "All",
    dryRun: "Dry run",
    confirmScan: "Confirm scan",
    confirmNote: "Confirm scan writes the local state file. First import records profile and XP ledgers, but final XP can still be 0.",
    autoScan: "Auto Scan",
    autoScanHelp: "Auto scan writes local state on a timer. It uses the selected scan window when you start it.",
    intervalMinutes: "Interval minutes",
    startAutoScan: "Start auto",
    stopAutoScan: "Stop auto",
    lastAutoScan: "Last auto scan",
    nextAutoScan: "Next auto scan",
    autoLastResult: "Last result",
    autoOff: "off",
    autoIdle: "on",
    autoRunning: "running",
    autoStarting: "Starting auto scan...",
    autoStopping: "Stopping auto scan...",
    autoStarted: "Auto scan started.",
    autoStopped: "Auto scan stopped.",
    autoStatusFailed: "Auto scan status failed.",
    autoNoResult: "no scan yet",
    autoResultSummary: "XP +{xp}, {observations} new",
    never: "never",
    lifetimeTokens: "Lifetime Tokens",
    input: "Input",
    cached: "Cached",
    output: "Output",
    reasoning: "Reasoning",
    recentResult: "Recent Result",
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

const state = {
  config: null,
  selectedDays: 30,
  lastDryRun: null,
  lastStatus: null,
  lastSummary: null,
  autoStatus: null,
  autoPollTimer: null,
  scanModeKey: "dryRunFirst",
  messageKey: null,
  messageKind: "",
  autoMessageKey: null,
  autoMessageKind: "",
  language: detectLanguage()
};

const els = {
  stateFileLabel: document.getElementById("stateFileLabel"),
  petName: document.getElementById("petName"),
  petLevel: document.getElementById("petLevel"),
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

async function init() {
  bindControls();
  applyTranslations();
  state.config = await fetchJson("/api/config");
  renderConfig(state.config);
  const statusPayload = await fetchJson("/api/status");
  renderStatus(statusPayload.status);
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
    });
  }

  for (const button of document.querySelectorAll(".language-button")) {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  }

  els.dryRunButton.addEventListener("click", () => runScan(true));
  els.confirmButton.addEventListener("click", () => runScan(false));
  els.autoStartButton.addEventListener("click", () => startAutoScan());
  els.autoStopButton.addEventListener("click", () => stopAutoScan());
}

async function runScan(dryRun) {
  setBusy(true);
  setTranslatedMessage(dryRun ? "scanningMetadata" : "writingLocalState", "");
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
    } else {
      renderStatus(summary.resultingStatus);
      state.lastDryRun = null;
      els.confirmButton.disabled = true;
      els.confirmNote.hidden = true;
      state.scanModeKey = "scanCompleteMode";
      renderScanMode();
      setTranslatedMessage("scanComplete", "ok");
    }
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function startAutoScan() {
  setAutoBusy(true);
  setTranslatedAutoMessage("autoStarting", "");
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
  } finally {
    setAutoBusy(false);
  }
}

async function stopAutoScan() {
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
  } catch (error) {
    setAutoMessage(error.message, "error");
  } finally {
    setAutoBusy(false);
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

function renderConfig(config) {
  els.stateFileLabel.textContent = config.stateFileLabel;
}

function renderStatus(status) {
  state.lastStatus = status;
  els.petName.textContent = status.pet.name;
  els.petLevel.textContent = t("level") + " " + status.pet.level;
  els.xpText.textContent = status.pet.xp + "/" + status.pet.xpToNextLevel;
  const percent = status.pet.xpToNextLevel === 0 ? 0 : Math.min(100, Math.round((status.pet.xp / status.pet.xpToNextLevel) * 100));
  els.xpFill.style.width = percent + "%";
  els.skillsList.replaceChildren();
  if (status.pet.skills.length === 0) {
    const empty = document.createElement("span");
    empty.className = "skill-chip";
    empty.textContent = t("none");
    els.skillsList.append(empty);
  } else {
    for (const skill of status.pet.skills) {
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.textContent = skill;
      els.skillsList.append(chip);
    }
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
  els.autoStartButton.disabled = autoScan.enabled || autoScan.running;
  els.autoStopButton.disabled = !autoScan.enabled;
  els.autoInterval.disabled = autoScan.enabled || autoScan.running;
  els.autoLastFinished.textContent = autoScan.lastFinishedAt ? formatDateTime(autoScan.lastFinishedAt) : t("never");
  els.autoNextRun.textContent = autoScan.nextRunAt ? formatDateTime(autoScan.nextRunAt) : "--";
  els.autoLastResult.textContent = autoScan.lastSummary
    ? formatAutoResult(autoScan.lastSummary)
    : t("autoNoResult");
  if (autoScan.lastError) {
    setAutoMessage(autoScan.lastError, "error");
  }
  if (autoScan.lastSummary) {
    renderScanSummary(autoScan.lastSummary);
    els.resultMode.textContent = t("resultAutoScan");
    renderStatus(autoScan.lastSummary.resultingStatus);
  }
  setBusy(false);
}

function setBusy(isBusy) {
  const autoIsRunning = state.autoStatus?.running === true;
  const autoIsEnabled = state.autoStatus?.enabled === true;
  els.dryRunButton.disabled = isBusy || autoIsRunning;
  els.confirmButton.disabled = isBusy || state.lastDryRun === null || autoIsRunning || autoIsEnabled;
}

function setAutoBusy(isBusy) {
  els.autoStartButton.disabled = isBusy || state.autoStatus?.enabled === true;
  els.autoStopButton.disabled = isBusy || state.autoStatus?.enabled !== true;
  els.autoInterval.disabled = isBusy || state.autoStatus?.enabled === true;
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

function setTranslatedAutoMessage(key, kind) {
  state.autoMessageKey = key;
  state.autoMessageKind = kind;
  els.autoMessageLine.textContent = t(key);
  els.autoMessageLine.className = "message-line" + (kind ? " " + kind : "");
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
  els.autoStartButton.textContent = t("startAutoScan");
  els.autoStopButton.textContent = t("stopAutoScan");
  els.confirmNote.textContent = t("confirmNote");
  renderScanMode();
  if (state.messageKey) {
    els.messageLine.textContent = t(state.messageKey);
  }
  if (state.autoMessageKey) {
    els.autoMessageLine.textContent = t(state.autoMessageKey);
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

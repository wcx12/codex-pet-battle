# Codex Pet Battle

Codex Pet Battle 是一个给 Codex Pets 做的本地 RPG 养成实验项目。

长期目标是把 Codex 使用过程变成一个小型成长循环：宠物从 Codex 活动和 token 使用量中获得经验，升级后解锁技能和形态，未来再支持账号同步、战斗、排行和反作弊。

当前仓库实现的是本地 CLI + 本地 Dashboard MVP。它读取本机 Codex session 日志，只提取 token 使用统计，把新增 token 使用量换算成宠物经验，并写入本地 `pet_state.local.json`。

## 当前状态

已经完成：

- 本地 CLI：`scan`、`status`、`backup`、`doctor` 和 `battle`
- 本地 Dashboard：`dashboard`
- Codex home 自动解析与手动覆盖
- 扫描 `sessions/**/rollout-*.jsonl`
- 提取 `token_count` 的 token usage metadata
- hard-v1 正式经验系统：低收益公式、里程碑等级曲线、每日软 cap、每周硬 cap
- 首次导入 `profile-only`：记录画像和去重信息，但不给最终 XP
- 本地 schema v2 状态文件与 v1 内存迁移
- 已处理 observation 去重，避免重复 scan 重复加 XP
- `scan --dry-run`，预览但不写状态
- `scan --recent-days <days>`，只统计最近 N 天
- XP benchmark，用于比较候选经济规则
- Dashboard API 和静态 UI：状态展示、dry-run、确认式 scan、中英文切换、Auto Scan、维护面板和 doctor 诊断
- 本地状态备份：CLI `backup` 和 Dashboard token-protected backup API/UI
- 宠物包管理：发现项目内和 Codex home 下的宠物包，并在 Dashboard 中本地选择当前宠物
- 技能 catalog：显示技能解锁等级、锁定状态和效果说明
- 本地训练战斗：按宠物等级和已解锁技能生成属性、招式、回合制 PvE 战斗日志、本地战绩和训练 XP
- Adventure 任务与徽章面板：按当前伙伴、侦察、领取 XP、训练战斗、胜场和等级派生训练师称号、任务状态和徽章
- 内置 Pathy 动画宠物包：`pet.json`、`spritesheet.webp`、9 行状态动作和 Dashboard sprite renderer
- 自动化测试覆盖 scanner、progression、state store、CLI、benchmark、Dashboard 和隐私边界

暂未实现：

- 账号、云同步、远程数据库
- PvP 战斗、匹配、排行榜、反作弊
- 战斗掉落、捕获/收集系统和素材奖励
- 独立迁移命令、破坏性重置流程和完整可视化配置面板

## 快速开始

安装依赖：

```powershell
npm install
```

运行完整检查：

```powershell
npm run check
```

常用脚本：

| 脚本 | 说明 |
| --- | --- |
| `npm run dev -- ...` | 用 `tsx` 直接运行开发版 CLI。 |
| `npm run benchmark:xp -- ...` | 运行 XP 经济模型 benchmark，不写本地状态。 |
| `npm run build` | 编译 TypeScript 到 `dist/`。 |
| `npm run test` | 运行 Vitest 测试。 |
| `npm run test:watch` | 以 watch 模式运行测试。 |
| `npm run check` | 先 build，再 test。 |

build 后可以直接运行编译产物：

```powershell
node dist/src/cli.js scan --dry-run
```

## 命令手册

### 预览扫描

推荐先用 dry-run。它会扫描并计算结果，但不会创建或修改 `pet_state.local.json`。

```powershell
npm run dev -- scan --dry-run
```

只预览最近 30 天：

```powershell
npm run dev -- scan --dry-run --recent-days 30
```

### 正式扫描

扫描默认 Codex home，并写入本地宠物状态：

```powershell
npm run dev -- scan
```

指定 Codex home：

```powershell
npm run dev -- scan --codex-home C:\Users\you\.codex
```

指定状态文件：

```powershell
npm run dev -- scan --state-file .\tmp.pet_state.local.json
```

组合使用：

```powershell
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json --dry-run --recent-days 30
```

### 查看状态

`status` 只读取本地状态，不扫描日志，也不会修改状态文件。

```powershell
npm run dev -- status
```

指定状态文件：

```powershell
npm run dev -- status --state-file .\tmp.pet_state.local.json
```

`status` 不接受 `--codex-home`、`--dry-run` 或 `--recent-days`。

### 备份状态

`backup` 会把当前状态文件复制到同目录的新文件，不扫描 Codex 日志，也不解析或上传状态内容。

```powershell
npm run dev -- backup
```

指定状态文件：

```powershell
npm run dev -- backup --state-file .\pet_state.manual.local.json
```

备份文件会使用 `pet_state.*.local.json` 命名，默认被 `.gitignore` 忽略。

### 本地诊断

`doctor` 会检查 Codex home、`sessions` 目录、本地状态文件和可用宠物包，只输出脱敏摘要。

```powershell
npm run dev -- doctor
```

指定 Codex home 和状态文件：

```powershell
npm run dev -- doctor --codex-home tests\fixtures\codex-home-basic --state-file .\pet_state.manual.local.json
```

### 训练战斗

`battle` 会读取本地宠物状态，把等级和技能转换成战斗属性与招式，并运行一场本地回合制 PvE 训练战斗。默认只输出结果和日志；加上 `--commit` 会把胜/负/平、连胜、最佳连胜、最近战斗时间和少量本地训练 XP 写入 state。训练战斗不发 Codex XP，Codex XP 仍然只来自 scan。

```powershell
npm run dev -- battle
```

指定难度：

```powershell
npm run dev -- battle --difficulty easy
npm run dev -- battle --difficulty normal
npm run dev -- battle --difficulty hard
```

指定开场招式：

```powershell
npm run dev -- battle --difficulty normal --move token_spark
```

指定状态文件和随机种子：

```powershell
npm run dev -- battle --state-file .\pet_state.manual.local.json --difficulty hard --seed demo
```

写入战绩：

```powershell
npm run dev -- battle --state-file .\pet_state.manual.local.json --difficulty normal --commit
```

### 本地 Dashboard

启动本地 Dashboard：

```powershell
npm run dev -- dashboard
```

指定端口：

```powershell
npm run dev -- dashboard --port 4317
```

指定 Codex home 和状态文件：

```powershell
npm run dev -- dashboard --codex-home tests\fixtures\codex-home-basic --state-file .\pet_state.manual.local.json
```

启动时直接开启自动扫描：

```powershell
npm run dev -- dashboard --auto-scan --auto-scan-interval 10 --auto-scan-recent-days 30
```

Dashboard 只绑定 `127.0.0.1`。页面提供宠物等级、XP、技能、训练战斗与本地战绩、训练 XP、Adventure 任务/徽章、hard-v1 economy、lifetime token counters、recent-days 选择、`Dry run`、确认式 `Confirm scan`、显式开启的 `Auto Scan`、本地维护面板、宠物图鉴 Dex 和动画宠物。

页面右上角可以在中文和英文之间切换，默认会跟随浏览器语言，并把选择保存在本机 `localStorage`。扫描区域会提示 `Dry run` 只预览、不写状态；`Confirm scan` 会写入当前 state 文件。结果区域会显示导入模式、扫描窗口、新解锁技能、warning 汇总，以及首次导入 `profile-only` 导致本次最终 XP 可能为 0 的说明。hard-v1 的公式、等级曲线、daily/weekly cap、cached input 和最终 XP 等字段旁边都有 `?` 帮助提示。

`Auto Scan` 默认关闭。开启后会立即写入扫描一次，并按设定间隔继续扫描；它会使用开启时选中的 `7 / 30 / 全部` 扫描窗口。自动扫描和手动扫描共享同一个串行锁，自动写入成功后会让旧的手动 dry-run 确认失效，避免在旧预览基础上重复确认。

Dashboard 的训练战斗会使用本地页面会话 token 写入战绩和本地训练 XP，并返回刷新后的脱敏状态。战斗区会逐回合播放宠物和对手的站位、出招、不同招式特效、命中、落空、防守、受击和 HP 变化，显示双方 HP 条、结果、回合日志，以及招式图鉴和解锁等级。练习对手会从 Static Mote、Cache Shell、Trace Lancer、Loop Sentinel、Null Mirror、Patch Core 等原创野怪模板中按难度和 seed 选择。它不增加 Codex XP，也不会读取或上传 Codex 日志。

Adventure 面板是只读派生状态，不新增存档字段：它会根据当前伙伴、首次侦察、已领取 XP、战斗次数、胜场和等级显示训练师称号、下一批任务和徽章。Tailscale 只读预览也可以展示这些进度，但不会允许任何写入动作。

Pathy 动画资产位于 `assets/pets/pathy/`。Dashboard 会通过 `/api/pets` 发现项目内 `assets/pets/<pet-id>` 和 Codex home 下的宠物包，并在 Dex 面板里显示可用伙伴。选中宠物会通过 `/api/pet/select` 写入 `pet_state.local.json` 的 `activePetId`，同时读取 `/pet/<pet-id>/pet.json` 和 `/pet/<pet-id>/spritesheet.webp`；如果宠物包缺失或加载失败，会自动回退到原来的 CSS 静态头像。当前动作映射是：空闲 `idle`，预览扫描 `review`，扫描写入中 `running`，自动扫描待命 `waiting`，失败 `failed`，获得 XP `waving`，解锁技能 `jumping`。

Dashboard 维护面板会显示 doctor 摘要，并提供本地状态备份按钮。Dashboard API 不返回 raw observations、processed observation IDs、prompt、response、tool output、raw JSONL、完整 state 或 Codex home 绝对路径。写操作需要本地页面会话 token，并且 `Confirm scan` 必须先有匹配的 dry-run。

### 帮助

```powershell
npm run dev -- help
```

### 参数说明

| 参数 | 适用命令 | 说明 |
| --- | --- | --- |
| `--codex-home <path>` | `scan`, `doctor`, `dashboard` | 指定 Codex home。默认使用用户目录下的 `.codex`。 |
| `--state-file <path>` | `scan`, `status`, `backup`, `doctor`, `dashboard` | 指定本地宠物状态文件。默认是当前目录的 `pet_state.local.json`。 |
| `--dry-run` | `scan` | 只预览结果，不创建、不写入、不修改状态文件。 |
| `--recent-days <days>` | `scan` | 只统计最近 `days * 24` 小时内的 token observation。 |
| `--difficulty <easy\|normal\|hard>` | `battle` | 指定训练战斗难度。默认是 `normal`。 |
| `--seed <seed>` | `battle` | 指定训练战斗随机种子，用于复现同一场战斗。 |
| `--commit` | `battle` | 将本次训练战斗的战绩写入 state。默认不写。 |
| `--port <port>` | `dashboard` | 指定本地 Dashboard 端口。默认从 `4317` 开始，冲突时自动尝试后续端口。 |
| `--auto-scan` | `dashboard` | 启动 Dashboard 时直接开启自动扫描。默认关闭。 |
| `--auto-scan-interval <minutes>` | `dashboard` | 自动扫描间隔，单位分钟。最小值是 `1`，默认 `10`。必须配合 `--auto-scan`。 |
| `--auto-scan-recent-days <days\|all>` | `dashboard` | 自动扫描窗口。默认 `30`，也可以传 `all`。必须配合 `--auto-scan`。 |

也可以通过环境变量指定 Codex home：

```powershell
$env:CODEX_PET_BATTLE_CODEX_HOME = "C:\Users\you\.codex"
npm run dev -- scan --dry-run
```

## hard-v1 经验系统

hard-v1 的目标是让升级变慢，避免完整历史导入让宠物瞬间暴涨。

正式 scan 当前使用：

- Formula：`output-focused`
- Level curve：`milestone`
- Daily cap：`hard-daily`
- Weekly cap：`hard-weekly`
- Import mode：首次导入 `profile-only`
- Economy version：`hard-v1`

XP 公式：

```text
rawXp =
  uncachedInputTokens / 250000
  + outputTokens / 12000
  + reasoningOutputTokens / 12000
```

`cachedInputTokens` 不给 XP，但仍会计入 lifetime counters。

每日软 cap：

| 当日 raw XP 区间 | 转换率 |
| --- | --- |
| 0 到 6 | 100% |
| 6 到 20 | 35% |
| 20 到 60 | 10% |
| 60 以上 | 0% |

每周硬 cap：

```text
max 80 XP / UTC week
```

首次导入规则：

- 第一次遇到新 observations 时，`importApplied=true`
- lifetime token counters 会记录
- processed observation IDs 会记录
- daily/weekly XP ledger 会记录，用来防止同日或同周 cap 被绕过
- 最终入账 XP 为 0

这意味着第一次正式 scan 主要是在建立本地画像。之后新增的 Codex 活动才会正常获得 XP。

当前技能解锁：

| 等级 | 技能 |
| --- | --- |
| 2 | `token_spark` |
| 3 | `context_sense` |
| 5 | `test_shield` |
| 8 | `refactor_aura` |
| 10 | `battle_ready` |

## 手工验收流程

先用 fixture 数据验证：

```powershell
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json --dry-run
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json
npm run dev -- status --state-file .\tmp.pet_state.local.json
```

预期行为：

- dry-run 会打印预计结果，但不会创建或修改状态文件。
- 第一次正式 scan 会写入 schema v2 状态，触发 `profile-only`，`XP gained` 为 0。
- 第二次正式 scan 对同一批 observations 应获得 0 XP，也不应重写状态。
- `status` 只读状态，不扫描日志。

确认 fixture 行为正常后，再对真实 Codex home 做 dry-run：

```powershell
npm run dev -- scan --dry-run --recent-days 30
```

只有当 dry-run 输出看起来合理时，再考虑正式 scan。

## XP Benchmark

XP benchmark 用来比较多套候选经济规则。它只读取 Codex token metadata 并输出汇总统计，不创建、不读取、不修改 `pet_state.local.json`。

默认 benchmark 最近 30 天：

```powershell
npm run benchmark:xp
```

指定时间窗口：

```powershell
npm run benchmark:xp -- --recent-days 7
npm run benchmark:xp -- --recent-days 30
npm run benchmark:xp -- --all
```

指定 Codex home：

```powershell
npm run benchmark:xp -- --codex-home tests\fixtures\codex-home-basic --recent-days 30
```

输出 JSON：

```powershell
npm run benchmark:xp -- --recent-days 30 --json
```

当前 benchmark 会比较：

- MVP baseline：旧的膨胀基线
- hard linear：极低线性 XP
- output focused：更强调 output/reasoning，cached input 不给 XP
- sqrt compression：平方根压缩
- log compression：对数压缩

benchmark 仍保留用于后续调参；正式 `scan` 当前已经切到 hard-v1。

## 架构总览

当前 MVP 由这些核心模块组成：

```text
src/
  cli.ts
  scanWorkflow.ts
  privacy.ts
  codexHomeResolver.ts
  sessionScanner.ts
  progressionEngine.ts
  petStateStore.ts
  skillCatalog.ts
  diagnostics.ts
  types.ts
  battle/
  economy/
  dashboard/
```

### `cli.ts`

CLI 入口，负责：

- 解析命令和参数
- 执行 `scan` / `status` / `backup` / `doctor` / `battle` / `dashboard`
- 编排 scan workflow、status、backup、doctor、battle 和 dashboard server
- 打印用户可读且脱敏的输出
- 在 `--dry-run` 下保证不写状态

### `scanWorkflow.ts`

CLI 和 Dashboard 共享的 scan 编排层，负责：

- resolve Codex home；
- 读取或创建内存默认 state；
- 调用 scanner；
- 过滤已处理 observations；
- 调用 progression engine；
- 根据 dry-run 决定是否写 state。

### `codexHomeResolver.ts`

负责解析 Codex home：

1. 优先使用 `--codex-home`
2. 其次使用 `CODEX_PET_BATTLE_CODEX_HOME`
3. 最后使用平台默认路径

Windows 默认路径：

```text
%USERPROFILE%\.codex
```

### `sessionScanner.ts`

负责扫描 Codex session 日志：

- 遍历 `sessions/**/rollout-*.jsonl`
- 按行读取 JSONL
- 查找 `token_count` 事件
- 优先使用 `last_token_usage`
- 如果缺少 `last_token_usage`，用同一文件内的 `total_token_usage` 计算正向 delta
- 生成脱敏 `TokenObservation`
- 统计 warning 数量

scanner 不会返回 prompt、response、tool output、原始 JSONL 行或凭据。

### `economy/`

存放可复用经济模型：

- `formulas.ts`：XP 公式
- `caps.ts`：每日和每周 cap
- `levelCurves.ts`：等级曲线
- `candidates.ts`：benchmark 候选组合
- `simulateEconomy.ts`：离线模拟器

### `progressionEngine.ts`

负责正式游戏规则：

- 过滤本批次重复 observation
- 把 token usage 换算成 hard-v1 raw XP
- 按 UTC day 和 UTC week 更新 cap ledger
- 应用首次导入 `profile-only`
- 用 milestone curve 结算等级和溢出 XP
- 解锁技能
- 累加 lifetime token totals

### `petStateStore.ts`

负责本地状态：

- 创建默认 schema v2 宠物状态
- 读取 `pet_state.local.json`
- 将 schema v1 状态迁移为内存中的 schema v2
- 原子写入状态文件
- 备份状态文件
- 过滤已处理 observations
- 遇到损坏 JSON 或不支持的 schema version 时安全失败

状态文件损坏时不会自动覆盖，用户需要先备份或移除旧文件。

### `skillCatalog.ts`

集中定义技能解锁等级、展示名称、效果说明和描述。`progressionEngine.ts` 用它结算新技能，Dashboard 用它展示已解锁和未解锁技能。

### `diagnostics.ts`

负责生成脱敏 doctor 报告：

- 检查 Codex home 是否可访问；
- 检查 `sessions` 目录是否存在；
- 检查本地 state 是否存在、可读、schema 是否有效；
- 统计可用宠物包；
- 只返回文件名、数量和状态，不返回绝对路径或完整 state。

### `battle/`

本地训练战斗模块：

- `battleMoves.ts`：定义宠物和练习对手的招式；
- `battleTypes.ts`：定义战斗难度、属性、招式、日志和结果类型；
- `battleEngine.ts`：把 `PetState` 转成战斗属性，生成练习对手，并执行回合制 PvE 战斗。

当前战斗使用自有的 `spark` / `focus` / `guard` 属性相克，不使用宝可梦名称、角色、招式或素材。CLI 默认不写 state，传入 `--commit` 才记录战绩和训练 XP；Dashboard 训练战斗会记录战绩和训练 XP。CLI 的 `--move` 和 Dashboard 的招式下拉可以指定宠物开场招式，未解锁招式会被拒绝。训练对手来自原创野怪模板池，不同模板有不同外观、属性、招式池和数值倾向。训练战斗不奖励 Codex XP。

### `dashboard/`

本地 Dashboard 模块：

- `dashboardServer.ts`：只绑定 `127.0.0.1` 的本地 server；
- `dashboardSummary.ts`：把内部 state 和 scan result 转成脱敏 UI summary；
- `dashboardTypes.ts`：Dashboard API 数据类型；
- `dashboardPetAssets.ts`：安全读取本地宠物包，只返回脱敏 manifest 和相对 spritesheet URL；
- `dashboardAssets.ts`：第一版静态 HTML/CSS/JS。

Dashboard 不直接解析 JSONL，不计算 XP，不返回完整 `PetState`，也不暴露 `processedObservations`。宠物资产路由只读取 `assets/pets/<pet-id>` 或 Codex home 下的宠物包，并校验 `spritesheetPath`，避免通过 manifest 读取任意本地文件。

### `types.ts`

集中定义核心数据结构：

- `TokenUsage`
- `TokenObservation`
- `PetState`
- `ProgressionResult`
- `ScanObservationsResult`
- `ScannerWarnings`

## 数据流

`scan` 的流程：

```text
CLI
  -> resolve Codex home
  -> read existing pet state or create in-memory default state
  -> scan session JSONL files
  -> filter already processed observations
  -> apply progression rules
  -> write state unless --dry-run is active
  -> print sanitized summary
```

Dashboard dry-run 的流程：

```text
Browser UI
  -> local dashboard server
  -> shared scan workflow with dryRun=true
  -> return sanitized scan summary
  -> do not write state
```

Dashboard confirm scan 的流程：

```text
Browser UI
  -> local dashboard server with session token
  -> require matching previous dry-run
  -> shared scan workflow with dryRun=false
  -> write state only through petStateStore
  -> return sanitized scan summary
```

Dashboard auto scan 的流程：

```text
Browser UI or dashboard --auto-scan
  -> enable local auto-scan controller
  -> run shared scan workflow with dryRun=false on a timer
  -> serialize with manual scans through the server scan lock
  -> clear stale manual dry-run confirmation tickets after auto writes
  -> expose only sanitized auto-scan status and last summary
```

Dashboard pet animation 的流程：

```text
Browser UI
  -> GET /api/pets
  -> choose a pet id from localStorage or default
  -> GET /pet/<pet-id>/pet.json
  -> local dashboard server validates pet package and spritesheet
  -> return sanitized manifest with /pet/<pet-id>/spritesheet.webp
  -> browser sprite renderer switches rows by UI state
  -> fall back to CSS avatar if package is unavailable
```

Dashboard backup 的流程：

```text
Browser UI
  -> local dashboard server with session token
  -> copy the current state file beside itself
  -> return only state and backup file labels
```

Doctor 诊断的流程：

```text
CLI or Browser UI
  -> diagnostics module
  -> inspect Codex home, sessions dir, state readability, and pet catalog
  -> return sanitized health summary without absolute paths
```

Practice battle 的流程：

```text
CLI or Browser UI
  -> read current pet state or create in-memory default state
  -> derive battle stats and available moves from pet level and skills
  -> optionally use the selected unlocked move as the pet opening action
  -> generate a local practice opponent by difficulty
  -> run a turn-based battle simulation
  -> return outcome, HP, sanitized battle log, and refreshed battle stats when committed
```

`status` 的流程：

```text
CLI
  -> read pet state
  -> print pet summary
```

`status` 不读取 Codex 日志。

## 本地状态文件

默认状态文件：

```text
pet_state.local.json
```

默认状态文件、`pet_state.*.local.json` 这类手工验收状态文件，以及 `backup` 生成的 `pet_state.*.backup-*.local.json` 备份都会被 `.gitignore` 忽略，不应提交到仓库。

状态大致结构：

```json
{
  "schemaVersion": 2,
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
  "economy": {
    "version": "hard-v1",
    "initialImportCompleted": false,
    "dailyXpLedger": {},
    "weeklyXpLedger": {},
    "xpRemainder": 0
  },
  "battle": {
    "totalBattles": 0,
    "wins": 0,
    "losses": 0,
    "draws": 0,
    "currentStreak": 0,
    "bestStreak": 0
  },
  "processedObservations": [],
  "createdAt": "2026-05-07T00:00:00.000Z",
  "updatedAt": "2026-05-07T00:00:00.000Z"
}
```

`processedObservations` 用来避免重复 scan 重复加 XP。当前 observation ID 基于相对 session 路径、行号、timestamp 和 token metadata 生成 hash。

## 隐私边界

这个项目的隐私边界是第一期最重要的约束。

不会持久化：

- prompt
- response
- tool output
- 原始 JSONL 行
- Codex auth token
- 任何凭据
- Codex home 绝对路径

会持久化：

- 宠物等级和 XP
- 已解锁技能
- lifetime token counters
- economy cap ledger
- processed observation IDs
- 创建和更新时间

CLI warning 只打印计数，不打印原始日志内容。CLI 错误输出会对路径做脱敏。

Dashboard 同样只展示汇总统计和脱敏错误，不展示完整 state 内部字段或 session 路径。

## Warning 说明

扫描时可能输出：

```text
Warnings: malformedJsonLines=9, unknownTokenShapes=326, unreadableFiles=0
```

含义：

| warning | 说明 |
| --- | --- |
| `malformedJsonLines` | 有 JSONL 行无法解析，已跳过。 |
| `unknownTokenShapes` | 找到类似 token event，但没有可识别 token counters，已跳过。 |
| `unreadableFiles` | 文件或目录无法读取，已跳过。 |

这些 warning 不会包含原始日志内容。

## 测试

运行全部检查：

```powershell
npm run check
```

只运行测试：

```powershell
npm run test
```

当前测试覆盖：

- Codex home 解析
- JSONL scanner
- malformed JSONL 处理
- `last_token_usage` 和 `total_token_usage` fallback
- `--recent-days` 时间过滤
- hard-v1 公式、daily cap、weekly cap、首次导入、等级和技能解锁
- battle engine 确定性模拟、技能转招式和训练战斗战绩记录
- schema v2 默认状态和 schema v1 迁移
- state 读写和损坏 state 安全失败
- state 备份文件生成和缺失 state 报错
- doctor 诊断摘要、路径脱敏和缺失组件 warning
- dry-run 遇到新 observations 时仍不写状态
- CLI 输出和错误输出的隐私边界
- Dashboard summary 和 API 隐私边界
- Dashboard 宠物 catalog、按 id 加载宠物包和资源路径校验
- Dashboard battle API token 保护、训练战斗 UI 和战绩写入
- Dashboard dry-run 不写 state
- Dashboard confirm scan token 和 matching dry-run 保护
- Dashboard 双语文案、用户说明入口和首次导入字段暴露
- Dashboard auto scan 启停、参数校验、token 保护、脱敏摘要和旧确认失效
- Dashboard backup / doctor API 的 token、脱敏和坏 state 边界

## 当前限制

- `--recent-days` 是最近 `N * 24` 小时，不是自然日。
- `--recent-days` 激活时，缺失或不可解析 timestamp 的事件会被忽略。
- 当前 Dashboard 是本地静态 UI，active pet 会写入本地 state，但还没有服务端宠物装备槽、宠物队伍或多存档。
- 当前没有云同步、PvP、匹配或排行榜系统。
- 当前训练战斗是本地 PvE 模拟，会记录胜/负/平、连胜和少量训练 XP；暂不提供掉落或捕获。
- scanner 依赖当前可识别的 Codex `token_count` usage 结构，未来 Codex 日志结构变化时可能需要适配。
- schema v1 迁移目前是读取时内存迁移；还没有单独的显式迁移命令。

## 推荐下一步

当前 Dashboard、双语说明、Auto Scan、宠物选择、训练战斗、状态备份、doctor 诊断和 Phase 2.1 的 Pathy 动画宠物已经完成自动化测试与浏览器验收。Phase 2.1 的产物包括：

- `spritesheet.webp`
- `pet.json`
- contact sheet
- 预览视频
- validation/review 报告

Dashboard 已接入这些动作：空闲时 `idle`，自动扫描开启但未运行时 `waiting`，扫描中 `running`，扫描失败 `failed`，获得 XP 或升级时 `waving` / `jumping`。

建议下一步优先考虑：

- 设计训练战斗掉落、捕获或战斗后素材奖励；
- 继续扩展本地 PvE 对手、属性和招式池；
- 设计技能在扫描和战斗中的真实数值效果；
- 设计多宠物存档、装备槽或 active pet 写入 state 的规则；
- 添加显式 schema 迁移命令。

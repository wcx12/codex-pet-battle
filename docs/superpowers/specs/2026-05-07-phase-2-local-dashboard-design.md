# Codex Pet Battle Phase 2 本地 Dashboard 设计

## 摘要

Phase 1 已经完成本地 CLI、hard-v1 成长经济、schema v2 状态、dry-run、benchmark 和隐私边界。Phase 2 的目标是把这些能力变成用户能直观看见、能安全操作的本地 Dashboard。

Dashboard 不是营销页，也不是云服务。它应该是一个只绑定本机的产品界面：读取本地 `pet_state.local.json`，展示宠物成长状态，允许用户先 dry-run 再确认 scan，并清楚解释 hard-v1 为什么让首次导入不升级。

## 产品目标

1. 让宠物可见。
   用户打开 Dashboard 后应该立刻看到宠物名称、等级、XP 条、技能和成长状态，而不是先读说明文字。

2. 让 hard-v1 可解释。
   用户需要理解 raw XP、daily capped XP、weekly capped XP、final XP 和首次导入 `profile-only` 的区别。

3. 让扫描操作安全。
   Dashboard 默认鼓励 dry-run。正式写入 state 的 scan 必须有明确确认，避免用户误操作。

4. 保持本地优先和隐私优先。
   Dashboard 不上传数据，不展示 prompt、response、tool output、raw JSONL 或 session path。

5. 为后续宠物表现层铺路。
   第一版 UI 先做好信息架构和操作闭环，之后再加 sprite、动画、技能表现和战斗入口。

## 用户场景

### 场景 A：第一次打开

用户还没有 `pet_state.local.json`。

Dashboard 应展示：

- 默认宠物 `Pathy`
- Level 1
- XP `0/100`
- `initialImportCompleted=false`
- 一个明显的 `Dry run` 操作入口
- 正式 `Scan` 入口处于谨慎状态，需要先完成 dry-run 或二次确认

### 场景 B：首次真实 dry-run

用户点击 dry-run 或命令行启动 dry-run 后，Dashboard 应展示：

- 文件扫描数
- new observations 数量
- hard-v1 经济配置
- raw XP before caps
- daily capped XP
- weekly capped XP
- final XP after import rules
- XP gained
- warnings 计数
- 明确显示 `Import mode: profile-only`

如果这是首次导入，应解释为：本次只建立画像和 ledger，最终 XP 为 0。

### 场景 C：正式导入

用户确认写入后，Dashboard 应：

- 调用现有 scan 管线
- 写入 state
- 展示新的宠物状态
- 显示本次 scan 结果
- 不展示任何原始日志内容

如果首次导入触发 `profile-only`，状态会记录 lifetime stats、processed observations 和 cap ledger，但宠物仍停留在 Level 1。

### 场景 D：日常使用

用户已有 state，之后打开 Dashboard：

- 看到当前宠物等级和 XP 进度
- 看到今天/本周 cap 使用情况
- 可以 dry-run 最近 7 天或 30 天
- 可以确认正式 scan 新增 observations
- 如果解锁新技能，应有清晰但克制的提示

## 信息架构

第一版 Dashboard 由 5 个区域组成。

### 1. 宠物概览

第一屏核心区域，展示：

- 宠物名称
- 等级
- XP progress bar
- XP 数值，例如 `42/100`
- 当前技能列表
- 最近更新时间

没有 sprite 前可以使用简洁的宠物占位形象，但页面应为后续 sprite 留出主视觉位置。

### 2. 成长经济

展示 hard-v1 的关键状态：

- Economy version
- Formula
- Level curve
- Daily cap
- Weekly cap
- Import completed
- XP remainder

同时展示 cap ledger 的汇总，而不是完整 ledger：

- Today capped XP used
- Current week capped XP used
- Remaining weekly XP

Dashboard 不应展示 `processedObservations` 原始列表，因为 observation ID 包含相对 session 路径和 hash。

### 3. Token 画像

展示 lifetime counters：

- total tokens
- input tokens
- cached input tokens
- output tokens
- reasoning output tokens

cached input 应明确显示为 lifetime stats 的一部分，但不作为 XP 来源。

### 4. 扫描控制

操作区域：

- `Dry run` 按钮
- `Scan` 按钮
- recent-days 选择，例如 all / 7 / 30
- 当前 state file 显示为脱敏或 basename
- 扫描中的 loading 状态
- 扫描失败的用户可读错误

正式 `Scan` 必须有二次确认。推荐第一版采用：

- 用户先点击 `Dry run`
- Dashboard 展示预览结果
- 用户再点击 `Confirm scan`

### 5. 最近一次扫描结果

展示最近一次 scan 或 dry-run 的摘要：

- dry-run yes/no
- recent days
- files scanned
- new observations
- raw XP
- daily capped XP
- weekly capped XP
- final XP
- XP gained
- newly unlocked skills
- warning counts

该区域不持久化到 state，刷新后可以为空，除非后续引入单独的本地 UI cache。

## 视觉与交互原则

1. 这是一个工具型 Dashboard，不是 landing page。
   第一屏应直接是宠物和状态，不做营销 hero。

2. 信息要密集但不拥挤。
   token、XP、cap 都是数字信息，应方便扫读和比较。

3. 操作要保守。
   写 state 的操作不能和 dry-run 看起来一样轻。

4. 文案要解释结果，不解释功能。
   例如显示 `Final XP after import rules: 0`，不要在页面塞大段教程。

5. 移动端可用，但桌面优先。
   当前用户主要在本机开发环境运行，桌面宽屏体验优先。

## 本地架构方向

推荐新增一个本地 Dashboard server，而不是让浏览器直接读本地文件。

建议命令：

```powershell
npm run dev -- dashboard
```

默认行为：

- 绑定 `127.0.0.1`
- 自动选择端口或使用默认端口
- 打印本地 URL
- 不打开公网端口
- 复用现有 scanner、state store 和 progression engine

推荐 API：

```text
GET  /api/status
POST /api/scan/dry-run
POST /api/scan/confirm
GET  /api/config
```

所有 API 返回脱敏 JSON summary，不返回 raw observations、session paths、prompt、response 或 raw JSONL。

## 错误处理

Dashboard 应把错误分成用户可处理的几类，而不是暴露底层异常：

| 错误 | UI 行为 |
| --- | --- |
| 没有 state file | 显示默认宠物状态，并提示可以先 dry-run。 |
| state JSON 损坏 | 显示安全失败，不自动覆盖文件。 |
| Codex home 不存在 | 显示脱敏错误，并允许用户调整路径。 |
| Codex home 无权限 | 显示脱敏错误，不展示绝对路径。 |
| scan warning | 只显示 warning counts。 |
| server/API error | 显示用户可读摘要，不展示 stack trace。 |

任何错误都不应输出 prompt、response、tool output、raw JSONL、session path 或绝对 Codex home。

## 安全边界

Dashboard 是本地服务，但仍要防止误写和跨站请求风险。

要求：

- 服务只绑定 `127.0.0.1`
- 禁用宽松 CORS
- 写操作需要一次性 server nonce 或 CSRF token
- `POST /api/scan/confirm` 只能在当前 Dashboard 会话内调用
- 正式 scan 必须要求用户在 UI 中确认
- 错误输出必须路径脱敏

## 数据边界

允许展示：

- 宠物状态
- hard-v1 配置
- lifetime token counters
- cap ledger 汇总
- warning counts
- scan result summary

不允许展示：

- prompt
- response
- tool output
- raw JSONL line
- Codex auth token
- absolute Codex home
- full session path
- processed observation ID 列表

允许读取：

- `pet_state.local.json`
- Codex session JSONL 的 token metadata

允许写入：

- 只有正式 scan 时写入 `pet_state.local.json`

## 状态与 API 数据形状

Dashboard 不需要直接暴露完整 `PetState`。建议定义 UI summary：

```ts
interface DashboardStatus {
  pet: {
    name: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    skills: string[];
  };
  economy: {
    version: string;
    initialImportCompleted: boolean;
    todayXpUsed: number;
    weekXpUsed: number;
    weekXpRemaining: number;
    xpRemainder: number;
  };
  usage: {
    lifetimeInputTokens: number;
    lifetimeCachedInputTokens: number;
    lifetimeOutputTokens: number;
    lifetimeReasoningOutputTokens: number;
    lifetimeTotalTokens: number;
  };
  updatedAt: string;
}
```

Scan result summary 可以复用 CLI 概念：

```ts
interface DashboardScanSummary {
  dryRun: boolean;
  recentDays?: number;
  filesScanned: number;
  newObservations: number;
  economyVersion: string;
  rawXp: number;
  dailyCappedXp: number;
  weeklyCappedXp: number;
  finalXp: number;
  gainedXp: number;
  importApplied: boolean;
  importMode: "none" | "profile-only";
  newlyUnlockedSkills: string[];
  warnings: ScannerWarnings;
  resultingStatus: DashboardStatus;
}
```

## 验收标准

Phase 2 第一版完成时，应满足：

- `dashboard` 命令能启动本地页面。
- 页面能显示当前宠物状态。
- 无 state 时页面能显示默认状态和首次导入提示。
- dry-run 可以从页面触发，且不写 state。
- 正式 scan 需要二次确认。
- scan 后页面能更新状态。
- 页面不展示 prompt、response、tool output、raw JSONL、absolute Codex home 或 session path。
- API 不返回 raw observations 或 processed observation IDs。
- `npm run check` 通过。
- 至少有 API 层测试和一次浏览器视觉/交互验收。

## 非目标

Phase 2 第一版不做：

- 云同步
- 登录账号
- PvP 战斗
- 排行榜
- 宠物养成商店
- 复杂 sprite 动画
- 根据对话内容评价质量
- 上传任何本地日志

## 推荐结论

Phase 2 应先实现一个安全、克制、信息清楚的本地 Dashboard。它的价值不是炫酷，而是让用户第一次看到自己的 Codex Pet，并且相信这个工具不会乱读、乱传、乱写。

一旦 Dashboard 的状态展示和 scan 闭环成立，再进入 Phase 2.1：宠物视觉、XP 动画、技能解锁反馈和更强的日常成长感。

# Codex Pet Battle Phase 2 本地 Dashboard 实施计划

## 目标

本计划用于把 `2026-05-07-phase-2-local-dashboard-design.md` 落成可验证的本地 Dashboard。它应复用现有 CLI 管线，不改变 hard-v1 经济规则，不扩大隐私暴露面。

核心交付：

- 新增 `dashboard` 本地启动命令；
- 启动只绑定 `127.0.0.1` 的本地 server；
- 提供脱敏 status 和 scan API；
- 提供可用的宠物 Dashboard 页面；
- 支持 dry-run 和确认式 scan；
- 补齐 API、隐私和基础 UI 验收。

## 当前仓库基础

Phase 2 开始时，仓库已经具备：

- `scan` / `status` CLI；
- Codex home resolver；
- JSONL scanner；
- hard-v1 `progressionEngine`；
- schema v2 `petStateStore`；
- XP benchmark；
- README 架构和使用手册；
- scanner、progression、state、CLI、benchmark 的自动化测试。

Dashboard 应在这些模块之上封装 UI 和本地 API，而不是复制扫描或 XP 计算逻辑。

## 实施原则

1. 复用现有业务逻辑。
   Dashboard 不重新实现 scanner、progression 或 state 写入。

2. UI summary 与内部 state 分离。
   API 不直接返回完整 `PetState`，避免暴露 processed observation IDs。

3. dry-run first。
   页面默认引导用户先 dry-run，正式写入必须二次确认。

4. 本地 server 最小权限。
   只绑定 localhost，写操作需要会话 token，不开放 CORS。

5. 先做好工具体验，再做宠物表现。
   第一版不追求复杂动画，先把信息和操作闭环做稳。

## 推荐技术方案

考虑当前仓库已经是 TypeScript Node CLI，第一版推荐使用轻量本地 server + 静态前端。

建议新增：

```text
src/dashboard/
  dashboardServer.ts
  dashboardTypes.ts
  dashboardSummary.ts
  static/
    index.html
    app.js
    styles.css
```

优点：

- 不必立刻引入 React/Vite 等前端构建链；
- 能复用现有 `npm run build`；
- 方便测试 API；
- 后续如果 UI 复杂，再迁移到 Vite/React。

如果实施时发现 vanilla 前端变复杂，再切换到 Vite + React；但 Phase 2 第一版不需要提前承担这部分复杂度。

## 模块边界

Dashboard 模块只负责展示、请求编排和本地 HTTP API。

| 模块 | 职责 |
| --- | --- |
| `sessionScanner` | 继续唯一负责读取 Codex JSONL 并提取 token metadata。 |
| `progressionEngine` | 继续唯一负责 XP、cap、等级和技能解锁。 |
| `petStateStore` | 继续唯一负责 state 读写、迁移和去重辅助。 |
| `dashboardSummary` | 把内部 state/progression 转成脱敏 UI summary。 |
| `dashboardServer` | 提供本地页面、API、token 校验和错误脱敏。 |
| `static/*` | 渲染 UI，不解析 JSONL，不计算 XP，不直接读写 state 文件。 |

UI 不应直接暴露或依赖 `processedObservations`、`TokenObservation[]`、session path 或 raw scanner 内部结构。

## 里程碑

### Milestone 1：Dashboard 数据 summary

交付物：

- `dashboardTypes.ts`
- `dashboardSummary.ts`
- 从 `PetState` 生成 `DashboardStatus`
- 从 `ProgressionResult` 和 scanner result 生成 `DashboardScanSummary`
- today/week ledger 汇总函数

验收：

- 不返回 `processedObservations`
- 不返回 `TokenObservation[]`
- 不返回 session path
- 单元测试覆盖：
  - 无 state 默认摘要
  - 已导入 state 摘要
  - today XP used
  - week XP used
  - weekly remaining XP

### Milestone 2：本地 Dashboard server

交付物：

- `dashboardServer.ts`
- CLI 新增命令：

```powershell
npm run dev -- dashboard
```

建议参数：

```powershell
npm run dev -- dashboard --port 4317
npm run dev -- dashboard --state-file .\pet_state.local.json
npm run dev -- dashboard --codex-home C:\Users\you\.codex
```

API：

```text
GET  /api/status
POST /api/scan/dry-run
POST /api/scan/confirm
GET  /api/config
```

验收：

- server 只监听 `127.0.0.1`
- 页面和 API 可访问
- unknown route 返回 404
- unsupported method 返回 405
- JSON parse 错误返回用户可读错误
- 错误信息脱敏

### Milestone 3：写操作保护

交付物：

- server 启动时生成一次性会话 token
- `index.html` 或 `/api/config` 提供 token
- `POST /api/scan/confirm` 要求 token header
- 禁止宽松 CORS
- 正式 scan 需要 dry-run preview 后才能确认，或至少要求显式 confirm payload

建议请求：

```http
POST /api/scan/confirm
X-Codex-Pet-Dashboard-Token: <server-token>
```

请求体：

```json
{
  "recentDays": 30,
  "confirm": true
}
```

验收：

- 没有 token 的写请求失败
- token 错误的写请求失败
- `confirm !== true` 的写请求失败
- dry-run 不写 state
- confirm scan 才写 state

### Milestone 4：静态 Dashboard UI

交付物：

- `index.html`
- `styles.css`
- `app.js`

第一版页面区域：

- 宠物概览
- XP progress bar
- 技能列表
- hard-v1 经济摘要
- lifetime token counters
- scan 控制区
- 最近一次 scan result
- warning counts

交互：

- 加载 status
- recent-days 选择
- dry-run
- confirm scan
- loading 状态
- error 状态
- scan 后刷新 status

验收：

- 无 state 时能显示默认 `Pathy`
- 有 state 时能显示真实状态
- dry-run 结果能显示 raw/capped/final XP
- 首次导入 `profile-only` 的 0 XP 结果清楚可见
- 文本在桌面和移动宽度下不溢出

### Milestone 5：CLI 集成与文档

交付物：

- `cli.ts` 支持 `dashboard`
- README 更新 Dashboard 用法
- Phase 2 spec/plan 根据实际实现补充决策

命令输出示例：

```text
Codex Pet Battle dashboard running at http://127.0.0.1:4317
Press Ctrl+C to stop.
```

验收：

- `npm run dev -- help` 展示 `dashboard`
- `dashboard --dry-run` 之类无效组合会给出用户可读错误
- README 能指导用户启动 Dashboard

### Milestone 6：测试与人工验收

自动测试：

- Dashboard summary 单元测试
- API endpoint 测试
- 写操作 token 测试
- dry-run 不写 state
- confirm scan 写临时 state
- API 输出不含敏感 fixture 字符串
- API 输出不含 `processedObservations`

人工验收：

```powershell
npm run check
npm run dev -- dashboard --state-file .\pet_state.manual.local.json
```

浏览器检查：

- 打开本地 URL
- 查看默认状态
- 执行 dry-run
- 确认 scan
- 刷新页面后状态仍正确

如果使用浏览器自动化，应补充截图或 DOM 断言，确认页面不是空白、按钮可用、状态正确刷新。

## API 细节建议

### `GET /api/status`

返回：

```json
{
  "status": {
    "pet": {
      "name": "Pathy",
      "level": 1,
      "xp": 0,
      "xpToNextLevel": 100,
      "skills": []
    },
    "economy": {
      "version": "hard-v1",
      "initialImportCompleted": false,
      "todayXpUsed": 0,
      "weekXpUsed": 0,
      "weekXpRemaining": 80,
      "xpRemainder": 0
    }
  }
}
```

### `POST /api/scan/dry-run`

请求：

```json
{
  "recentDays": 30
}
```

返回 `DashboardScanSummary`，不写 state。

### `POST /api/scan/confirm`

请求：

```json
{
  "recentDays": 30,
  "confirm": true
}
```

要求 token header。返回写入后的 `DashboardScanSummary`。

### `GET /api/config`

返回：

```json
{
  "writeToken": "<server-token>",
  "defaultRecentDays": 30,
  "economyVersion": "hard-v1"
}
```

如果不希望 token 出现在 JSON 中，也可以把 token 注入 `index.html`，但要避免日志打印。

## 隐私测试清单

必须断言 API 和页面输出不包含：

- fixture 中的敏感字符串
- raw JSONL
- prompt
- response
- tool output
- absolute Codex home
- full session file path
- `processedObservations`
- auth token 或 credential-like 字符串

允许输出：

- warning counts
- token totals
- XP numbers
- basename 级别 state file label

## UI 状态清单

至少覆盖：

- Loading status
- No state
- Imported state
- Dry-run result
- Confirm scan success
- Confirm scan blocked before confirmation
- Scanner warnings
- Missing Codex home
- Corrupted state file
- No new observations
- New skills unlocked

## 决策点

实施前需要确认或默认选择：

1. 第一版是否使用 vanilla static UI。
   推荐：是。

2. Dashboard 默认端口。
   推荐：`4317`，冲突时自动选择下一个可用端口。

3. 是否自动打开浏览器。
   推荐：第一版只打印 URL，不自动打开。

4. 是否允许 Dashboard 直接正式 scan。
   推荐：允许，但必须 dry-run first 或二次确认。

5. 是否显示 state file 路径。
   推荐：只显示 basename 或脱敏路径。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 本地 server 被外部网页诱导写 state | 只绑定 `127.0.0.1`，写操作要求 token 和 confirm。 |
| API 暴露内部 state 细节 | 用 `DashboardStatus` summary，不返回完整 `PetState`。 |
| UI 解释太多变成说明页 | 页面优先显示状态和操作，详细说明放 README。 |
| 首次导入 0 XP 让用户困惑 | scan result 区明确显示 `Import applied: profile-only` 和 final XP。 |
| 引入前端构建链拖慢 Phase 2 | 第一版使用静态 HTML/CSS/JS。 |
| Dashboard 和 CLI 输出逻辑分叉 | 抽出共享 summary/presenter 函数。 |

## 非目标

本计划不做：

- React/Vite 重构
- 云同步
- 账号系统
- PvP
- 排行榜
- 宠物 sprite 动画系统
- 后台常驻 daemon
- 修改 hard-v1 经济数值

## 完成定义

Phase 2 第一版完成时：

- `dashboard` 命令可启动本地页面；
- 页面显示宠物状态、XP、技能、economy、lifetime tokens；
- 页面可触发 dry-run；
- 页面可二次确认正式 scan；
- dry-run 不写 state，confirm scan 写 state；
- API 和页面不泄露隐私边界外内容；
- README 有 Dashboard 使用说明；
- `npm run check` 全部通过；
- 至少完成一次浏览器人工验收。

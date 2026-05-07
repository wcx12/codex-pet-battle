# Codex Pet Battle 第一期 MVP 实施总计划

## 目标

第一期要把现有 MVP 设计落成一个可靠的本地命令行闭环：

1. 扫描本地 Codex 会话日志；
2. 只提取 token 使用事件，不保存任何对话内容；
3. 把新增 token 使用量换算成宠物经验；
4. 持久化一个带版本号的本地宠物状态；
5. 通过 CLI 查看当前宠物进度。

这一期的核心成功标准不是界面好看，而是先做出一个小而稳、可测试、隐私边界清楚的本地内核。后续 UI、云同步和战斗都应该建立在这个内核之上。

## 当前仓库状态

截至 2026-05-07，仓库里只有规划文档：

- `README.md`
- `docs/superpowers/specs/2026-05-06-codex-pet-battle-mvp-design.md`

目前还没有应用代码、测试框架、包管理配置、CLI 入口或 fixture 测试数据。

## 第一期范围

第一期包含：

- 本地 CLI，至少支持 `scan` 和 `status`。
- Codex home 解析：优先 CLI 参数，其次环境变量，最后默认用户目录。
- 递归扫描 `sessions/**/rollout-*.jsonl`。
- 只提取 `token_count` 事件里的 token 使用元数据。
- 计算 XP、等级、总 token 使用量和技能解锁。
- 将本地状态写入 `pet_state.local.json`，并带 `schemaVersion`。
- 记录已处理 observation，避免重复计经验。
- 为 scanner、state store、progression rules 和隐私边界写自动化测试。
- 实现完成后更新 README：安装、使用、隐私说明。

第一期不包含：

- 桌面 UI、浏览器 UI、动画、宠物 sprite、托盘或后台常驻。
- 账号、登录、云同步、远程数据库。
- PvP 战斗、匹配、排行榜、反作弊、签名快照。
- 根据私密对话内容判断代码质量或工作质量。
- 使用 Codex auth token、凭据或修改官方 Codex app 内部机制。
- 安装器、开机自启或打包发布流程。

## 推荐技术形态

仓库可以先搭一个最小 CLI 项目。Node.js + TypeScript 比较合适，因为 JSONL 扫描、CLI、跨平台文件系统处理都直接，而且后续也方便加 UI 或打包。不过第一期应尽量少引依赖。

建议目录结构：

```text
src/
  cli.ts
  codexHomeResolver.ts
  sessionScanner.ts
  progressionEngine.ts
  petStateStore.ts
  types.ts
tests/
  fixtures/
    codex-home-basic/
    codex-home-malformed/
    codex-home-total-delta/
  progressionEngine.test.ts
  petStateStore.test.ts
  sessionScanner.test.ts
  cli.test.ts
```

测试框架可以在实现时确定，但要能覆盖普通单元测试和 CLI 集成测试。

## 核心模块边界

### `codexHomeResolver`

职责：

- 解析 Codex home 路径。
- 优先级：CLI flag > 环境变量 > 平台默认值。
- Windows 默认值：`%USERPROFILE%\.codex`。
- 当 Codex home 不存在或无效时，返回清楚的错误。

不负责：

- 不扫描 session。
- 不创建宠物状态。
- 不理解经验或等级规则。

完成标准：

- 测试覆盖 CLI 覆盖、环境变量覆盖、默认路径解析和缺失 home。

### `sessionScanner`

职责：

- 遍历 `sessions/**/rollout-*.jsonl`。
- 按行增量读取 JSONL。
- 从合法事件里提取 `token_count` observation。
- 优先使用 `last_token_usage` 作为新增活动。
- 如果没有 `last_token_usage` 但有 `total_token_usage`，就在同一 session 内基于上一次 total 计算正向 delta。
- 对 malformed JSONL、未知 token shape、不可读文件输出 warning 计数。
- 只输出脱敏 observation 元数据和 token 计数。

不负责：

- 不返回 prompt、response、tool output、原始 JSONL 行或凭据。
- 不更新宠物状态。
- 不计算 XP。

完成标准：

- fixture 能证明：正常事件可解析、坏行会跳过、total-delta fallback 可用、不可读文件可控处理、敏感内容不会流出。

### `progressionEngine`

职责：

- 把新增 token observation 转换为 XP。
- 更新 lifetime token totals。
- 应用等级曲线，并在升级后保留溢出 XP。
- 按等级解锁技能。

规则：

- 未缓存输入 token：`max(input_tokens - cached_input_tokens, 0)`。
- 未缓存输入：每 1,000 token 给 1 XP。
- 缓存输入：每 5,000 token 给 1 XP。
- 输出：每 250 token 给 1 XP。
- reasoning 输出：每 250 token 给 1 XP。
- 每次 scan 先汇总所有新增 observation 的小数 XP，再向下取整。
- 只要本次 scan 有新的正向活动，至少给 1 XP。
- 下一级所需 XP：`100 + (level - 1) * 50`。
- 技能解锁：
  - Level 2：`token_spark`
  - Level 3：`context_sense`
  - Level 5：`test_shield`
  - Level 8：`refactor_aura`
  - Level 10：`battle_ready`

不负责：

- 不知道文件路径、行号、JSONL 结构或 CLI 参数。

完成标准：

- 测试覆盖 XP 公式、向下取整、最少 1 XP、升级溢出、技能解锁、负/零 delta、cached input clamp。

### `petStateStore`

职责：

- 读取和写入 `pet_state.local.json`。
- 在合适场景创建 schema version 1 的默认状态。
- 记录 processed observation IDs。
- 从 observation 列表中过滤已处理项。
- state 损坏时安全失败。
- 遇到未知或更高 schema version 时安全失败。
- 使用临时文件再替换的方式写入，降低写坏状态文件的风险。

状态隐私规则：

- 只保存 token counters、宠物进度、时间戳和稳定 observation IDs。
- 不保存原始 session 内容。
- 避免在持久化状态里保存绝对 Codex home 路径。

完成标准：

- 测试覆盖默认状态创建、重复 observation 过滤、原子写入路径、损坏 JSON 失败、不支持 schema 失败、`status` 只读。

### `cli`

职责：

- 提供 `scan` 和 `status`。
- 解析 `--codex-home`、`--state-file` 等参数。
- 编排 resolver、scanner、state store 和 progression engine。
- 打印简洁、脱敏、可读的输出。

`scan` 输出应包含：

- 本次获得 XP。
- 当前等级和 XP 进度。
- 本次新解锁技能。
- lifetime token totals。
- 脱敏 warning 汇总。

`status` 输出应包含：

- 宠物名。
- 等级。
- 当前 XP 和下一级所需 XP。
- lifetime token totals。
- 已解锁技能。
- 最后更新时间。

完成标准：

- CLI 集成测试覆盖首次 scan、重复 scan、status 只读、缺失 sessions、损坏 state。

## 实施里程碑

### Milestone 0：项目骨架

交付物：

- 包管理配置和 CLI/test scripts。
- `src/` 与 `tests/` 目录结构。
- `TokenUsage`、`TokenObservation`、`PetState`、`ScanResult`、warning summary 等核心类型。
- 只包含合成数据的初始 fixtures。

验收：

- `test` script 可以运行。
- fixture 里没有真实用户日志。

### Milestone 1：Progression Engine

交付物：

- 纯函数形式的经验/等级计算。
- 技能解锁表。
- XP 与等级单元测试。

验收：

- 已知 token totals 能得到预期 XP、等级和技能。
- 该模块不依赖文件系统或 CLI。

### Milestone 2：State Store

交付物：

- Schema version 1 默认 state。
- 安全读取和写入。
- 重复 observation 过滤。
- 不支持 schema 或损坏 state 的错误处理。

验收：

- 同一批 observation 扫描两次不会重复计 XP。
- 损坏 state 不会被自动覆盖。

### Milestone 3：Session Scanner

交付物：

- 递归发现 rollout JSONL。
- 逐行解析。
- `last_token_usage` 提取。
- `total_token_usage` 正向 delta fallback。
- 脱敏 warning 汇总。

验收：

- Scanner 只返回 observation 元数据和 token counters。
- Scanner 遇到 malformed line 会跳过并继续。
- 隐私测试证明敏感 fixture 字符串不会输出或持久化。

### Milestone 4：CLI 串联

交付物：

- `scan` 命令。
- `status` 命令。
- Codex home 和 state file 参数。
- 可读的脱敏输出。

验收：

- fixture 首次 scan 得到预期 XP。
- fixture 第二次 scan 得到 0 XP。
- 追加一个新 token event 后，只计算新增事件。
- `status` 不修改 state。

### Milestone 5：文档与手工验收

交付物：

- README 安装和使用说明。
- README 隐私说明。
- 手工验证命令或记录。

验收：

- 新贡献者能照 README 跑测试和 fixture scan。
- 隐私边界在 README 里说清楚。

## 自动化测试矩阵

必须覆盖：

- 从 JSONL fixture 解析合法 token events。
- malformed JSONL line 不会导致整个 scan 失败。
- 未知 token event shape 会跳过并计入 warning。
- 有 `last_token_usage` 时优先使用它。
- 缺少 `last_token_usage` 时，用 `total_token_usage` 计算正向 delta。
- 负 delta 或 session counter reset 不计入新增活动。
- 当 `cached_input_tokens > input_tokens` 时，未缓存输入 clamp 到 0。
- 本次 scan 的小数 XP 汇总后向下取整。
- 有新增正向活动时至少给 1 XP。
- Level 2、3、5、8、10 的技能解锁。
- 重复 scan 不重复加 XP。
- `status` 不修改 state。
- 缺失 sessions 目录时优雅处理。
- Codex home 不存在时安全失败。
- state JSON 损坏时安全失败。
- 不支持或未来 schema version 时安全失败。
- 持久化 state 和普通 CLI 输出不包含 prompt、response、tool output、类似 auth token 的字符串、原始 JSONL 或绝对 Codex home 路径。

推荐集成场景：

1. fixture 首次 scan。
2. fixture 重复 scan。
3. fixture 追加一个事件后再 scan。
4. 缺失 sessions 目录。
5. 损坏 state 文件。
6. 只有在开发者明确同意后，才对真实本地 Codex home 做 scan。

## 风险清单

| 风险 | 影响 | 第一期缓解方式 |
| --- | --- | --- |
| state、日志、错误或测试快照泄露隐私 | 高 | 只持久化计数和 observation IDs；不打印原始 JSONL；加入隐私 fixture 测试。 |
| 重复 scan 重复加 XP | 高 | 记录 processed observation IDs；测试重复 scan 和追加事件 scan。 |
| observation ID 不够稳 | 中 | MVP 先用相对路径、行号、时间戳；记录后续 checkpoint 迁移需求。 |
| 损坏 state 被覆盖 | 高 | parse 失败时停止；不自动修复或覆盖；提示备份/移除。 |
| 未来 schema 不兼容 | 中 | 遇到未知或更高 schema version 时安全失败。 |
| 坏 JSONL 行中断整个扫描 | 中 | 跳过坏行并统计 warning。 |
| warning 输出太少导致结果不可信 | 中 | CLI 打印脱敏 warning 计数汇总。 |
| 过早做 UI 导致核心不稳 | 中 | 第一期保持 CLI-only。 |

## 手工验收清单

宣布第一期完成前，需要：

- 跑完所有自动化测试。
- 用 fixture Codex home 跑 `scan`，确认 XP 符合预期。
- 对同一 fixture 再跑一次 `scan`，确认获得 0 XP。
- 追加一个合成 token event，确认只计算新增事件。
- 跑 `status`，确认 state 文件时间戳和内容不变。
- 用缺失 `sessions` 目录的 fixture 跑一遍，确认优雅返回 0 activity。
- 用故意损坏的 state 文件跑一遍，确认不会覆盖原文件。
- 检查 `pet_state.local.json` 和 CLI 输出，确认没有敏感 fixture 字符串。
- 在 fixture 隐私行为确认后，可选地对真实本地 Codex home 做一次 scan。

## 完成定义

第一期完成时应满足：

- `scan` 能从 Codex token usage events 更新本地宠物状态。
- 没有新 observation 时，重复 `scan` 不会增加 XP。
- `status` 能展示进度，并且不会修改 state。
- state 是本地的、带 schema version 的。
- 不持久化、不打印对话内容、原始 JSONL、auth token 或凭据。
- 自动化测试覆盖 scanner、progression、state storage、CLI 集成和隐私 fixtures。
- README 解释了安装、使用和隐私边界。

## 推荐下一步

从 Milestone 0 开始，先确定实现技术栈。最小的第一批改动应该只包含 CLI/test 项目骨架、共享类型和合成 fixtures，不急着一次性实现完整 scanner。

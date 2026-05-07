# Codex Pet Battle

Codex Pet Battle 是一个给 Codex Pets 做的本地 RPG 养成实验项目。

长期目标是把 Codex 使用过程变成一个小型成长循环：

- 宠物从 Codex 活动和 token 使用量中获得经验；
- 升级后解锁形态、特质和技能；
- 之后可以把本地宠物同步到账户；
- 未来两个用户可以让自己的 Codex 宠物进行战斗。

当前仓库实现的是第一期 MVP：一个本地 CLI。它读取本机 Codex session 日志，只提取 token 使用统计，把新增 token 使用量换算成宠物经验，并写入本地 `pet_state.local.json`。

## 当前状态

已经完成：

- 本地 CLI：`scan` 和 `status`
- Codex home 自动解析与手动覆盖
- 扫描 `sessions/**/rollout-*.jsonl`
- 提取 `token_count` 的 token usage metadata
- XP、等级、技能解锁、lifetime token totals
- 本地状态文件 `pet_state.local.json`
- 已处理 observation 去重，避免重复 scan 重复加 XP
- `scan --dry-run`，预览但不写状态
- `scan --recent-days <days>`，只统计最近 N 天
- 自动化测试覆盖 scanner、progression、state store、CLI 和隐私边界

暂未实现：

- UI、动画、宠物 sprite
- 账号、云同步、远程数据库
- PvP 战斗、匹配、排行榜、反作弊
- 首次导入 XP 上限
- 最终版经验曲线校准

## 快速开始

安装依赖：

```powershell
npm install
```

运行完整检查：

```powershell
npm run check
```

`npm run check` 会先运行 TypeScript build，再运行 Vitest 测试。

常用项目脚本：

| 脚本 | 说明 |
| --- | --- |
| `npm run dev -- ...` | 用 `tsx` 直接运行开发版 CLI。 |
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

`status` 不接受 `--codex-home`、`--dry-run` 或 `--recent-days`，因为它不读取 Codex 日志。

### 帮助

```powershell
npm run dev -- help
```

### 参数说明

| 参数 | 适用命令 | 说明 |
| --- | --- | --- |
| `--codex-home <path>` | `scan` | 指定 Codex home。默认使用用户目录下的 `.codex`。 |
| `--state-file <path>` | `scan`, `status` | 指定本地宠物状态文件。默认是当前目录的 `pet_state.local.json`。 |
| `--dry-run` | `scan` | 只预览结果，不创建、不写入、不修改状态文件。 |
| `--recent-days <days>` | `scan` | 只统计最近 `days * 24` 小时内的 token observation。 |

也可以通过环境变量指定 Codex home：

```powershell
$env:CODEX_PET_BATTLE_CODEX_HOME = "C:\Users\you\.codex"
npm run dev -- scan --dry-run
```

## 手工验收流程

先用 fixture 数据验证：

```powershell
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json --dry-run
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json
npm run dev -- scan --codex-home tests\fixtures\codex-home-basic --state-file .\tmp.pet_state.local.json
npm run dev -- status --state-file .\tmp.pet_state.local.json
```

预期行为：

- dry-run 会打印预计 XP，但不会创建或修改状态文件；
- 第一次正式 scan 会写入状态并获得 XP；
- 第二次正式 scan 对同一批 observations 应获得 0 XP；
- `status` 只读状态，不扫描日志。

确认 fixture 行为正常后，再对真实 Codex home 做 dry-run：

```powershell
npm run dev -- scan --dry-run --recent-days 30
```

只有当 dry-run 输出看起来合理时，再考虑正式 scan。

注意：当前经验曲线还未最终校准。真实历史日志可能让宠物一次性升很多级，所以在完成 XP cap 或经验公式校准前，不建议直接对完整历史运行正式 scan。

## 架构总览

当前 MVP 由 5 个核心模块组成：

```text
src/
  cli.ts
  codexHomeResolver.ts
  sessionScanner.ts
  progressionEngine.ts
  petStateStore.ts
  types.ts
```

### `cli.ts`

CLI 入口，负责：

- 解析命令和参数；
- 执行 `scan` / `status`；
- 编排 resolver、scanner、state store、progression engine；
- 打印用户可读且脱敏的输出；
- 在 `--dry-run` 下保证不写状态。

### `codexHomeResolver.ts`

负责解析 Codex home：

1. 优先使用 `--codex-home`；
2. 其次使用 `CODEX_PET_BATTLE_CODEX_HOME`；
3. 最后使用平台默认路径。

Windows 默认路径是：

```text
%USERPROFILE%\.codex
```

### `sessionScanner.ts`

负责扫描 Codex session 日志：

- 遍历 `sessions/**/rollout-*.jsonl`；
- 按行读取 JSONL；
- 查找 `token_count` 事件；
- 优先使用 `last_token_usage`；
- 如果缺少 `last_token_usage`，用同一文件内的 `total_token_usage` 计算正向 delta；
- 生成脱敏 `TokenObservation`；
- 统计 warning 数量。

scanner 不会返回 prompt、response、tool output、原始 JSONL 行或凭据。

### `progressionEngine.ts`

负责游戏规则：

- 把 token usage 换算成 XP；
- 应用等级曲线；
- 处理升级后溢出 XP；
- 解锁技能；
- 累加 lifetime token totals。

当前技能解锁：

| 等级 | 技能 |
| --- | --- |
| 2 | `token_spark` |
| 3 | `context_sense` |
| 5 | `test_shield` |
| 8 | `refactor_aura` |
| 10 | `battle_ready` |

当前 XP 规则仍是 MVP 版本，后续会继续校准。

### `petStateStore.ts`

负责本地状态：

- 创建默认宠物状态；
- 读取 `pet_state.local.json`；
- 原子写入状态文件；
- 过滤已处理 observations；
- 遇到损坏 JSON 或不支持的 schema version 时安全失败。

状态文件损坏时不会自动覆盖，用户需要先备份或移除旧文件。

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

它被 `.gitignore` 忽略，不应提交到仓库。

状态大致结构：

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
  "createdAt": "2026-05-07T00:00:00.000Z",
  "updatedAt": "2026-05-07T00:00:00.000Z"
}
```

`processedObservations` 用来避免重复 scan 重复加 XP。当前 observation ID 基于相对 session 路径、行号、timestamp 和 token metadata 生成 hash。

## 隐私边界

这个项目的隐私边界是第一期最重要的约束。

不会持久化：

- prompt；
- response；
- tool output；
- 原始 JSONL 行；
- Codex auth token；
- 任何凭据。

会持久化：

- 宠物等级和 XP；
- 已解锁技能；
- lifetime token counters；
- processed observation IDs；
- 创建和更新时间。

CLI warning 只打印计数，不打印原始日志内容。

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

- Codex home 解析；
- JSONL scanner；
- malformed JSONL 处理；
- `last_token_usage` 和 `total_token_usage` fallback；
- `--recent-days` 时间过滤；
- XP、等级、技能解锁；
- state 读写和损坏 state 安全失败；
- dry-run 不写状态；
- CLI 输出不泄露 fixture 中的敏感字符串。

## 当前限制

- 经验曲线仍然偏粗糙，真实历史日志可能导致等级膨胀。
- `--recent-days` 是最近 `N * 24` 小时，不是自然日。
- `--recent-days` 激活时，缺失或不可解析 timestamp 的事件会被忽略。
- 当前没有 XP cap 或首次导入上限。
- 当前没有 UI，只有 CLI。
- 当前没有云同步或战斗系统。
- scanner 依赖当前可识别的 Codex `token_count` usage 结构，未来 Codex 日志结构变化时可能需要适配。
- 当前状态 schema 是 v1，还没有迁移命令；遇到不支持的 schema version 会安全失败。

## 推荐下一步

下一步建议先做经验校准，而不是 UI：

1. 增加 XP benchmark 脚本，比较 7 天、30 天、全部历史在不同公式下的等级结果；
2. 重新校准 cached input、output、reasoning output 的 XP 权重；
3. 增加 `--xp-cap` 或首次导入上限；
4. 再用真实 Codex home 做 dry-run 对比；
5. 当成长曲线合理后，再进入 Phase 2 UI。

当前最安全的真实验证命令是：

```powershell
npm run dev -- scan --dry-run --recent-days 30
```

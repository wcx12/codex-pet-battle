# Codex Pet Battle 困难成长经济实施计划

## 目标

本计划用于把 `2026-05-07-hard-progression-economy-design.md` 落成可验证的 Phase 1.1 工作。实现前先完成 benchmark 和设计确认，再改正式 progression 规则。

核心目标：

- 让升级变难；
- 防止历史导入直接满级；
- 保持 lifetime stats 完整；
- 让 cap、curve 和公式可解释、可测试、可回滚；
- 不扩大隐私暴露面。

## 实施原则

1. 先 benchmark，后改正式公式。
   不直接拍脑袋改 `progressionEngine`。

2. 先并行比较多套经济规则。
   当前 MVP 公式保留为 baseline，用 benchmark 证明新公式更合理。

3. cap 只影响 XP，不影响 lifetime token counters。
   用户真实活动统计必须完整保留。

4. dry-run first。
   所有新经济规则先能在 dry-run/benchmark 中解释清楚，再进入正式 scan。

5. 隐私边界不变。
   benchmark 和 scan 输出只允许派生统计，不允许 session path、prompt、response、tool output 或 raw JSONL。

## 里程碑

### Milestone 1：经济模型抽象

交付物：

- 新增经济模型类型，例如：
  - `EconomyFormula`
  - `LevelCurve`
  - `DailyCapStrategy`
  - `ImportCapStrategy`
  - `EconomySimulationResult`
- 将当前 MVP XP 公式封装成 baseline formula。
- 将当前等级曲线封装成 baseline curve。

建议文件：

```text
src/economy/
  formulas.ts
  levelCurves.ts
  caps.ts
  simulateEconomy.ts
```

验收：

- 当前 `progressionEngine` 行为可通过 baseline formula/curve 重现。
- 不改变现有 `scan` 行为。
- 现有测试全部通过。

### Milestone 2：XP Benchmark 脚本

交付物：

- 新增脚本：

```text
scripts/benchmark_xp.ts
```

- 新增 npm script：

```json
"benchmark:xp": "tsx scripts/benchmark_xp.ts"
```

支持参数：

```powershell
npm run benchmark:xp -- --recent-days 7
npm run benchmark:xp -- --recent-days 30
npm run benchmark:xp -- --all
npm run benchmark:xp -- --codex-home C:\Users\you\.codex
```

输出内容：

- formula 名称；
- curve 名称；
- cap 策略；
- observation 数；
- token totals；
- raw XP；
- capped XP；
- resulting level；
- XP to next level；
- warning counts。

验收：

- benchmark 不写 `pet_state.local.json`。
- benchmark 输出不包含 raw JSONL、prompt、response、tool output、auth token 或绝对 Codex home。
- 可以同时比较至少 3 套公式和 2 套等级曲线。

### Milestone 3：候选公式与曲线

交付物：

- 实现候选公式：
  - baseline MVP formula；
  - low linear formula；
  - output-focused formula；
  - sqrt compression formula；
  - log compression formula。
- 实现候选等级曲线：
  - baseline linear curve；
  - hard quadratic curve；
  - milestone table curve。
- 实现 daily soft cap 候选：
  - no cap；
  - moderate daily soft cap；
  - hard daily soft cap。

验收：

- 每套公式、curve、cap 都有单元测试。
- benchmark 可以输出每套组合的结果。
- 对同一 synthetic fixture，结果稳定可断言。

### Milestone 4：真实数据校准报告

交付物：

- 新增一份本地不提交的校准输出，或一份手写 markdown 总结。
- 对以下窗口跑 benchmark：
  - 7 天；
  - 30 天；
  - all history。

建议总结文档路径：

```text
docs/superpowers/reviews/YYYY-MM-DD-xp-benchmark-summary.md
```

注意：总结只能包含汇总统计，不包含 session path 或日志内容。

验收：

- 至少列出 3 套候选组合的结果。
- 明确推荐一套 Phase 1.1 公式、curve 和 cap。
- 结果符合困难升级目标，尤其是 30 天不应接近 Level 10。

### Milestone 5：正式 Progression 切换

前置条件：

- 用户审过 benchmark summary；
- 选定公式、curve、cap；
- 明确首次导入策略。

交付物：

- 更新 `progressionEngine` 使用选定经济规则。
- 如果引入 import cap，需要更新 CLI 输出：

```text
Raw XP before cap: 704193
Import cap applied: 20
XP gained: 20
```

- 如果引入 daily cap，需要输出 cap summary：

```text
Daily cap applied: hard
Raw XP: 180
Capped XP: 12
```

验收：

- `scan --dry-run --recent-days 30` 结果符合目标区间。
- 首次正式 scan 不会让宠物越过大量等级。
- lifetime stats 不因 cap 丢失。
- 重复 scan 仍不重复加 XP。
- 所有现有隐私测试继续通过。

### Milestone 5.5：State Schema v2 与 Cap Ledger

前置条件：

- 决定启用 daily 或 weekly cap。

交付物：

- 新增 schema v2，记录 economy metadata：

```json
{
  "economy": {
    "version": "hard-v1",
    "initialImportCompleted": false,
    "dailyXpLedger": {},
    "weeklyXpLedger": {},
    "xpRemainder": 0
  }
}
```

- v1 -> v2 迁移策略。
- 同一天/同一周多次 scan 不能绕过 cap。
- `profile-only` 首次导入也要标记 processed observations 和 `initialImportCompleted`。

验收：

- v1 state 可安全迁移或给出明确错误。
- daily ledger 只记录日期和 XP，不记录 session 内容。
- weekly ledger 只记录周 bucket 和 XP，不记录 session 内容。
- 重复 scan 不重复加 XP，也不重复消耗 cap。

### Milestone 6：文档更新

交付物：

- README 更新：
  - 新经济规则；
  - benchmark 用法；
  - import cap 行为；
  - daily cap 行为；
  - 为什么升级困难。
- spec/plan 根据最终选择补充决策记录。

验收：

- 新用户能理解为什么 token 很多但 XP 不多。
- dry-run 输出和 README 术语一致。

## 推荐默认候选

在 benchmark 前，建议先实现这些候选组合：

### Candidate 0：MVP Baseline

- 当前 XP 公式；
- 当前线性等级曲线；
- no cap。

用途：证明当前膨胀问题。

### Candidate 1：Hard Linear

- uncached input / 100000；
- cached input / 1000000；
- output / 20000；
- reasoning output / 20000；
- hard quadratic curve；
- hard daily soft cap。

用途：保守、易解释。

### Candidate 2：Output Focused

- uncached input / 250000；
- cached input = 0 XP；
- output / 12000；
- reasoning output / 12000；
- milestone table curve；
- hard daily soft cap。

用途：奖励主动产出，强压制长上下文。

### Candidate 3：Sqrt Compression

- weighted token points；
- sqrt compression；
- hard quadratic curve；
- moderate daily soft cap。

用途：给重度使用保留边际收益，但强压缩历史体量。

### Candidate 4：Log Compression

- weighted token points；
- log2 compression；
- milestone table curve；
- moderate daily soft cap。

用途：最强压缩，适合历史导入。

## 关键测试场景

必须覆盖：

- baseline 行为不被经济抽象误改；
- MVP 的 minimum 1 XP/scan 不应进入 hard economy；
- formula 对 known token usage 输出稳定；
- level curve 对 level 1-10 输出稳定；
- daily cap 对同一天多 observation 生效；
- 不同日期分别应用 daily cap；
- weekly cap 对连续多天极端活动生效；
- import cap 只限制 XP，不影响 lifetime totals；
- profile-only import 不给 XP，但记录 lifetime stats 和 processed observations；
- dry-run 不写 state；
- benchmark 不写 state；
- benchmark 输出不含敏感 fixture 字符串；
- repeated scan 仍然不重复加 XP；
- corrupt state 仍安全失败；
- `--recent-days` 与 cap 同时启用时结果稳定。

## CLI 输出要求

所有新输出必须满足：

- 解释 raw XP 和 capped XP 的区别；
- 解释是否应用 import cap；
- 解释是否应用 daily cap；
- 继续输出 warning counts；
- 不输出 session path；
- 不输出 raw JSONL；
- 不输出 prompt、response、tool output 或凭据。

示例：

```text
Dry run complete
Dry run: yes
Recent days: 30
Formula: output-focused
Level curve: milestone
Daily cap: hard
Import cap: 20
Raw XP before caps: 704193
Capped XP: 20
XP gained: 20
Lifetime tokens: 2486244578
Warnings: malformedJsonLines=9, unknownTokenShapes=326, unreadableFiles=0
```

## 决策点

实现 benchmark 后，需要用户审查并确认：

1. 30 天目标等级是否应为 Level 1-2、2-3，还是 3-5。
2. 首次导入默认是给少量 XP，还是 profile-only。
3. cached input 是否完全不给 XP。
4. Level 10 是否应设为 12 个月以上目标。
5. 是否需要周 cap 或只需要 daily soft cap。

这些决策确认后再改正式 `progressionEngine`。

当前产品偏好是“升级应该困难”。因此实现 benchmark 后，计划默认优先评估 `profile-only` 首次导入，再评估 `import cap = 20` 或 `25`。只有当 profile-only 反馈过冷时，才考虑给少量导入 XP。

## 风险

| 风险 | 缓解 |
| --- | --- |
| 公式太硬，用户长期没有反馈 | 增加非升级反馈，例如 mood、streak、cosmetic progress，但不放松 level。 |
| 公式太软，历史导入仍膨胀 | import cap 和 log/sqrt 压缩兜底。 |
| cap 让用户觉得 token 被浪费 | lifetime stats 完整记录，并在输出中解释 cap 只影响 XP。 |
| benchmark 泄露隐私 | 只输出汇总统计，不输出路径或 raw log。 |
| 经济规则改动导致旧 state 重复计 XP | 不改 processed observation 去重语义；如需 schema 变化，先设计迁移。 |

## 非目标

本计划不做：

- UI；
- 宠物 sprite；
- 云同步；
- PvP；
- anti-cheat；
- 状态迁移命令；
- 真实账号系统。

## 完成定义

Phase 1.1 经济校准完成时：

- benchmark 可比较多套公式、curve、cap；
- 有真实 dry-run 汇总结果；
- 用户已确认选定经济规则；
- 正式 progression 已切换到选定规则；
- 首次导入不会直接越过大量等级；
- 所有测试通过；
- README 解释新经济规则。

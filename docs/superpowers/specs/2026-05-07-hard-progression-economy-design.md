# Codex Pet Battle 困难成长经济设计

## 摘要

Codex Pet Battle 的成长系统应从“轻奖励型”调整为“长期稀缺成长型”。升级应该让用户感到珍贵，而不是因为一次历史日志导入或几天高强度使用就快速满级。

第一期已经证明本地扫描、去重、dry-run、recent-days 和隐私边界可以工作。下一步要解决的是成长经济：如何把大体量 Codex token 活动压缩成缓慢、可持续、可解释的宠物成长。

## 产品原则

1. 升级要困难。
   Level 2 也应该有门槛。Level 10 的 `battle_ready` 应该是长期里程碑，而不是一次历史 scan 的自然结果。

2. lifetime stats 和 XP 分离。
   lifetime token counters 可以完整记录真实活动量，但可获得 XP 必须经过 cap、压缩和衰减。

3. 奖励主动产出，弱化被动上下文。
   Cached input 很容易被长上下文放大，不应该主导成长。Output 和 reasoning output 更接近实际产出，应占更高权重。

4. 首次导入要克制。
   历史导入主要用于建立宠物档案和 lifetime stats，不应该让宠物直接跨过大量等级。

5. 日常成长要稳定。
   每日或每周有 soft cap，让重度用户仍有收益，但收益递减，避免一天冲很多级。

6. 隐私优先。
   经济系统只能使用 token counters、timestamps、observation IDs 等派生元数据，不使用 prompt、response、tool output 或原始 JSONL。

## 成长目标

以下目标是 Phase 1.1 的校准基准，不是最终永久数值。

| 使用尺度 | 目标等级/经验感受 |
| --- | --- |
| 首次 dry-run | 看到预估结果，但不建议直接导入全部历史 XP。 |
| 首次正式导入 | 默认不升级，主要建立档案和 lifetime stats。 |
| 正常使用 7 天 | 大多数用户仍在 Level 1。 |
| 正常使用 30 天 | 活跃用户大约 Level 2，极重度用户最多接近 Level 3。 |
| Level 5 | 季度级目标。 |
| Level 10 | 12 个月以上长期里程碑。 |

## 当前问题

当前 MVP XP 公式：

- 未缓存 input：每 1,000 token 给 1 XP
- cached input：每 5,000 token 给 1 XP
- output：每 250 token 给 1 XP
- reasoning output：每 250 token 给 1 XP
- level curve：`100 + (level - 1) * 50`

真实 dry-run 暴露出明显膨胀：

- 全历史 dry-run 会到非常高等级。
- `--recent-days 30` 仍可达到远高于 Level 10 的结果。

这说明当前公式适合验证管线，不适合作为长期游戏经济。

## 推荐经济模型

Phase 1.1 建议采用三层控制：

1. Raw XP
   先根据 token usage 计算基础 XP。

2. Daily Soft Cap
   按自然日或 UTC 日对 XP 应用递减收益。

3. Import Cap
   首次导入或历史导入再应用单次上限。

最终获得 XP：

```text
earnedXp = min(importCapIfApplicable, sum(dailySoftCappedXp))
```

lifetime token counters 不受 cap 影响，始终完整累加。

## Raw XP 方向

候选公式应在 benchmark 中比较，不在此 spec 中直接定死。

### 候选 A：极低线性权重

```text
uncached_input_xp = uncached_input_tokens / 100000
cached_input_xp = cached_input_tokens / 1000000
output_xp = output_tokens / 20000
reasoning_xp = reasoning_output_tokens / 20000
```

特点：

- 容易解释；
- 比当前公式低两个数量级以上；
- 仍可能被重度历史数据推高，需要 cap。

### 候选 B：输出主导

```text
uncached_input_xp = uncached_input_tokens / 250000
cached_input_xp = 0
output_xp = output_tokens / 12000
reasoning_xp = reasoning_output_tokens / 12000
```

特点：

- cached input 不给 XP，只记 lifetime；
- 更强调模型产出和推理活动；
- 适合“主动产出才成长”的产品叙事。

### 候选 C：平方根压缩

```text
raw_points = weighted_token_points
raw_xp = sqrt(raw_points / scale)
```

特点：

- 对超大 token 量天然压缩；
- 对小活动仍有反馈；
- 解释成本略高。

### 候选 D：对数压缩

```text
raw_xp = log2(1 + weighted_token_points / scale)
```

特点：

- 对历史导入非常稳；
- 大活动的边际收益强递减；
- 需要更细 benchmark 才能找到舒服的 scale。

## Daily Soft Cap

建议先 benchmark 以下 cap 策略：

### Soft Cap 方案 1：阶梯递减

```text
0-5 XP/day: 100%
5-15 XP/day: 50%
15-30 XP/day: 20%
30+ XP/day: 0%
```

### Soft Cap 方案 2：更硬核

```text
0-6 XP/day: 100%
6-20 XP/day: 35%
20-60 XP/day: 10%
60+ XP/day: 0%
```

该方案单日理论上限约为 14.9 XP。

### Soft Cap 方案 3：周 cap

```text
max 80 XP/week
```

周 cap 用来防止连续极端工作日冲穿等级曲线。正式实现时如果引入 daily/week cap，state 必须记录 cap ledger，否则用户可以通过多次 scan 绕过 cap。

## Import Cap

首次导入必须单独限制。

建议候选：

| 策略 | 说明 |
| --- | --- |
| `--import-cap 20` | 首次导入最多 20 XP。 |
| `--import-cap 25` | 首次导入最多 25 XP。 |
| `--import-mode profile-only` | 只记录 lifetime stats，不给 XP。 |

推荐默认策略：

```text
首次真实 scan 如果没有现有 state，默认 import mode = profile-only 或 import cap <= 20 XP
```

如果用户确认升级应非常困难，则更推荐默认 `profile-only`：首次导入只建立 lifetime stats、cap ledger 和 processed observations，不给 XP；用户之后从日常新增活动开始慢慢升级。

如果选择少量导入 XP，也必须在 CLI 输出中明确说明：

```text
Import cap applied: 20 XP
Raw XP before cap: 704193
XP gained: 20
```

dry-run 应展示 cap 前后结果，让用户知道发生了什么。

## Level Curve

当前线性曲线太平：

```text
100 + (level - 1) * 50
```

建议 benchmark 以下候选：

### Curve A：二次曲线

```text
xpToNext = 100 + 75 * (level - 1) + 25 * (level - 1)^2
```

### Curve B：更硬二次曲线

```text
xpToNext = 150 + 100 * (level - 1) + 50 * (level - 1)^2
```

### Curve C：里程碑曲线

```text
Level 1 -> 2: 100 XP
Level 2 -> 3: 180 XP
Level 3 -> 4: 260 XP
Level 4 -> 5: 380 XP
Level 5 -> 6: 520 XP
Level 6 -> 7: 700 XP
Level 7 -> 8: 900 XP
Level 8 -> 9: 1150 XP
Level 9 -> 10: 1450 XP
```

推荐先 benchmark Curve B 和 Curve C。

Curve C 到 Level 10 总计约 5,640 XP。配合每日/每周 cap 后，Level 10 应成为 12 个月以上目标。

## Skill Unlock 节奏

当前技能解锁保持不变，但含义变得更稀有：

| Level | Skill | 设计含义 |
| --- | --- | --- |
| 2 | `token_spark` | 第一次明确成长。 |
| 3 | `context_sense` | 已建立稳定使用习惯。 |
| 5 | `test_shield` | 中期成就，不应轻易达到。 |
| 8 | `refactor_aura` | 长期投入成就。 |
| 10 | `battle_ready` | 战斗资格，应该稀有。 |

## CLI 设计方向

新增 benchmark 前，正式 scan 仍应默认谨慎：

```powershell
npm run dev -- scan --dry-run --recent-days 30
```

未来建议命令：

```powershell
npm run benchmark:xp -- --recent-days 7
npm run benchmark:xp -- --recent-days 30
npm run benchmark:xp -- --all
```

未来 scan 参数：

```powershell
npm run dev -- scan --import-cap 20
npm run dev -- scan --import-mode profile-only
npm run dev -- scan --daily-cap hard
```

具体参数名可在实现计划阶段定稿。

## State Schema 方向

如果正式引入 cap，schema v1 不够表达“已消耗的每日/每周 XP 上限”。Phase 1.1 很可能需要 schema v2。

建议新增：

```json
{
  "schemaVersion": 2,
  "economy": {
    "version": "hard-v1",
    "initialImportCompleted": false,
    "dailyXpLedger": {},
    "weeklyXpLedger": {},
    "xpRemainder": 0
  }
}
```

`dailyXpLedger` 和 `weeklyXpLedger` 只记录日期 bucket 和已获得 XP，不记录 session 内容。

没有 ledger 时，同一天重复 scan 可能绕过 daily cap，这是正式实现必须避免的。

## Minimum XP 规则

当前 MVP 有“只要本次 scan 有新活动，至少给 1 XP”的规则。困难成长经济中应取消该规则，或只在极小的新手任务中使用。

原因：

- 用户可以通过频繁 scan 刷最低 XP；
- 微小活动不应稳定产出升级进度；
- daily cap 需要按真实 raw XP 聚合，而不是按 scan 次数聚合。

## Benchmark 要求

benchmark 必须输出：

- 时间窗口；
- observation 数；
- lifetime token totals；
- raw XP；
- capped XP；
- 最终 level；
- XP to next level；
- 每日 XP 分布；
- cap 前后差异；
- 使用的 formula 和 curve 名称。

输出不得包含：

- session path；
- raw JSONL；
- prompt；
- response；
- tool output；
- auth token；
- credential-like 字符串。

## 验收标准

Phase 1.1 经济校准完成时，应满足：

- 真实 30 天 dry-run 不会超过目标等级区间，除非用户显式选择 no-cap benchmark。
- 首次正式 scan 默认不会让宠物越过大量等级。
- lifetime token counters 仍完整保留。
- cap 前后结果在 CLI 中可解释。
- 所有 cap 和 curve 都有测试覆盖。
- 隐私测试继续通过。

## 非目标

本 spec 不处理：

- UI；
- 云同步；
- PvP；
- anti-cheat；
- sprite 或动画；
- 根据对话内容判断工作质量；
- 上传任何本地 Codex 日志。

## 推荐结论

先不要直接改 `progressionEngine` 的正式公式。下一步应先实现 XP benchmark，对真实本地数据比较多套公式、cap 和等级曲线。确认 7 天、30 天和全历史导入的结果都符合“升级困难”目标后，再把选定规则落入正式 progression。

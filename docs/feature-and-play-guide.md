# Codex Pet Battle 功能与游玩指南

Codex Pet Battle 是一个本地运行的宠物养成原型。它把你日常使用 Codex 产生的本地 token 统计，转化为宠物经验、等级、技能解锁和训练战斗记录。当前版本的重点不是联网竞技，而是一个安全、可解释、可回退的本地养成循环。

你可以把它想成：Codex 是你的冒险日志，Pathy 是跟着你一起成长的伙伴。你写代码、调试、重构、跑测试，Pathy 会从这些真实活动里慢慢获得经验；当等级提高后，它会解锁新的战斗招式，并在 Dashboard 里用动画反馈当前状态。

## 当前已完成功能

### 1. 本地宠物养成

当前默认宠物是 `Pathy`。它拥有等级、当前 XP、下一级所需 XP、已解锁技能、累计 token 统计和训练战绩。

XP 来自本机 Codex session 日志中的 token usage metadata。系统只读取和保存 token 统计，不保存 prompt、response、tool output 或原始对话内容。换句话说，宠物知道你“冒险了多久、产出了多少”，但不知道你具体和 Codex 说了什么。

等级曲线使用 `hard-v1` 规则：前期能比较快看到成长，后期升级会明显变慢。第一次正式导入使用 `profile-only` 模式，只建立历史画像、去重信息和 cap ledger，不会立刻给大量历史 XP，避免宠物因为一次导入直接暴涨。

### 2. 技能解锁

技能按等级自动解锁，并会显示在 Dashboard 的技能区域。当前技能线如下：

| 等级 | 技能 | 游戏含义 | 当前用途 |
| --- | --- | --- | --- |
| Level 2 | `token_spark` / Token Spark | Pathy 开始对新 XP 有更明显反应 | 解锁战斗招式 Token Spark |
| Level 3 | `context_sense` / Context Sense | Pathy 更会感知扫描窗口和导入状态 | 解锁战斗招式 Context Read |
| Level 5 | `test_shield` / Test Shield | 代表更稳定的本地验证能力 | 解锁防御招式 Test Shield |
| Level 8 | `refactor_aura` / Refactor Aura | 代表持续重构和打磨后的气场 | 解锁高阶招式 Refactor Aura |
| Level 10 | `battle_ready` / Battle Ready | 第一阶段毕业，准备进入更完整的战斗系统 | 解锁招式 Battle Burst |

这些技能目前已经会影响训练战斗中的可用招式。等级越高，Pathy 的招式池越完整，战斗表现也更有层次。

### 3. 本地训练战斗

Dashboard 和 CLI 都支持本地 PvE 训练战斗。难度有 `easy`、`normal`、`hard` 三档。你也可以在战斗前选择一个已解锁招式作为开场动作；未解锁招式会被拒绝。

训练战斗会根据宠物等级和已解锁技能生成：

- Pathy 的 HP、攻击、防御、速度；
- 可用招式池；
- 玩家选择的开场招式；
- 从原创野怪模板池中按难度和 seed 选择的对手、属性和招式；
- 双方 HP 条和战斗状态；
- 逐回合播放的宠物站位、出招、不同招式特效、命中、落空、防守、受击和 HP 变化；
- 招式图鉴与未解锁招式等级；
- 回合制战斗日志；
- 胜、负、平、当前连胜、最佳连胜等本地战绩。

当前战斗属性是项目自有的 `spark`、`focus`、`guard`，不是任何现有商业 IP 的属性、角色或招式。Pathy 初始可用 `Quick Ping`，随后会随着技能解锁获得 `Token Spark`、`Context Read`、`Test Shield`、`Refactor Aura` 和 `Battle Burst`。练习对手目前包括 Static Mote、Cache Shell、Trace Lancer、Loop Sentinel、Null Mirror、Patch Core 等原创野怪模板；它们会按难度和 seed 出现，并带有不同外观、属性、招式池和数值倾向。

训练战斗现在会记录战绩，并给少量本地训练 XP。训练 XP 可以推动宠物升级和技能解锁，但不会计入 Codex XP；Codex XP 仍然只来自扫描任务。它还没有掉落、捕获、装备或排行榜，更像是“训练场”：用来检验 Pathy 成长后的战斗手感。

### 4. 扫描与经验系统

扫描是把 Codex 活动转换为宠物成长的核心动作。

`Dry run` 是预览扫描：它会告诉你这次大概会发现多少新活动、可能获得多少 XP，但不会写入 state。

`Confirm scan` 是正式确认：它要求先有匹配的 dry-run，再把结果写入本地 `pet_state.local.json`。

扫描窗口可以选择最近 7 天、最近 30 天或全部历史。日常建议优先用 7 天或 30 天，只有初始化或排查时再扫全部。

XP 计算是 output-focused：

- uncached input token 只给少量 XP；
- output token 和 reasoning output token 权重更高；
- cached input token 只进入 lifetime counter，不给 XP；
- daily diminishing cap 会压低单日爆量收益；
- weekly hard cap 会限制单周最高 XP。

这套规则的目标是鼓励真实、持续的 Codex 使用，而不是一次性导入历史记录刷等级。

### 5. Auto Scan 自动扫描

Auto Scan 默认关闭。开启后会立刻正式扫描一次，然后按照设置的分钟间隔持续扫描。

Auto Scan 使用开启时选择的扫描窗口，例如 7 天、30 天或全部。它和手动扫描共享同一把写入锁，避免手动 dry-run 之后又被自动扫描写入，导致旧预览被重复确认。

推荐把 Auto Scan 当成“后台巡逻”。当你一整天都在使用 Codex 时，可以让它定期把新增活动写入宠物状态；如果你只想手动控制成长节奏，就保持关闭。

### 6. Dashboard 与动画宠物

Dashboard 是当前最适合普通用户的入口。它可以查看：

- 宠物等级、XP 和下一级进度；
- lifetime token counters；
- 技能解锁状态；
- hard-v1 经济规则摘要；
- dry-run 和 confirm scan 结果；
- Auto Scan 状态；
- 训练战斗和战绩；
- Adventure 任务、训练师称号和徽章；
- doctor 诊断摘要；
- state 备份入口；
- 当前宠物动画；
- 宠物图鉴 Dex。

项目内置了 Pathy 动画宠物包：`assets/pets/pathy/pet.json` 和 `assets/pets/pathy/spritesheet.webp`。Dashboard 会把 UI 状态映射到动画：

| 动画状态 | 触发场景 |
| --- | --- |
| `idle` | 空闲 |
| `review` | dry-run 预览 |
| `running` | 扫描或战斗进行中 |
| `waiting` | Auto Scan 开启后待命 |
| `failed` | 扫描、战斗或请求失败 |
| `waving` | 获得 XP |
| `jumping` | 升级、解锁技能或战斗胜利反馈 |

Dashboard 会通过 `/api/pets` 发现项目和 Codex home 下的本地宠物包，Dex 会显示已发现伙伴并标记当前伙伴。宠物选择会通过 `/api/pet/select` 写入 `pet_state.local.json` 的 `activePetId`，浏览器 `localStorage` 只作为界面偏好兜底。未来可以扩展成多宠物存档、装备槽或队伍系统。

Adventure 面板会把现有状态整理成更像游戏的任务线：选择伙伴、侦察 Codex、领取 XP、进入训练战斗、赢下一场、达到 Level 2。它还会根据进度显示训练师称号和徽章。这个面板不新增写入接口，也不保存额外隐私数据；它只是从现有本地 state 派生出的游玩指引。

### 7. 备份与诊断

`backup` 会把当前本地 state 文件复制成同目录备份文件。Dashboard 的维护区域也提供备份按钮。建议在升级、长时间游玩、调整规则或手动修改存档前先备份。

`doctor` 会检查 Codex home、sessions 目录、本地 state 和宠物包可用性。它只输出脱敏摘要，不展示完整本地路径、原始日志或完整 state。

### 8. 本地入口与远程只读入口

本地 Dashboard 绑定在 `127.0.0.1`，典型地址是：

```text
http://127.0.0.1:4321
```

这是真正的可操作入口，可以执行 dry-run、confirm scan、Auto Scan、训练战斗、备份和 doctor。

如果通过 Tailscale 暴露了只读预览入口，典型地址是：

```text
http://100.118.88.108:4331
```

只读入口适合在其他设备上查看状态、等级、宠物和战绩。写操作会被禁用或拒绝，包括正式扫描、自动扫描、训练战斗写入、备份等。它的定位是“观战屏”或“远程状态牌”，不是远程控制台。

## 推荐每日游玩流程

### 早上：看一眼伙伴状态

1. 正常启动 Dashboard。
2. 看 Pathy 的等级、XP 条、技能和战绩。
3. 如果昨天或上一轮使用 Codex 较多，先点 `Dry run`，看看新增活动会带来多少成长。

### 工作中：让 Codex 活动变成冒险进度

1. 正常使用 Codex 写代码、查问题、重构或整理文档。
2. 如果你喜欢手动节奏，每完成一段工作后做一次 `Dry run`。
3. 如果你喜欢自动节奏，开启 Auto Scan，让它每隔几分钟巡逻一次。
4. 看到 dry-run 结果合理后，再用 `Confirm scan` 正式写入。

### 升级后：检查新技能

1. 如果扫描后升级，先看技能区有没有新的解锁。
2. 读一下技能说明，确认它在当前版本中的用途。
3. 打一场 `normal` 难度训练战斗，观察新招式是否加入招式池。

### 收工前：打一场训练战斗

1. 用 `easy` 热身，适合低等级或刚开始玩。
2. 用 `normal` 作为日常标准战斗。
3. 用 `hard` 挑战连胜和高等级招式表现。
4. 如果连胜被打断，不用焦虑；当前战斗没有惩罚，也不会扣 XP。

### 重要节点：备份

以下场景建议点一次 backup：

- 第一次正式导入之后；
- 升到关键等级之后；
- 解锁新技能之后；
- 长时间使用 Auto Scan 之前；
- 准备尝试新规则或新版本之前。

## 新手到中期的玩法目标

### 新手目标：建立本地画像

第一次游玩时，先用 30 天窗口 dry-run，再 confirm scan。第一次正式 scan 大概率是 `profile-only`，最终 XP 可能是 0，这是正常的。它的作用是建立本地画像和去重基线。

### 成长目标：稳定升到 Level 10

Level 10 是当前第一阶段的完整技能线终点。推荐目标是：

- Level 2 解锁 Token Spark；
- Level 3 解锁 Context Sense；
- Level 5 解锁 Test Shield；
- Level 8 解锁 Refactor Aura；
- Level 10 解锁 Battle Ready。

### 战斗目标：提高胜场和最佳连胜

当前没有排行榜，所以战斗目标更偏自我挑战：

- 在 `normal` 难度保持稳定胜率；
- 用 `hard` 难度刷新最佳连胜；
- 每次解锁新技能后，打一两场观察招式变化；
- 把战斗日志当成 Pathy 的训练记录。

## 安全边界

这个项目的第一原则是：本地成长可以有趣，但不能越过隐私边界。

不会持久化的内容：

- prompt；
- response；
- tool output；
- 原始 JSONL 行；
- Codex auth token；
- 凭据；
- Codex home 绝对路径；
- 完整原始 session 路径。

会持久化的内容：

- 宠物等级和 XP；
- 已解锁技能；
- lifetime token counters；
- daily / weekly XP ledger；
- processed observation IDs；
- 训练战绩；
- state 创建和更新时间。

Dashboard API 只返回脱敏摘要，不返回完整 `PetState`、raw observations、processed observation IDs、prompt、response、tool output 或 raw JSONL。写操作需要本地页面会话 token，`Confirm scan` 还必须先有匹配的 dry-run。

只读 Tailscale 入口只能查看，不能写入。它适合展示，不适合管理存档。

## 当前未实现功能

这些功能现在还没有做，请不要把它们当成已可用玩法：

- 账号系统、云同步、远程数据库；
- PvP、匹配、好友对战、排行榜；
- 战斗掉落、捕获、多宠物收集；
- 装备、道具、主动技能配置；
- 野外地图和关卡推进；
- 战斗掉落或战斗后素材奖励；
- 多存档、宠物队伍；
- 完整可视化配置面板；
- 独立 schema 迁移命令；
- 破坏性重置流程；
- 手机端原生 App。

## 下一步玩法建议

最值得优先扩展的是“训练战斗之后还有什么可期待”。推荐路线：

1. 增加更多 PvE 对手。可以按等级段解锁不同训练对象，让 Level 1-3、Level 4-7、Level 8-10 的战斗体验不同。
2. 把技能效果数值化。比如 Token Spark 提高 spark 招式伤害，Test Shield 增强 guard 防御，Context Sense 提高命中或信息反馈。
3. 做一个轻量冒险地图。把扫描、训练、备份、doctor 和宠物选择组织成几个地点，让 Dashboard 更像营地而不是控制面板。
4. 设计多宠物与装备槽。先从本地宠物队伍开始，再考虑收集、稀有度和外观。
5. 扩展成就系统。当前已经有轻量徽章，下一步可以加入“连续 7 天有新增 Codex 活动”“首次 Level 5”“hard 难度三连胜”等更长期的纪念目标。

当前版本已经有完整的本地养成闭环：使用 Codex、扫描、获得 XP、升级、解锁技能、训练战斗、查看战绩、备份存档。下一阶段应该围绕这个闭环继续加深，而不是急着引入账号、云同步或 PvP。

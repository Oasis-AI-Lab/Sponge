# 11 Sponge 事实地图：现状、冲突、自我演化与 Move Up 的位置

> 归属：Sponge 论述 ｜ 性质：**审视记录 + 事实地图**（不是设计、不是契约、不是计划；不产出 API／schema／prompt／UI）
> 日期：2026-10-08 ｜ 触发：Move Up / Move Up Detector 研发前的项目级审视
> 与 [02](02_概念与抽象类.md) 的关系：本文**不修改** 02。本文登记的术语冲突（§3）走 02 的修订流程，不在本文静默统一。
> 与 [10](10_Move-Up-与-Move-Up-Detector.md) 的关系：10 是 Move Up 的概念研究记录；本文把 10 放回整个项目的真实状态里（§5），并把 10 §8 的未决问题登记进 [06](06_开放问题与决策.md)。
> 写作目的：**让第一次进入 Sponge 的人／agent 能在读代码之前，先知道「Sponge 今天已经有什么、计划中有什么、运行时层替它解决了什么、它自己还得解决什么、Move Up 在哪一格」。**

---

## 0. 读法与标注

四档标注（本次审视要求严格区分，不许混写）：

| 档 | 含义 | 证据要求 |
|---|---|---|
| ✅ **已存在** | 代码里已实现、有测试或运行证据 | 指向文件／测试／Agent Note |
| 🟦 **已设计** | 文档已定义、尚未实现 | 指向 研发/ 或 契约/ 的条目 |
| 🟡 **当前假设** | 最近提出、未验证 | 指向研究文档，并标注"未定案" |
| ❓ **未知** | 项目里没有答案，需要实验或决策 | 指向 06 / 10 §8 的未决项 |

本文任何一条都可被单独证伪。若某条被证伪，请在原地记录，而不是删除。

---

## 1. 最重要的一件事：本仓是两层

这条事实决定了 `docs/` 该怎么组织，也决定了 Move Up 该放哪一格。**不先分清两层，后面每个词都会串味。**

| 层 | 是什么 | 住哪 | 语言 | 谁在管 |
|---|---|---|---|---|
| **范式层（Sponge）** | 信息空间／切片／元素／域／调度器／场景／通道……的范式与设计 | `研发/`（论述 + 契约）、`研发/impl/`（基类实现）、`plans/`（计划） | 中文（plans 英文） | Sponge R&D |
| **运行时层（Harness）** | 一个基于 vendored Cordis 的插件化 agent 运行时（原 DeepSeek Harness，已 rescope） | `packages/`（`@oasisailab/sponge-*`）、`docs/`、`vendor/cordis` | 英文 | root [AGENTS.md](../../AGENTS.md) 的工程规范 |

**由此得到四条硬事实：**

1. `docs/` **不是 Sponge 的文档**——它是运行时层的参考文档。全仓 grep `docs/` 无 "Move Up"，无 Space／Slice／Domain 的定义。
2. 一个"第一次进入 Sponge 的开发者"如果只读 `docs/`，会学会"怎么写一个 harness 插件"，但学不到"Sponge 是什么、Move Up 在哪"。
3. 范式层的入口是 root [`README.md`](../../README.md) → [`研发/README.md`](README.md)。
4. 两层的接缝目前只有三处被明确写下：D-O（借壳边界，[06](06_开放问题与决策.md)）、`packages/experimental/*`（范式概念的可运行实验）、`研发/impl/`（基类切片的独立实现）。

> ⚠️ 一个容易踩的坑：`docs/user/index.md` 的标题至今仍写 "DeepSeek Harness"，而仓库名是 Sponge。这不是矛盾，是 rescope 未收尾的残留（见 §6 待办）。

---

## 2. 事实地图（A：现有 / 已设计 / 假设 / 未知）

### 2.1 ✅ 已存在（代码 + 证据）

| 事实 | 证据 |
|---|---|
| Cordis 框架本体：插件、服务（抽象类）、类型化事件（五种分发）、`ctx.effect` 可逆副作用、作用域／隔离、配置校验、HMR、timer | `vendor/cordis/`；[docs/architecture.md](../docs/architecture.md) |
| 运行时产品能力：会话、工具、agent-loop、LLM 适配、沙箱、审批、技能、工作流、子代理、jobs、schedule、goal、plan、storage、settings、credentials、telemetry 等 | `packages/`；[docs/capability-seams.md](../docs/capability-seams.md) |
| 会话日志是唯一权威 + "模型可见即已记录"不变量 | `packages/core/session/`；[docs/architecture.md](../docs/architecture.md) |
| 基类切片 + 内容寻址快照存储：`id`/`name`/`kind`/`parent`/`content`/`latest`，`create/rename/save/load/subclass` | `研发/impl/src/base/{slice,store}.ts`；[研发/impl/README.md](impl/README.md)（10/10 测试绿） |
| Move Up Detector（shadow bench）：可替换判定 seam、保留观察、固定语料 harness；**不创建对象、不写会话日志、未挂任何 profile** | `packages/experimental/move-up-detector/`；Agent Note [`2026-09-24-move-up-detector-shadow-plugin.md`](../.agents/notes/implemented/architecture/2026-09-24-move-up-detector-shadow-plugin.md)（36 测试） |
| Agent Teams（experimental）：roster + 持久 mailbox + 任务 DAG | `packages/experimental/agent-team/` |
| 人机中断原语：`ctx.userQuestions`、`ctx.approval`、`ask_user` 工具 | [docs/subsystems/user-questions.md](../docs/subsystems/user-questions.md)、[docs/subsystems/approval.md](../docs/subsystems/approval.md) |
| 运行时自改：`cordis_define`/`run`/`stop`/`undefine`（不可变 Package + 授权 + 审批；**仅进程内存、按会话、不过重启、不改 `cordis.yml`**） | `packages/extensions/tool-cordis/` |

**关键限定**：`研发/impl/` 是**独立 npm 工程**（`研发/impl/package.json`），**不在 `packages/`，未接入 harness**。基类切片目前只被自己的测试和派生 demo 消费。

### 2.2 🟦 已设计（文档已定义、未实现）

| 事实 | 出处 |
|---|---|
| 切片契约（草案）：自由容器，持久／可命名／可子类化，不解释语义 | [契约/切片-Slice-契约](契约/切片-Slice-契约.md) |
| 固定层 vs 演化层（提案）：抽象类接口／生命周期／调度协议＝固定层；切片内元素组合／pipeline＝演化层 | [04 §三](04_收敛设计.md) |
| 域＝存在模式轴（待进化／确定／主体）；粒度与迁移规则未定 | [02 §3.7–3.8](02_概念与抽象类.md)、[06 D-K](06_开放问题与决策.md) |
| 主体＝域形式（主体域），MVP 先字段（owner+role） | [06 D-J](06_开放问题与决策.md) |
| 翻译器／接收器＝独立抽象类，成对成立；原生表征＝脚手架 | [06 D-I](06_开放问题与决策.md)、[02 §3.5](02_概念与抽象类.md) |
| 信息空间＝容器本体；agent 是居民，抽象类是内部构造 | [06 D-M](06_开放问题与决策.md)、[02 §3.9](02_概念与抽象类.md) |
| Sponge Editor（创造面）+ Portal（标准面），借 harness UI 壳 | [06 D-L](06_开放问题与决策.md)、[07](07_编辑器规划.md) |
| 契约索引其余板块（元素／信息源／调度／通道／AgentPark／翻译器／接收器）全部"待写" | [契约/00_索引](契约/00_索引.md) |
| MVP 2 个月路线图 + Portal M1–M5 执行计划 | [plans/roadmap/2026-08-30-mvp-2-month.md](../plans/roadmap/2026-08-30-mvp-2-month.md)、`plans/exec/portal/` |
| `研发/impl/PLAN.md` 的 MVP 目录蓝图：`base`（已建）/ `mechanism` / `role` / `content` / `runtime` / `tools` | [研发/impl/PLAN.md](impl/PLAN.md) |

### 2.3 🟡 当前假设（未验证）

| 假设 | 出处 | 状态 |
|---|---|---|
| Move Up：把对话中的语义单元提升为可独立存在的 Space 对象 | [10 §2](10_Move-Up-与-Move-Up-Detector.md) | 工作定义，02 未收录 |
| Move Up Detector：判定 chunk 是否值得提升；输出 Stay／Move Up／Ask | [10 §4·§6](10_Move-Up-与-Move-Up-Detector.md) | 候选机制 |
| 五条候选判断信号（独立性／持续性／状态性／后续作用／语义承诺） | [10 §5](10_Move-Up-与-Move-Up-Detector.md) | 研究假设，不给权重阈值 |
| Resolve：Move Up 不一定是新建，可能是更新已有对象（Create／Update） | [10 §6.2](10_Move-Up-与-Move-Up-Detector.md) | 未定案 |
| "主张者（claimant）"＋"主张的调解"是 Sponge 唯一该占的一格 | [09 §0·§V.4](09_可运行插件原语研究.md) | 非定案 |
| Space 会自我演化（产品直觉） | 用户背景说明 | **未写入任何文档**，本文 §4 首次给出工作定义 |
| 切片契约的容器生命周期够不够当 Space Object 的最小生命周期 | [10 §3.2](10_Move-Up-与-Move-Up-Detector.md) | 未验证 |
| semantic chunk → Move Up → Space Object 是 Move Up 的正确形态 | [10 §2](10_Move-Up-与-Move-Up-Detector.md) | 未定案 |

### 2.4 ❓ 未知（项目里没有答案）

| 未知 | 出处 | 为什么关键 |
|---|---|---|
| **通道（Channel）是什么** | [04 §六](04_收敛设计.md)（P0） | 切片＋通道＝改造的完整语法；决定野心一能否成立 |
| **调度系统机制化三问**（编排／主动释放／演化）的机制对应物 | [04 §四](04_收敛设计.md)（P0） | 护城河所在；答不出则坍缩回"脚手架＋好 prompt" |
| **Semantic Chunk 如何确定** | [10 §8.1](10_Move-Up-与-Move-Up-Detector.md) | 边界先于判定 |
| **Resolve：如何识别已有对象并更新** | [10 §8.6](10_Move-Up-与-Move-Up-Detector.md) | 做不到，对象泛滥会指数放大 |
| **Space Object 的最小生命周期** | [10 §8.4](10_Move-Up-与-Move-Up-Detector.md) | 没有它，"对象存在"不可检验 |
| **被提升对象的状态归属在哪** | [10 §8.9](10_Move-Up-与-Move-Up-Detector.md) ＝ [09 §IX Q3](09_可运行插件原语研究.md) | 本仓以会话日志为唯一权威，"插件私有状态"已判定不成立 |
| **何时自动提升 / 何时询问用户** | [10 §8.2](10_Move-Up-与-Move-Up-Detector.md) | 决定 Ask 是兜底还是主路径 |
| **如何避免产生大量无价值对象** | [10 §8.5](10_Move-Up-与-Move-Up-Detector.md) | 反向失败模式 |
| **Detector 判定是否需要被记录（可解释性）** | [10 §8.10](10_Move-Up-与-Move-Up-Detector.md) | 主动创建对象时用户需知道为什么 |
| **元素 vs 插件的边界** | [06 P1-5](06_开放问题与决策.md) | 决定"装进去的东西"叫什么 |
| **域粒度（切片级／元素级／内容级）** | [06 P1-10](06_开放问题与决策.md) | 决定状态挂在哪一层 |
| **D-N：核心归属（本仓新包组 vs 另开独立仓）** | [plans/README.md](../plans/README.md) | 阻塞 core 轨计划与 roadmap 范围 |
| **Space 运行时根本不存在** | detector README「Space context is always empty」 | `MoveUpDetectorContext.spaceObjects` 永远空；"脱离对话"目前无处可落 |

---

## 3. 术语冲突清单（B 的前半：记录，不自行统一）

审查了用户点名的十个词。**以下冲突不静默统一**；每条给出"应该通过什么修订流程解决"。

| # | 词 | 定义 A（范式层） | 定义 B（运行时层 / 别处） | 冲突性质 | 修订流程 |
|---|---|---|---|---|---|
| 1 | **Sponge** | AI 系统范式 ＋ 信息空间容器本体（[00](00_总论与野心.md)、[02 §3.9](02_概念与抽象类.md)） | npm scope `@oasisailab/sponge-*`，即 rescope 后的 DeepSeek Harness（[docs/i18n/terminology.md](../docs/i18n/terminology.md)） | **命名重载**：一词同时指"范式／产品"与"运行时实现"。"Sponge 今天有什么"因此无法回答——问的是哪个？ | root `README.md` + [02](02_概念与抽象类.md) 对齐 → 运行时层是否另起名（harness/dsh）由 [06 D-O](06_开放问题与决策.md) 附近的决策走 root AGENTS.md 包命名约定 → `docs/i18n/terminology.md` 跟随 |
| 2 | **Slice / Element / Plugin** | Slice＝自由容器、所有抽象类的基类；Element＝切片内可被调用的组件；两者都是"抽象类"（[02 §二](02_概念与抽象类.md)） | 一切皆 Plugin；无 Slice／Element（Cordis 语义，[docs/architecture.md](../docs/architecture.md)） | **边界未定**：[06 P1-5](06_开放问题与决策.md) 明写"元素与插件的边界待定"；[09 附录 C](09_可运行插件原语研究.md) 断言"三套词指同一层"——那是断言，不是定案 | [06 P1-5](06_开放问题与决策.md) →（若结论要求）[02](02_概念与抽象类.md) → [契约/元素-Element-契约](契约/00_索引.md) |
| 3 | **Domain（域）** | 存在模式轴：待进化／确定／主体（[02 §3.8](02_概念与抽象类.md)） | `docs/` 无 Domain 定义；DSH 无对应概念；[02 §3.7](02_概念与抽象类.md) 另注"与场域叠加无关（仅字面相近）" | **单边概念**（Sponge 有、运行时无）。风险：读者把 DSH 的某个东西当成"域" | 域若落地必须在运行时层找到落点（[09 §V.1](09_可运行插件原语研究.md)：Cordis 无此原语，落点必然在产品层之上）——属 D-N／调度器决策的一部分 |
| 4 | **Scheduler（调度器 / schedule）** | 中央调度器＝编排／主动释放／演化，是护城河（[02 §四](02_概念与抽象类.md)、[04 §四](04_收敛设计.md)） | `packages/schedule`＝"Scheduled reminders"（定时提醒）；Cordis **没有**调度器，只有 timer（[09 §V.1](09_可运行插件原语研究.md)） | **同名异指，且最危险**：读者会把"Sponge 中央调度器"误当成 `dsh-schedule` | Sponge 侧加限定（始终写"中央调度器"）；运行时侧沿用 `schedule`；由 [04](04_收敛设计.md) 三问收敛时一并钉死 |
| 5 | **Channel（通道）** | 待形式化（P0）；候选＝切片间连接／内部改造机制／两者（[04 §六](04_收敛设计.md)） | DSH 无 Channel | **范式层自身未定义**（非跨层冲突）；收敛前任何使用都带歧义 | [04 §六](04_收敛设计.md) 先写"定义讨论"文档 → [02](02_概念与抽象类.md) → 契约 |
| 6 | **Scene（场景）** | 面向用户的表征；WAM／Lemma 是实例（[02 §3.4](02_概念与抽象类.md)） | 运行时对应物＝slot + store + renderer（[09 附录 C](09_可运行插件原语研究.md) 的映射是断言） | 映射未定；且 02 内"场景／表征／脚手架"三词关系尚未自洽（§3.4 vs §3.5） | [02 §3.4–3.5](02_概念与抽象类.md) 内先自洽，再谈运行时映射 |
| 7 | **AgentPark** | AI 可自由掌控／更改 Pipeline 的空间（[02 §二](02_概念与抽象类.md)） | 最近似物＝self-modification（`cordis_define/run/...`）；[07 §四](07_编辑器规划.md) 称其"AgentPark 雏形" | 部分映射被断言；[03 §六](03_架构与生态位.md) 仍写"Cordis（未决）"——文档自认未澄清 | [03 §六](03_架构与生态位.md) 更新 + [06](06_开放问题与决策.md) |
| 8 | **Runtime（运行时）** | `研发/impl/PLAN.md` 的 `runtime/`＝"assembly + config（dual form = config）" | DSH 中 runtime 多指（`code-runtime` 包、`client-runtime`、agent runtime） | 词重载，低危（语境可区分） | 无紧急；Sponge `runtime/` 落地时命名避开 |
| 9 | **Space（信息空间）** | 容器本体（[02 §3.9](02_概念与抽象类.md)） | 无 | **单边概念 ＋ 无运行时**：`MoveUpDetectorContext.spaceObjects` 是唯一占位，永远空 | Space runtime 是 Move Up MVP 的前置（见 §5、[plans/exec/move-up](../plans/exec/move-up/)） |
| 10 | **Statuz** | 独立全局状态层，经"信息源"接口对接（[03 §三](03_架构与生态位.md)） | 本仓无 Statuz 代码；`packages/` 无对应实现；`研发/impl` 的 InfoSource 只是"接口＋假实现"计划 | 文档承诺的"第一个实现"在仓内不存在 | [06 D-E](06_开放问题与决策.md)、[03 §三](03_架构与生态位.md) |

> 补充：`docs/user/index.md` 标题仍为 "DeepSeek Harness"（仓库名 Sponge）——见 §6 待办。这是一处**未收尾的 rescope 残留**，不是定义冲突。

---

## 4. "Space 自我演化"的当前工作定义（C）

### 4.1 定义（工程／研究可用，不是营销文案）

> **Space 自我演化：一个 Space 在跨会话的时间轴上，把早期交互的产物固化为可被后期交互读取的对象与结构，从而使后期交互的输入部分由系统自身（而非用户重述）提供。**
>
> **可观察判据**：在 Session B，用户不必重述 Session A 的结论，系统仍能让该结论进入 Session B 的模型请求，并改变 Session B 的行为。

这个定义的三个要点：①"跨会话"——单次对话内的变化不算；②"固化"——必须是持久的、可被后续读取的；③"改变后续输入"——只存储不改变行为不算（这一条把"记忆"与"演化"分开）。

### 4.2 它可能发生在哪些层面，以及每一层"已有机制"是否就位

用户列了七类；下表不预设七类就是最终分类，只是把每一层对着**本仓已有机制**核一遍。

| 层 | 变化是什么 | 本仓已有机制（若存在） | 就位？ |
|---|---|---|---|
| **内容** | Space 中出现新对象 | **无**。Move Up 是候选（[10](10_Move-Up-与-Move-Up-Detector.md)）；detector 处于 shadow mode，不创建对象 | ❓ 缺 |
| **结构** | 对象间关系／层级／组织 | 基类切片的 `parent` + `subclass()` + 内容寻址快照（`研发/impl/src/base/`） | ✅ 有（仅 base，未接运行时） |
| **行为** | Space 获得新的持续行为 | Cordis plugin + `ctx.effect`；`ctx.jobs`／`ctx.schedule`／`ctx.goals` | ✅ 通用能力有（未用于 Space 对象） |
| **表征** | 用户看到的界面渐变 | slots + store + renderer（[09 §V.2](09_可运行插件原语研究.md)） | ✅ 通用能力有（未用于 Space） |
| **交互** | AI 有新的工作方式／方法／模式 | agent preset／skills／workflow | ✅ 通用能力有 |
| **方法** | 安装、使用、替换不同 Plugin | Cordis profile／bundle／patch；runtime self-mod（`cordis_define`） | ✅ 有 |
| **状态** | 过去讨论产生的对象成为未来行为的依据 | 会话日志（唯一权威）；域＝状态轴（未落地） | 🟦／❓ 半 |

### 4.3 由此得到的两个结论（一强一弱，均标假设）

**结论一（较强，可检验）**：上表七层里，**运行时层已经提供了五层的通用机制**（结构／行为／表征／交互／方法），唯独**"内容"层（对象从哪来）与"状态归属"（对象的状态存哪）没有机制**。这两格正是 [09 §V.4](09_可运行插件原语研究.md) 标注的"半解决①：没有一个东西拥有一份自己的、可被别的东西读的状态"。

**结论二（弱，纯假设）**：因此 Move Up 可能正好补的是"内容"层的入口阀——**没有它，其余五层没有可累积的东西**。⚠️ 这是假设，不是结论：它把"Space 自我演化"的因果链押在"内容必须先固化"上，而这一条只能由 MVP 证伪（见 [plans/exec/move-up](../plans/exec/move-up/)）。

> **必须诚实标注**：4.2 的"已有机制"说的是**通用能力存在**，不是"Space 对象已经在用它们"。把通用能力接到 Space 对象上，本身是未验证的工程。

---

## 5. Move Up 在 Sponge 中的位置（D）

### 5.1 它解决什么

把对话中的某个语义单元，从"仅存在于 Conversation 中的语言内容"，提升为 Sponge 信息空间中可独立存在、可被后续会话读取的对象（[10 §2](10_Move-Up-与-Move-Up-Detector.md)）。用 §4 的层表说：**它补"内容"层那一格。**

### 5.2 它不解决什么（边界，防止范围蔓延）

- 不解决**结构／行为／表征／交互／方法**——那些机制已在运行时层存在，Move Up 不重造。
- 不解决 **Resolve 的语义等价**（识别"这是同一个东西"）——[10 §8.6](10_Move-Up-与-Move-Up-Detector.md) 明写"本文不假设有解"。
- 不解决**调度**（谁决定下一步）——那是[中央调度器](04_收敛设计.md)的事。
- 不生成 **ontology**、不做 **taxonomy 定案**、不做**记忆系统**。
- **不是 Sponge Core 的硬编码机制**：Move Up Detector 是一个可以添加、删除、替换的 Plugin（见 5.3）。

### 5.3 为什么是 Plugin

1. **本仓一切皆插件**（root [AGENTS.md](../../AGENTS.md)）：新增行为挂到文档化的扩展点，不改内核。
2. **Move Up 是判定策略，不是内核不变量**：判定算法是研究问题，[10 §9](10_Move-Up-与-Move-Up-Detector.md) 明确"不把 Move Up 写死成某一种具体分类器"。
3. **shadow mode 已证明"不改内核即可观察"**：detector 定义了零个 session event、零个 core 改动（Agent Note：*no core change*）。
4. **符合固定层／演化层的边界**：[04 §三](04_收敛设计.md) 要求可演化内容不碰固定层；判定策略属演化层。

### 5.4 为什么适合作为实验性能力

- 判定信号、输出集、taxonomy **全部未定**（[10 §8](10_Move-Up-与-Move-Up-Detector.md)）。
- `packages/experimental/` 的定位正是"私有、无稳定性／支持承诺、但仍满足工程与测试要求"（[packages/experimental/README.md](../packages/experimental/README.md)）。
- Agent Note 已记录"为什么暂不给它 `docs/subsystems/` 参考页"——契约会变，稳定性承诺还开不出来。

### 5.5 关键前置（否则 MVP 无处落地）

**Space runtime 不存在。** detector 的 `MoveUpDetectorContext.spaceObjects` 永远是空列表，README 明确要求 detector 把空列表读作"存在性未知"，而非"不存在任何东西"。所以 Move Up 的**后半段（Recall）**目前没有落点——MVP 必须先造一个最小的 Space 对象存储＋读取路径。这不是 detector 的任务。

---

## 6. docs/ 应如何重新组织（B）

### 6.1 先看清 docs/ 的真实性质

`docs/` 是**运行时层参考文档**，且受重闸门约束：双语配对（`foo.md` + `foo.zh.md` + `*.i18n.yaml`）、[doc-budgets.manifest.json](../scripts/doc-budgets.manifest.json) 字数上限、[website/docs.ts](../website/docs.ts) 站点投影、`verify-md-wrap` / `verify-md-links` / `verify-doc-budgets` / `doc-sync`（[docs/AGENTS.md](../docs/AGENTS.md)）。

**因此本次的判断是：不应把范式层内容写进 `docs/` 的生成层，也不应新增 `docs/` 页。** 理由：那会把 Sponge 语义塞进 harness 文档层，违反 [06 D-O](06_开放问题与决策.md) 的"Sponge 语义永不进 harness 业务包"精神，也违反 [docs/AGENTS.md](../docs/AGENTS.md) 的"one home per fact"（范式事实的家在 `研发/`）。

### 6.2 建议的组织（三层，各归其位）

| 层 | 入口 | 职责 | 本次动作 |
|---|---|---|---|
| **范式层** | root [`README.md`](../../README.md) → [`研发/README.md`](README.md) → 本文 `研发/11` | Sponge 是什么、今天有什么、Move Up 在哪 | ✅ 新增 `研发/11`，并把它登记进 `研发/README.md` |
| **运行时层** | [`docs/`](../docs/architecture.md) | 怎么写一个 harness 插件、每个子系统的契约 | ⛔ 不改（它是对的） |
| **接缝** | `packages/experimental/*/README.md` + 对应 Agent Note | 每个范式概念的**可运行实验**及其限制 | 已存在，保持 |

### 6.3 本次实际修改清单

| 文件 | 动作 | 为什么 |
|---|---|---|
| `研发/11_Sponge-事实地图.md` | **新增**（本文） | 建立"架构事实地图"＋冲突清单＋自我演化定义＋ Move Up 位置；这是范式层缺的那一页 |
| [`README.md`](../../README.md)（root） | 结构块补 07–11 五行 ＋ 阅读路线补一条 ＋ 一条 2026-10-08 更新注 | 新读者的入口在 root README；原结构块只列到 06，07–11 四份研究记录对新读者不可见。**这是本次唯一被 docs 门禁覆盖的改动**（root README 在 `verify-md-wrap`／`verify-md-links` 范围内） |
| [`研发/README.md`](README.md) | 索引新增一行 ＋ 阅读路线补一条 ＋ 一条 2026-10-08 更新注 | 让新读者能找到本文与 MVP 计划 |
| [`研发/06_开放问题与决策.md`](06_开放问题与决策.md) | 新增 §三（MU-1…MU-10）＋ §四（术语冲突登记）＋ 一条 **proposed** 决策（D-Q） | 06 是未决事项的单一入口；[10 §8](10_Move-Up-与-Move-Up-Detector.md) 明确要求"若被采纳应登记在那里"；术语冲突**只登记不统一** |
| [`plans/README.md`](../plans/README.md) | 新增 `move-up` 执行计划行 ＋ D-Q 待裁决行 | 让 MVP 计划进入活跃计划表 |
| `plans/exec/move-up/2026-10-08-plan-move-up-mvp.md` | **新增** | Move Up MVP 计划（交付物 E、F） |

**未改**：`docs/**` 全部未动（理由见 §6.1–6.2）；`研发/02` 未动（§3 的冲突若被裁决，走 02 的修订流程）；`packages/` 未动（本次是审视，不是实现）。

### 6.4 记录为待办、但本次不静默修改的一处

`docs/user/index.md` 标题仍写 "DeepSeek Harness"，与仓库名 Sponge 不一致。它是 redirect stub，且属 i18n 配对 + 站点投影范畴——**按 docs 的配对流程处理，不在本次静默改**。是否改、改成什么，取决于 §3 第 1 条（Sponge 一词的命名重载）如何决策。

---

## 7. 与既有文档的关系

| 文档 | 关系 |
|---|---|
| [02 概念与抽象类](02_概念与抽象类.md) | 本文不修改它；§3 的冲突若被裁决，走 02 的修订流程 |
| [04 收敛设计](04_收敛设计.md) | §4 的"层表"与 04 §四的调度三问相邻；本文不主张它们同源 |
| [06 开放问题与决策](06_开放问题与决策.md) | 本文 §2.4 的未决项登记在那里 |
| [09 可运行插件原语研究](09_可运行插件原语研究.md) | §4.3 的"内容层／状态归属缺口"来自 09 §V.4；09 §IX Q3 是 §2.4 状态归属的家 |
| [10 Move Up 与 Move Up Detector](10_Move-Up-与-Move-Up-Detector.md) | 10 是概念研究记录；本文把 10 放回项目真实状态（§5），并把 MVP 收窄（→ plans/exec/move-up） |
| [plans/](../plans/README.md) | MVP 计划的家；本文只指向，不重述 |

---

*本文是审视记录，不是产品规格。任何一段都可以被单独证伪；若某段被证伪，请在本文原地记录，而不是删除它。*
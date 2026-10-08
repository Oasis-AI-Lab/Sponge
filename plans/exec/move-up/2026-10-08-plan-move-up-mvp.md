# Move Up MVP 执行计划

> 状态：**draft**（待战略层评审）｜ owner：Sponge R&D ｜ approver：战略层 ｜ horizon：见 §8（里程碑而非日历，资源未知，见 [roadmap §七](../roadmap/2026-08-30-mvp-2-month.md)）
> basis：[研发/10 Move Up 与 Move Up Detector](../../../研发/10_Move-Up-与-Move-Up-Detector.md)（概念研究记录）· [研发/11 Sponge 事实地图](../../../研发/11_Sponge-事实地图.md)（现状与冲突）· `packages/experimental/move-up-detector/`（shadow bench，已实现）
> exit：§10 的成功判据在一条**可回放的两会话快照**上成立；失败判据触发时，本计划以书面结论收尾（归档，不悄悄移动日期）
> 上游依赖：无（不阻塞于 D-N／P0-1／P0-2；见 §11.3 为何不阻塞）
> 性质：**执行计划**。本文只规划"要证明什么、怎么算证明"，不产出 detector 算法、不产出对象 schema、不产出 UI 设计。

---

## 0. 这份计划要证明的唯一一件事

> **讨论中的某些语义单元，可以被系统识别，并脱离 Conversation 成为 Space 中可持续存在的东西；而且这些东西能够反过来影响后续交互。**

可检验的形态（本文的一切工作都指向它）：

```text
Session A：用户与 AI 讨论 → 系统识别出某个语义单元 → 它成为对象 O
Session A 结束
Session B：用户不重述 Session A 的内容 → 系统找到 O → 读取 O 的当前状态 → 基于 O 行动
```

**不是**要证明的：Detector 判定准确率；对象分类学；"Space 自我演化"的整体成立。
**判据的落点**：Session B 里，O 的内容**进入了 Session B 的模型请求**，并且 Session B 的行为**依赖它**。只存不取、取了不用，都不算。

### 0.1 最小闭环（本计划的骨架）

```text
Talk → Detect → Promote → Persist → Recall → Affect next interaction
```

六段都必须真实发生；任何一段缺失，MVP 就不成立（§10 的失败判据逐段对应）。

---

## 1. 现状核对（读代码后的结论）

### 1.1 已经存在、可以直接用的（✅）

| 事实 | 证据 |
|---|---|
| 会话日志是唯一权威 ＋「模型可见即已记录」 | `packages/core/session/`；[docs/architecture.md](../../../docs/architecture.md) |
| `session/event` 提交后事件流（观察对话的现成入口） | 同上；detector 已用它，未定义自己的总线 |
| 工具注册与调用（工具调用与其结果天然入日志） | `packages/core/tools/`；[docs/cookbook/adding-a-tool.md](../../../docs/cookbook/adding-a-tool.md) |
| 人机中断原语（Ask 路径的现成机制） | `ctx.userQuestions`、`ctx.approval`；[docs/subsystems/user-questions.md](../../../docs/subsystems/user-questions.md) |
| Move Up Detector（可替换判定 seam ＋ 固定语料 harness） | `packages/experimental/move-up-detector/`（36 测试；**不创建对象、不写会话日志、未挂 profile**） |
| 基类切片 ＋ 内容寻址快照存储（一个能读的容器模型） | `研发/impl/src/base/{slice,store}.ts`（10/10 测试；**独立 npm 工程，不在 `packages/`，未接 harness**） |
| 存储能力 | `packages/storage/`；[docs/subsystems/storage.md](../../../docs/subsystems/storage.md) |

### 1.2 缺失、必须由本 MVP 补上的（❓）

| 缺口 | 现状证据 | 本 MVP 的最小补法 |
|---|---|---|
| **Space 对象存储与读取路径** | detector README：`MoveUpDetectorContext.spaceObjects` 永远空；"Sponge has no Space runtime to read yet" | §5：一个最小持久化对象存储（新实验包） |
| **Detector 判定 → 行动 的连接** | detector 只暴露 `observe()`／`recent()`；判定结果**不产生任何事件**，也没有订阅者 | §4：一条最小 bridge（候选接法见 §4.2） |
| **召回（Recall）的模型可见路径** | 不存在 | §4：一个 `space_recall` 工具（工具调用天然入日志） |
| **对象的最小生命周期** | [10 §8.4](../../../研发/10_Move-Up-与-Move-Up-Detector.md)；[切片契约 §4](../../../研发/契约/切片-Slice-契约.md) 只给容器生命周期，是否够用未验证 | §3：**只做 status 一个字段**，不给完整生命周期 |

### 1.3 必须绕开、不能被 MVP 顺带回答的（保持未决）

- **对象状态归属在哪**（[10 §8.9](../../../研发/10_Move-Up-与-Move-Up-Detector.md) ＝ [09 §IX Q3](../../../研发/09_可运行插件原语研究.md)）——本 MVP 让对象住在自己的存储里，**不主张**这就是最终答案。
- **域（可改性轴）对对象修改的约束**（[02 §3.8](../../../研发/02_概念与抽象类.md)）——MVP 不引入域，对象默认可改。
- **Space 本体（容器／嵌套／信息源）**——MVP 的 "Space" 是**一个按工作区切分的对象命名空间**，不是 [02 §3.9](../../../研发/02_概念与抽象类.md) 的信息空间。⚠️ 命名上必须区分，防止把 MVP 的临时容器当成 Sponge 的信息空间。

---

## 2. MVP 的边界

### 2.1 做（全部指向 §0 的那一件事）

1. 一段最小对话里，一个语义单元被识别并被提升为对象；
2. 该对象跨进程重启仍然存在；
3. 新会话中，用户**不重述**它，系统仍能召回它；
4. 召回的内容进入模型请求，并**改变**新会话的行为；
5. 上述四步由一条**可回放的两会话快照**固定下来。

### 2.2 不做（明确排除，防范围蔓延）

自动 ontology ／ 全自动 Space restructuring ／ 复杂 memory 系统 ／ 自动规划系统 ／ 全能 Scheduler ／ 多 Plugin 仲裁 ／ 完整 UI 自动生成 ／ 大规模 semantic extraction ／ 复杂 taxonomy ／ 自修改 Core ／ 自主重写 Sponge ／ Resolve 的语义等价算法 ／ 对象间的结构（边／层级）／ 表征（UI 生成）。

> 判据：**任何一项功能，如果删掉它 §0 的那句话仍然能被证明，它就不进 MVP。**

---

## 3. 最小对象模型（对象范围 ＋ 状态范围）

### 3.1 选哪些对象：先看现状，再看例子

用户给的候选是 Hypothesis / Decision / Todo / Question / Experiment。**不能照抄**——必须先核对本仓已有什么，避免重造：

| 候选 | 本仓已有对应机制？ | 判断 |
|---|---|---|
| **Todo** | ✅ **已有**：`packages/todo/` 的 `todo_write` 工具 | ❌ **排除**——重造一个已存在的机制，会让 MVP 的成果无法归因于 Move Up |
| **Question** | ⚠️ 半有：`ctx.userQuestions`／`ask_user` 是"agent 问用户"，不是"空间里的开放问题对象" | ⚠️ 与 Decision 生命周期重叠（open→resolved），二选一即可 |
| **Experiment** | ❌ 无 | ❌ **排除**——它的价值要靠"被执行"才显现，MVP 引入执行面 = 范围爆炸 |
| **Hypothesis** | ❌ 无 | ✅ **选它** |
| **Decision** | ❌ 无（`研发/06` 是本仓的决策清单，但那是文档，不是机制） | ✅ **选它** |

**结论：MVP 支持两种 kind —— `hypothesis`（主）与 `decision`（次）。** 理由：

1. **都不与本仓已有机制冲突**（todo／goal／plan 已存在，被排除）；
2. **都不需要"执行"就能成立**——它们是有状态的**语言对象**，MVP 不必引入运行面；
3. **两者给出一个最小但真实的 Create／Update 对照**：hypothesis 通常**新建**，decision 常常是对既有意向的**承诺／更新**（对应 [10 §6.2](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 的 Resolve）；
4. **Hypothesis 是概念记录里的规范例子**（[10 §7](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 的 H12），选它让 MVP 与已有讨论对齐。

⚠️ **`kind` 是开放字符串**（对齐切片契约的 `SliceKind`：开放命名空间，地基不解释 kind）。MVP **只实例化这两种**，但不写死枚举——写死就是过早 taxonomy。

### 3.2 最小状态范围

对象字段（MVP 全部字段，**没有更多**）：

```text
SpaceObject
├── id: string            // 稳定标识
├── kind: string          // 'hypothesis' | 'decision' | 未来开放
├── title: string         // 可被独立指代的短句（对应信号：独立性）
├── body: string          // 原始语义单元
├── status: string        // 见下
├── origin: { sessionId, eventId, at }   // 出处：它从哪句话来（可解释性）
└── updatedAt: number
```

- **`status` 是唯一的状态字段**，开放字符串，MVP 记录两套最小取值但不强制校验：
  - hypothesis：`open | supported | refuted | dropped`
  - decision：`proposed | accepted | superseded`
- **不做**：无版本历史（只保留 `updatedAt`）、无边／无层级、无 owner／域／权限、无置信度。
- **不做完整生命周期**（[10 §8.4](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 保持未决）：MVP 只证明"有 status 且 status 可被后续会话读到并改变行为"。

---

## 4. 最小闭环的逐段落点

| 段 | 谁负责 | 落点 | 标记 |
|---|---|---|---|
| **Talk** | 已有 | 会话（`session/event`） | ✅ |
| **Detect** | detector 包（已存在）＋ 一个**最小可用实现** | 现有 seam 不动；MVP 注册一个**规则型** detector（不再是 stub），只对 §3.1 两种 kind 给出 `move-up`／`ask`／`stay` | ⚠️ |
| **Promote** | 新实验包 | 把判定结果变成对象动作：`move-up` → 建／改对象；`ask` → 走 `ctx.userQuestions`；`stay` → 无操作 | ⚠️ |
| **Persist** | 新实验包 | §5 | ⚠️ |
| **Recall** | 新实验包 | 一个 `space_recall` 工具（工具调用与结果天然入日志，**不需要新会话事件**） | ✅ 机制现成 |
| **Affect** | 模型 | 召回结果进入 Session B 的模型请求 → 行为依赖它 | ⚠️ 由 §10 判据检验 |

### 4.1 为什么 Recall 走"工具"而不是"自动注入"

自动注入需要新增一个 system-prompt 贡献面（新的 model-visible 输入 → 新会话事件 → TS/Python SDK 期望输出同步）。**工具的描述本身就是模型可见输入，且已被日志记录**——所以工具是零新增事件的召回路径。MVP 取最窄的那条。

### 4.2 Detect → Promote 的连接（M1 待定的唯一接口问题）

detector 目前**不发出任何判定事件**（只有 `observe()`／`recent()`）。把判定接到行动上，有两条候选：

- **候选 A（推荐）：bridge 主动驱动。** 新包订阅 `session/event`，对候选 chunk 调 `ctx.moveUpDetector.observe(chunk)`，读返回值并行动。**不改 detector 包**。代价：新包需要拿到 chunk——需要 detector 包导出其 V0 chunker 或把 chunk 作为 `observe()` 的既有输入（两者都是**该包已声明的 seam**，不是新抽象）。
- **候选 B：detector 反向通知。** 给 detector 包加一个"判定完成"事件，bridge 订阅。代价：动 detector 包（它是已实现的实验件），且引入一个新的跨包事件面。

**M1 裁决其一**（见 §12 D-Q2）。倾向 A：MVP 不修改已实现的实验件。

### 4.3 Promote 是否写会话日志（M1 待定的第二个接口问题）

- **若 Promote 由 bridge 直接执行**（不经过模型）：对象创建**不在**模型请求里，按"模型可见即已记录"的字面要求，**不必**新增会话事件。
- 但用户需要知道"为什么刚才那句话变成了对象"（[10 §8.10](../../../研发/10_Move-Up-与-Move-Up-Detector.md)），且本仓以会话日志为唯一权威——**一次系统自主的对象创建若不入日志，会话就不完整**。

**倾向**：新增**一个**会话事件（如 `move-up/promoted`），记录 `{ objectId, kind, decision }`。代价是真实的（`SessionEventMap` ＋ TS/Python SDK 期望输出 ＋ 快照同步），但这是本仓的正确地基，且它把"系统在会话里做了什么"留在唯一权威里。**M1 裁决**（见 §12 D-Q3）。

---

## 5. 最小持久化

- **形态**：**优先复用** `packages/storage/` 的现成原语；若其原语不足以表达"按 id 读写一条对象 ＋ 列出"，退化为**一个 append-only JSONL 文件**（每行一条对象的最新快照，读时取每 id 最后一行）。
- **位置**：`$DSH_HOME/spaces/<spaceId>/objects.jsonl`。
- **Space 身份**：⚠️ **MVP 的一个 Space ＝ 一个工作区根（cwd）**。理由：会话已带 `cwd`、工作区是 harness 已有的分组（`ctx.workspaces`），复用它避免发明一个 Space 注册表。**这不是** [02 §3.9](../../../研发/02_概念与抽象类.md) 的信息空间——见 §1.3 的命名警告。
- **不做**：迁移／压缩／索引／并发协议／跨设备。单进程、单写者。
- **核对项**（M0）：先读 `packages/storage`，确认"复用 vs 自建 JSONL"——不要假设。

---

## 6. 最小 UI

**MVP 新增 UI ＝ 0 个页面。**

- 可见面**只有既有对话流**：提升在会话里表现为一条记录（§4.3 若成立则为一条会话事件；否则为 bridge 的行为日志），召回表现为一次工具调用与它的结果——两者用户都能在现有界面读到。
- **可选最小检查面**（不阻塞 MVP）：一个只读命令／工具 `space_list`，列出当前 Space 的对象。它是**开发者的检查窗**，不是产品面。
- **不做**：任何对象页面、任何可视化、任何对象编辑器。

---

## 7. 接口（本计划对上下游的承诺）

**取用（upstream）**

| 来源 | 取什么 | 现状 |
|---|---|---|
| `packages/core/session` | `session/event` 流；会话日志（Promote 若入日志则写这里） | ✅ |
| `packages/experimental/move-up-detector` | `ctx.moveUpDetector.observe(chunk)` 及其返回值 | ✅ 已有 API |
| `ctx.userQuestions` | Ask 路径 | ✅ |
| `packages/storage`（或文件系统） | 对象持久化 | ⚠️ M0 核对 |

**给出（downstream）**

| 消费方 | 得到什么 | 由谁声明 |
|---|---|---|
| 模型 | `space_recall` 工具（工具 schema 即契约，已入日志） | 本 MVP 新包 |
| 会话日志 | （若 D-Q3 成立）一条 `move-up/promoted` 事件 | 本 MVP 新包 |
| 未来的 Space runtime | 一份**可被替换**的对象存储与召回路径——它**不是**最终 Space 本体（§1.3） | 本 MVP 新包 |
| Move Up 后续研究 | 一条可回放的两会话快照 ＋ 一个"判定 vs 人工提升"的对照语料 | 本 MVP |

---

## 8. 里程碑与可点验收

> 每一步的验收都写成**能在回放里看见的行为**，不是"代码写完了"。日期一律标 `est.`（资源未知，见 [roadmap §七](../roadmap/2026-08-30-mvp-2-month.md)）。

### M0 —— 决策落地（无代码，`est.` 1 天）

**状态：☑ 2026-10-08 完成。** 完整结论与证据的唯一入口是 [研发/06 §五](../../../研发/06_开放问题与决策.md)；下表只给一行结论，不重述。

| 出口 | 裁决（2026-10-08） |
|---|---|
| D-Q1 | 复用 `packages/storage`（storage ＋ storage-domain ＋ storage-json）：domain `space` ＋ 表 `objects`；不自建 JSONL |
| D-Q2 | 候选 A：bridge 主动驱动，不改 detector 包 |
| D-Q3 | 写一条 log-only 会话事件 `move-up/promoted` |
| D-Q4 | 是：Space ＝ 会话 `cwd` 工作区根 |
| D-Q | 新包住 `packages/experimental/`；detector 保持 shadow；Promote 与 Detect 分离 |
| 记录 | ☑ 已回填 [研发/06](../../../研发/06_开放问题与决策.md) §五 与本文 |

**验收**：☑ 四项有书面结论。

### M1 —— 闭环骨架（`est.` 3–5 天）

**做**：新实验包骨架；`SpaceObject` 读写；`space_recall` 工具；规则型 detector；bridge；M0 的四项决策落地。

**可点验收**：

1. 一条会话里说出一句 hypothesis 型的话 → 对象被创建，`space_list` 能看到它；
2. 工具 `space_recall` 在**同一条会话**里能召回它；
3. 进程**重启**后 `space_list` 仍然能看到它（持久化成立）；
4. 把新包从 profile 摘掉 → 行为回到原样且**无报错**（证明它是可装卸的 Plugin）。

### M2 —— 跨会话证明（本 MVP 的核心里程碑，`est.` 2–3 天）

**做**：两会话快照（keyless replay）；decision 型对象的 Create／Update 对照。

**可点验收**：

1. **Session A**：用户与 AI 讨论 → 出现一次提升；
2. **Session B**：用户**不重述** Session A 的内容（只说"继续昨天那个问题"）→ 模型调用 `space_recall` → 结果里含 O 的当前 status；
3. 快照可回放（`pnpm run test:snapshot`，无 key），且 Session B 的模型请求里**确实含 O 的内容**；
4. decision 型：Session B 说出一个**已存在** decision 的承诺 → 结果是**更新** `status`，**不新建**对象（Resolve 的最小形态）。

### M3 —— 收尾（`est.` 1–2 天）

**做**：失败判据的测量；Agent Note；README／Known Limitations；语料与判定的对照报告。

**验收**：§10 的判据有数据；Agent Note 随 PR 交。

---

## 9. 最小测试

| 层 | 测什么 | 命令 |
|---|---|---|
| 单元 | 对象存储的读写与跨进程持久化；`space_recall` 的过滤；bridge 的三分支（move-up／ask／stay） | `pnpm run test` |
| 覆盖 | 新包 `src` 每文件 100%（CI 门禁是 `test:coverage`，不是 `test`） | `pnpm run test:coverage` |
| **快照（最关键）** | **两会话回放**：Session A 提升 → Session B 不重述仍召回并改变行为 | `pnpm run test:snapshot`（keyless） |
| SDK 投影 | 若 D-Q3 引入新会话事件 → TS ＋ Python SDK 期望输出同步 | 见 [docs/testing.md](../../../docs/testing.md#when-a-snapshot-test-is-required) |
| 门禁 | `pnpm run typecheck` / `lint` / `hygiene`（新包需过 knip／publint／workspace 约束） | 逐条 |

**规则**：按 [dsh-pre-push-checks](../../../.agents/skills/dsh-pre-push-checks/SKILL.md) 选**最窄**的检查；**不默认跑全量**。快照是 MVP 的**主要证据**，不是附带品——它比单元测试重要，因为只有它能证明"脱离对话"。

---

## 10. 成功 / 失败判据

### 10.1 成功判据（全部必须成立，缺一即未成功）

| # | 判据 | 检验方式 |
|---|---|---|
| S1 | Session A 的某个语义单元被提升为对象，且该对象**有 id、有 status、有出处** | 快照 ＋ `space_list` |
| S2 | 该对象在**进程重启**后仍存在 | 重启后 `space_list` |
| S3 | Session B **不重述** Session A 的内容，系统仍召回它 | 快照中 Session B 的用户输入不含该内容 |
| S4 | 召回的内容**进入 Session B 的模型请求** | 快照中的模型请求含 O 的 body／status |
| S5 | Session B 的行为**依赖**它（去掉召回则行为不同） | 对照回放：屏蔽 `space_recall` 后 Session B 行为变化 |
| S6 | decision 型的重复承诺走**更新**而非新建 | 对象计数不增加，`status` 改变 |

### 10.2 失败判据（任一条成立 → 本 MVP 以书面结论收尾）

| # | 失败形态 | 意味着 |
|---|---|---|
| F1 | 对象持久化了，但 Session B 从不召回它 | 闭环断在 **Recall**——问题在召回触发，不在存储 |
| F2 | 召回了，但 Session B 行为不变 | 闭环断在 **Affect**——"进入上下文"不等于"改变行为" |
| F3 | 提升出来的对象绝大多数无价值（语料上人工判读） | 断在 **Detect**——但这**不否定** S1–S5 的机制结论 |
| F4 | 每次都说同一个东西，对象数量爆炸 | **Resolve** 缺失（[10 §8.6](../../../研发/10_Move-Up-与-Move-Up-Detector.md)）——MVP 只做最小形态，不假装解决 |

> **F1／F2 是真正的失败**（它们否定 §0 的那句话）；**F3／F4 是范围外的已知未决**（它们否定的是"判定质量"，不是"机制存在"）。这个区分必须写进结论文档——否则 MVP 会被判定质量的失败掩盖机制的成立。

### 10.3 用户是否已经能感受到"和 Codex-like Agent 的根本差异"？

**诚实回答：能感受到一个窄的差异，但还不是"根本差异"。**

- **能感受到的**：Session B 里，用户**没有重述**昨天说过的东西，agent 却按它行动了。这是 Codex-like agent（无跨会话对象）做不到的。
- **感受不到的**：这个对象**还没有被系统组织、调度、表征**——它只是一条可被召回的记录。所以它证明的是"**内容层出现了可累积的东西**"（[11 §4.3](../../../研发/11_Sponge-事实地图.md)），**不是**"Space 会自我演化"。
- **因此**：本 MVP 的定位是**第一块基础设施**，不是差异的全部。若声称它已证明"根本差异"，那是把 [11 §4.2](../../../研发/11_Sponge-事实地图.md) 的"通用能力存在"误当成"Space 已在使用它们"。

---

## 11. 风险与依赖

### 11.1 风险

| 风险 | 缓解 |
|---|---|
| **把 MVP 的临时 Space 当成 Sponge 的信息空间** | §1.3 ＋ §5 的命名警告；结论文档显式声明 |
| **顺带回答了未决问题**（状态归属／域／生命周期） | §1.3 列出必须保持未决的三项；Agent Note 里逐条声明"本文不主张" |
| **detector 包被 MVP 顺手改写** | §4.2 倾向候选 A（不改 detector）；若必须改，单开一个 PR |
| **快照脆弱**（跨会话、时序） | 固定语料驱动；[testing.md](../../../docs/testing.md) 要求 fixture 在 macOS/Linux 可回放——修 fixture，不修 normalizer |
| **判定质量被误当成机制成败** | §10.2 的 F3／F4 与 F1／F2 明确分离 |

### 11.2 依赖

- **不阻塞**于 D-N（核心归属）：本 MVP 住 `packages/experimental/`，是 harness 内的实验件，与"核心是否独立仓"无关。
- **不阻塞**于 P0-1（通道）／P0-2（调度机制化）：本 MVP 不建通道、不建调度器。
- **不阻塞**于 S1′（结构落盘格式）：本 MVP 用自己的对象存储，不复用切片落盘格式——**因此也验证不了**"切片能不能当 Space Object"（[10 §8.4](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 保持未决）。

### 11.3 为什么本 MVP 可以不等核心

因为它证明的是**机制的存在性**，不是**机制的最终形态**。它用临时容器代替信息空间、用 status 字段代替生命周期、用规则 detector 代替判定算法——每一处替代都在 §1.3／§3／§10.2 里被标注为"非最终答案"。**先证明闭环能跑通，再谈它该长成什么样**（工作纪律：Understand → Observe → Compare → Experiment → Then Abstract → Then Implement）。

---

## 12. 本文引入的待裁决项

**M0 裁决（2026-10-08）：D-Q 与 D-Q1…D-Q4 均已裁决；完整结论与证据见 [研发/06](../../../研发/06_开放问题与决策.md) §五。本表只保留一行结论与指向，不重述。**

| # | 裁决项 | 裁决（2026-10-08） | 阻塞 |
|---|---|---|---|
| **D-Q1** | 对象存储：复用 `packages/storage` vs 自建 append-only JSONL | ☑ 复用 storage-domain ＋ storage-json（domain `space`／表 `objects`／`spaceId` 字段） | M1 |
| **D-Q2** | Detect→Promote：bridge 驱动（A）vs detector 通知（B） | ☑ A（不改已实现的实验件） | M1 |
| **D-Q3** | Promote 是否写会话事件 | ☑ 写（log-only `move-up/promoted`），代价是持久化目录与已知事件表同步 | M1 |
| **D-Q4** | MVP 的 Space 身份 ＝ 工作区根？ | ☑ 是（会话 `cwd` 派生 `spaceId`，不发明注册表） | M1 |
| **D-Q** | Move Up MVP 的落地位置与权威归属（总纲） | ☑ `packages/experimental/` 新包；detector 保持 shadow；Promote 与 Detect 分离（总纲待战略层验收） | M0 |

> 结论回填 [研发/06](../../../研发/06_开放问题与决策.md)（未决事项的单一入口），本文只指向、不重述。

---

## 13. MVP 之后的研究问题（F）

> 这些**不是** MVP 的一部分；列出它们是为了让 MVP 的边界有据可依。全部来自 [10 §8](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 与 [11 §2.4](../../../研发/11_Sponge-事实地图.md)。

| # | 问题 | 为什么关键 | MVP 后从哪入手 |
|---|---|---|---|
| R1 | **Semantic Chunk 如何确定** | 边界先于判定；V0 的"一条消息＝一个 chunk"是占位符 | 语料上试切分粒度，比较判定结果 |
| R2 | **Detector 判断**（五条候选信号是否成立、要不要承诺程度） | 决定判定质量（＝ F3 的根） | 用 MVP 的语料做"判定 vs 人工提升"对照 |
| R3 | **taxonomy**（对象类型是否真的分类） | [10 §9](../../../研发/10_Move-Up-与-Move-Up-Detector.md) 明确不把 09 的五类当输出类型 | MVP 的两种 kind 是否够用？第三种需求出现在哪 |
| R4 | **object lifecycle**（最小生命周期） | 没有它，"对象存在"不可检验 | status 字段是否够；要不要版本／归档／终止 |
| R5 | **Resolve**（Create vs Update） | 做不到 → 对象指数放大（＝ F4） | MVP 只做最小形态；语义等价是实体消解问题 |
| R6 | **用户确认边界**（Ask 是兜底还是主路径） | 决定认知负担与自主度 | 用 MVP 统计 ask 的比例与用户接受率 |
| R7 | **状态归属在哪** | [10 §8.9](../../../研发/10_Move-Up-与-Move-Up-Detector.md) ＝ [09 §IX Q3](../../../研发/09_可运行插件原语研究.md)；本仓以会话日志为唯一权威 | MVP 的对象存储**不是答案**，只是绕开 |
| R8 | **Space 自我演化**（结构／行为／表征／交互／方法层的累积） | [11 §4](../../../研发/11_Sponge-事实地图.md) 的层表；MVP 只碰"内容层" | 先有内容层，再谈其余五层如何接上 |
| R9 | **Detector 判定的可解释性** | [10 §8.10](../../../研发/10_Move-Up-与-Move-Up-Detector.md)；用户要知道"为什么它变成了对象" | 与 D-Q3（是否入日志）同源 |

---

## 附：本文引用清单

**论述**：[研发/10](../../../研发/10_Move-Up-与-Move-Up-Detector.md)（Move Up 概念记录，§6.2 Resolve／§7 例子／§8 未决／§9 边界）· [研发/11](../../../研发/11_Sponge-事实地图.md)（事实地图，§1 两层／§2.4 未知／§4 自我演化层表）· [研发/02 §3.8–3.9](../../../研发/02_概念与抽象类.md)（域／信息空间）· [研发/04](../../../研发/04_收敛设计.md)（固定层／调度三问）· [研发/06](../../../研发/06_开放问题与决策.md)（决策单一入口）· [研发/契约/切片-Slice-契约 §4](../../../研发/契约/切片-Slice-契约.md)（容器生命周期）· [研发/impl/src/base/](../../../研发/impl/src/base/)（切片 ＋ 快照存储）

**harness**：`packages/core/session/` · `packages/core/tools/` · `packages/experimental/move-up-detector/`（README ＋ Agent Note [`2026-09-24-move-up-detector-shadow-plugin.md`](../../../.agents/notes/implemented/architecture/2026-09-24-move-up-detector-shadow-plugin.md)）· `packages/storage/` · [docs/architecture.md](../../../docs/architecture.md) · [docs/testing.md](../../../docs/testing.md) · [plans/SPEC.md](../../SPEC.md)
# 头脑风暴 02：CAMEL × Sponge 分析坐标系

> 状态：发散中（不含决策）｜ 日期：2026-08-30 ｜ 依据：`2026-08-30-research-camel.md`（档案）+ 研发/ 定案
> 标记约定：**[档案]**=CAMEL 事实（出处见档案）｜**[笔记]**=Sponge 论述/决策｜**〔假设〕**=本文推断，未经检验

---

## 〇、坐标系的设计原则

1. **用 Sponge 自己的维度做轴**——不用通用框架对比表（功能/性能/生态），只保留对 Sponge 设计有决策意义的差异轴；
2. **每条轴都是光谱**（两端各站一个系统才是有效轴），并标注 CAMEL/Sponge 的位置；
3. **每条轴附"接触面"**——它触到 Sponge 的哪个板块、可能改变什么（假设，不是结论）。

---

## 一、本体层（系统是什么）

### A1 世界模型
**光谱**：把世界当工具（调用）→ 把世界当团队（协作）→ 把世界当住所（栖息）

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **团队协作者**（+ 模拟世界） | [档案] RolePlaying/Workforce=协作；OASIS=社交模拟——但世界是**被模拟的对象**，不是 agent 的住所 |
| Sponge | **栖息居民** | [笔记] 02 §3.9 容器本体；00"栖息于信息空间" |

〔假设〕接触面：OASIS 证明"世界级多 agent"可扩展；但 Sponge 的世界是 resident 的**住所与作品**，不是模拟对象——这条差异可能是"容器定位=真实空白"的外部佐证。

### A2 状态归属
**光谱**：状态属于 agent（内部记忆）→ 状态属于世界（外部结构）

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **agent 内部记忆**（可选共享） | [档案] AgentMemory/MemoryBlock/LongtermAgentMemory；Workforce 有 `share_memory` 开关 |
| Sponge | **世界内结构** | [笔记] 切片外部化/持久化/结构化；信息源（Statuz 独立层）供当下状态 |

〔假设〕接触面：`share_memory` 是"共享状态"的雏形；切片更强（可分/可子类化/内容寻址）。
⚠️ **误类比警报**：MemoryBlock 的 Composite 树 ≠ 自由容器——前者是记忆组织形态，后者是本体构造。

---

## 二、变化层（系统怎么变）

### B1 演化通道 ★ 最本质的分歧轴
**光谱**：改权重（RL/SFT）→ 改结构（pipeline/契约内演化）

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **改权重** | [档案] 设计原则 Evolvability 明写"可验证奖励的 RL 或监督学习"；SETA 就是 RL 训练管线（AReaL/miles + GRPO） |
| Sponge | **改结构** | [笔记] 00 野心一："自我演化不需要改权重，改结构就够了" |

〔假设〕张力：CAMEL 用 RL 提升 agent 能力，Sponge 用结构提升系统深度——两者**正交还是冲突**（若权重路线足够强，结构路线是否多余？）未检验。这是 CamEL 对 Sponge 最有价值的一条轴：**它提供了一条现成的对照路线**。

### B2 运行时可塑性
**光谱**：运行时换成员 → 运行时改构造

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **换成员** | [档案] `new_worker_agent` 模板可运行时新建 worker；AgentPool 复用实例 |
| Sponge | **改构造** | [笔记] AgentPark 改 pipeline；子类化；主体化（域迁移） |

〔假设〕接触面：CAMEL 的"动态组建团队"是 runtime plasticity 的先例；差异在**变的层次**——成员可变 vs 构造可变。

---

## 三、组织层（工作怎么被组织）

### C1 编排对象
**光谱**：编排任务 → 编排结构

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **任务** | [档案] Workforce：task_agent 拆解→coordinator 派活→并行执行→结果作为依赖存储→失败恢复 |
| Sponge | **结构/切片** | [笔记] 调度器三机制（编排/主动释放/演化）作用于切片与事件 |

〔假设〕关键差异：**任务会结束，结构会留存**——task dependency graph 的生命周期 ≠ 切片生命周期，CAMEL 的编排实现不可直接借用。
未知：Statuz 的 dependency-graph engine 是"状态依赖图"还是"任务依赖图"——**未核**。

### C2 组合单元
**光谱**：角色/worker → 切片/元素

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **角色** | [档案] AI User/AI Assistant/Critic；Workforce 的 worker/team |
| Sponge | **切片/元素** | [笔记] 切片=自由容器；元素=可调用单元 |

〔假设〕接触面：RolePlaying 证明"角色组合"能产生可观协作行为；假设"角色组合"可视为一种切片 kind（可子类化的场景）。

---

## 四、边界与主体（谁在里面）

### D1 人的位置 ★ 锋利轴
**光谱**：人的位置=外部资源（被呼叫）→ 主体（同类居民）

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **外部资源** | [档案] `HumanToolkit`——agent 执行中呼叫人类（澄清/批准/解阻），本质是工具调用 |
| Sponge | **同类主体** | [笔记] D-J：用户与 agent 同抽象类（域形式=主体域） |

〔假设〕接触面：HumanToolkit 证明"人被 agent 主动呼叫"可用；但它是主体抽象的**降级实现**（人无身份/域/权限/迁移）。**不可直接借用作 Sponge 的主体设计**。

### D2 可替换性层级
**光谱**：库级可替换 → 角色级 + 架构级可替换

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **库级** | [档案] toolkit / storage / model backend / embedding / retriever 均可替换 |
| Sponge | **角色级 + 架构级** | [笔记] 信息源接口（04 五：接口不得出现实现专属概念）+ 固定层（架构不可达） |

〔假设〕接触面：CAMEL 的抽象可作为"可替换零部件（C4）"的**下限参照**——Sponge 的强度要求更高。

---

## 五、增长与验证（怎么长大、怎么知道对）

### E1 规模化对象
**光谱**：agent 数量 → 结构复杂度/嵌套

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **agent 数量 + 环境数量** | [档案] Scalability=百万级 agent；SETA=环境规模化（slot pool 跨节点分发环境、env service） |
| Sponge | **结构复杂度/嵌套** | [笔记] 无限子类；容器嵌套（元进化引擎："下一个系统是 Sponge 的一个切片"） |

〔假设〕接触面：**SETA 与 Sponge 的容器/信息空间最接近**——它证明"环境是可工程化的规模化对象"。但 SETA 环境 = 可复现的 RL 任务沙漠，Sponge 信息空间 = agent 的持久住所；同词不同物。
〔假设〕外部佐证价值：即便 CMEL 也在把"环境"当一等公民（Scaling **Environments**），这对 Sponge 的"容器定位=真实空白"构成部分挑战——**是空白还是尚未命名？**

### E2 验证方式 ★ Sponge 的弱项 / CAMEL 的强项
**光谱**：基准+验证器+奖励 → 可证伪实验

| | 位置 | 依据 |
|---|---|---|
| CAMEL | **完整生态** | [档案] GAIA/CRAB/BrowseComp/API-Bank/RAGBench；verifiers（math/python/physics）；RL reward；Loong（verifier 驱动合成数据） |
| Sponge | **自建小型对照** | [笔记] context-recovery cost（北极星）；调研建议挂现成基准，但 MVP 阶段建议放弃 |

〔假设〕接触面：CAMEL 的 verifier/benchmark 生态是 Sponge 验证弱项的**方向参照**（不是代码借用）。

---

## 六、设计原则对照（附轴）

| CAMEL [档案] | Sponge [笔记] | 关系 |
|---|---|---|
| Evolvability（RL/SFT 进化） | 演化=改结构 | **对立**（B1） |
| Scalability（百万 agent） | 无限子类/嵌套 | 不同对象（E1） |
| Statefulness（有状态记忆） | 切片/状态层 | 同名不同物（A2） |
| **Code-as-Prompt**（代码即可被 agent 理解的提示） | **结构即数据 / agent 可改结构** | **同源**——都假设 agent 能读懂并改造自身环境；CAMEL 停在"可读"，Sponge 要求"可改" |

---

## 七、张力清单（候选冲突 + 证伪条件）

| # | 张力 | 证伪/检验方式 |
|---|---|---|
| T1 | **演化通道**：改权重 vs 改结构 | 同一长周期任务上跑 CAMEL 式 RL 提升 vs Sponge 式结构提升；若结构路线无增益 → Sponge 核心赌注被削弱 |
| T2 | **状态归属**：agent 记忆 vs 世界结构 | 若 `share_memory` 式共享记忆能达到切片同等效果 → 切片外部化的必要性需重新论证 |
| T3 | **编排对象**：任务（会结束） vs 结构（会留存） | 若任务级编排足以覆盖长周期任务的状态需求 → 结构编排的多余性 |
| T4 | **人的位置**：工具 vs 同类主体 | 若 HumanToolkit 式呼叫足以支撑 Coworker 形态 → 主体域形式是否过度设计 |
| T5 | **scaling 对象**：agent 数量 vs 结构复杂度 | 若"环境规模化"（SETA）已覆盖结构需求 → 容器定位是否只是"环境"的重命名 |

## 八、开放问题（供后续决策，本会不答）

1. Sponge 是否借 CAMEL 的 **verifier/benchmark 生态方向**补验证弱项？（E2）
2. 能否用 CAMEL 做 **B1 的对照实现**（RL 提升 vs 结构提升）？
3. "角色组合"是否可映射为一种切片 kind？（C2）
4. SETA 是否说明"容器/环境当一等公民"已是行业方向——Sponge 的容器定位是空白还是尚未命名？（E1）
5. 切片能否用 CAMEL 的 MemoryBlock **接口形态**做参照实现？（A2）

## 九、本会未决定（显式）

- ❌ 未决定引入 CAMEL（本分析只借坐标，不借依赖）
- ❌ 未决定采用任何 CAMEL 机制/代码
- ❌ 未决定改变 Sponge 的演化通道（仍为改结构）
- ❌ 未决定把 CAMEL 作为对照实现（仅列为候选）

---

## 十、可利用性分级（候选，未决策）

> 硬约束：CAMEL = Python，Sponge = TypeScript → **代码级复用基本不成立**；可利用性落在四个层面。

### L1 可直接用（基础设施与基准）——性价比最高

- **基准**：GAIA / CRAB / BrowseComp / API-Bank / RAGBench —— Sponge 的验证弱项（E2）可不必自建，直接把"容器版 agent"挂上去跑；
- **SETA 的环境基础设施形状**：本地/远程 Docker、slot pool（跨节点分发环境）、env service（CPU 服务器执行环境）+ scheduler —— 若 Sponge 做"容器规模化"实验，可参照其**架构形状**（不是代码）；
- ⚠️ 但验证对象不同：CAMEL 的 verifier 验证**答案**，Sponge 要验证**恢复成本/结构复用**——只借形状，不借内容。

### L2 可作对照（最高科学价值）

- **CAMEL = "改权重"路线的现成代表**（B1/T1）：它用可验证奖励 RL 提升能力，SETA 就是完整 RL 管线。
- **同一长周期任务上跑"CAMEL 式 RL 提升" vs "Sponge 式结构提升" = T1 的直接证伪实验。**
- 这是 CAMEL 对 Sponge **最不可替代的用途**：不是借它的东西，而是**拿它当对照组**。

### L3 可作概念来源（需改造，不可照搬）

| CAMEL 部件 | Sponge 接触面 | 改造要点 |
|---|---|---|
| `new_worker_agent`（运行时新建 worker） | 主体化 / 无限子类 | 它新建"团队成员"，Sponge 新建"构造"——层次不同 |
| `RecoveryDecision`（retry/replan/decompose） | 演化触发与回滚 | 它是**任务级恢复**，Sponge 需**结构级演化**（域迁移+快照回滚）；可借"决策即数据"的形态 |
| critic-in-the-loop | 主体/评审 | 可映射为评审类主体；CAMEL 的 critic 是回合内构件 |
| `share_memory` | 状态共享 | 共享**记忆** ≠ 共享**结构**（切片）：借直觉不借实现 |
| **Code-as-Prompt** | 结构即数据 / 可改结构 | **同源**（都假设 agent 能读懂环境）；Sponge 更进一层（可读→可改）；可借其**写作纪律** |
| BaseContextCreator（token 预算构造上下文） | 主动释放 | ⚠️ **方向可能相反**：它把记忆**拉进上下文**，Sponge 把状态**推到 agent**——需核清后再谈借 |

### L4 只能作竞争定义（迫使 Sponge 说清自己）

- **SETA 的 "Scaling Environments"**：CAMEL 已把"环境"当一等公民规模化。
- 它不提供可借之物，但逼出一个必须回答的问题（T5）：**Sponge 的容器与它的环境差在哪**——住所 vs 任务沙漠、持久生活 vs 可复现训练、agent 改造 vs 预设重置。

### L5 必须避开（会污染 Sponge）

- **Workforce 的任务中心编排** → 引入即抹平 C1 差异，Sponge 退回"任务编排器"；
- **typed 的 MemoryBlock / LongtermAgentMemory** → 引入即丢掉"自由容器 untyped"这一独占抽象（A2 误类比）；
- **HumanToolkit 当主体模型** → 把人降级为工具，与 D-J 主体域冲突；
- **"scaling law of agents" 的数量叙事** → Sponge 的规模化对象是结构复杂度，不是 agent 数量（E1）。

### 一句话排序

> CAMEL 对 Sponge 的价值：**① 对照物（改权重路线代表）＞ ② 基准与环境基础设施形状 ＞ ③ 少数概念来源（需改造）＞ ④ 竞争定义的压力 ＞ ⑤ 避开其任务中心与 typed 记忆。**

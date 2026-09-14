# 情报档案 01：CAMEL-AI（为头脑风暴准备）

> 状态：情报汇总（不含分析结论，供头脑风暴使用）｜ 搜集日期：2026-08-30
> 目的：回答"camel 框架能否启发 Sponge 设计"——本文只摆事实与出处，判断留待头脑风暴。

---

## 0. 一句话

**CAMEL-AI** = 开源社区 + 多 agent 框架，自称目标是 **"finding the scaling laws of agents"**；
三大应用方向：**数据生成、世界模拟、任务自动化**。

## 1. 设计原则（官方 README 原文，四条）

| 原则 | 原文要点 |
|---|---|
| **Evolvability** | 多 agent 系统通过生成数据与环境交互**持续进化**；由**可验证奖励的 RL** 或监督学习驱动 |
| **Scalability** | 面向**百万级 agent** 的协调、通信、资源管理 |
| **Statefulness** | agent 保持**有状态记忆**，支持与环境的多步交互 |
| **Code-as-Prompt** | 每一行代码与注释都是给 agent 的提示；代码必须清晰可读，人与 agent 都能读懂 |

## 2. 核心模块清单

Agents · Agent Societies · Data Generation · Models · Tools · **Memory** · Storages · Benchmarks ·
Interpreters · Data Loaders · Retrievers · **Runtime** · Human-in-the-Loop

## 3. Agent 类型（API reference 枚举）

ChatAgent（核心）；专用 agent：CriticAgent、TaskAgent、RoleAssignmentAgent、KnowledgeGraphAgent、
MCPAgent、RepoAgent、SearchAgent、EmbodiedAgent、DeductiveReasonerAgent、ProgrammedAgent、ToolAgent 系。

## 4. Societies（两大协作范式）

### 4.1 RolePlaying（回合制角色协作）
- 角色：**AI User**（出题/挑战）+ **AI Assistant**（作答/方案）+ 可选 **Critic**；
- 系统强制的结构：禁止角色翻转、固定输出格式（`Solution: …` / `Next request.`）、`CAMEL_TASK_DONE` 终止；
- 可选组件：task specifier、task planner、critic-in-the-loop（带评分标准）。

### 4.2 Workforce（中央编排引擎）
- 组件：`Workforce`（生命周期总控）+ `coordinator_agent`（派活）+ `task_agent`（拆解）
  + **`new_worker_agent`（运行时新建 worker 的模板）**；
- Worker 类型：`SingleAgentWorker`（用 AgentPool 复用 agent 实例）、`RolePlayingWorker`；
- 任务生命周期：**拆解 → 分配 → 并行执行 → 结果作为依赖存起来 → 失败恢复**（retry / replan / 再拆解）；
- 数据模型：WorkerConf / TaskResult / TaskAssignment / TaskAssignResult / **RecoveryDecision**；
- 可观测性：`callbacks` 观察生命周期事件与 metrics；`share_memory` 可共享记忆；
- **HITL**：`HumanToolkit` —— agent 执行中可呼叫人类（澄清 / 批准 / 解阻）。

## 5. Memory（分层组合式）

- 数据单元：`MemoryRecord`（message/role/uuid/extra_info）→ `ContextRecord`（+ score）；
- 抽象：`MemoryBlock`（**Composite 模式，支持树结构**）/ `BaseContextCreator`
  （**token 预算下的上下文构造算法**）/ `AgentMemory`（retrieve/get_context）；
- 实现：`ChatHistoryBlock`（按近期，keep_rate 加权）/ `VectorDBBlock`（按相似）
  / `LongtermAgentMemory`（两者混合）；Mem0 云存储集成；
- 可定制：自定义 ContextCreator、自定义向量块。

## 6. Environments / RL（最新主攻方向）

- **Environments**：single-step / multi-step RL 环境、verifiers（math / python / physics）；
- **SETA（arXiv 2607.10891，2026）**："Scaling Environments for Terminal Agents"——
  为 terminal agent 设计**弹性工具包 + 可扩展 RL 环境**；基础设施：
  本地 / 远程 Docker、**slot pool service**（跨节点分发环境）、**env service**（CPU 服务器上执行终端环境）+ scheduler；
  RL 用 AReaL / miles（GRPO）；产出 `Qwen3-8B-SETA-Env-RL` 模型与 `SETA-Env` 数据集；
- **Loong**：verifier 驱动的领域合成数据生成；
- **Benchmarks**：GAIA、CRAB、BrowseComp、API-Bank、RAGBench、Nexus 等。

## 7. 生态项目

OASIS（百万级社交模拟）· CRAB（Ubuntu/Android 跨环境自动化）· **OWL**（Optimized Workforce Learning，
真实任务多 agent）· ChatDev · Paper2Poster / Paper2Video · **Eigent**（自称 "World First Multi-agent Workforce"，商业产品）
· Agent Trust · Emos。

## 8. 关键出处

- 官网/社区：<https://www.camel-ai.org/>
- 仓库：<https://github.com/camel-ai/camel>
- 文档：<https://docs.camel-ai.org/> · 文档索引：<https://docs.camel-ai.org/llms.txt>
- Workforce：<https://docs.camel-ai.org/key_modules/workforce>
- Societies：<https://docs.camel-ai.org/key_modules/societies>
- Memory：<https://docs.camel-ai.org/key_modules/memory>
- 论文（NeurIPS 2023）：<https://arxiv.org/abs/2303.17760>
- SETA 仓库：<https://github.com/camel-ai/seta>（arXiv 2607.10891）
- SETA 环境包：<https://github.com/camel-ai/seta-env>

## 9. 待头脑风暴的问题（先列出，暂不回答）

1. CAMEL 的哪些概念/机制可能启发 Sponge 的哪些板块（容器 / 切片 / 调度器 / 域 / 主体 / Editor）？
2. 哪些是**表面相似、本质不同**的误类比，必须警惕？
3. 哪些可以借、哪些必须避开（尤其与 Sponge 的核心赌注冲突的部分）？

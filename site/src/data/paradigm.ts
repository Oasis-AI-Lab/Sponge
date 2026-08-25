import type { ContentPageData } from "./content";

export const en: ContentPageData = {
  positioning:
    "Sponge is an AI system paradigm: reframing the agent from a conversational Q&A machine into a self-evolving, freely recomposable, scheduler-driven sliced system. The agent no longer only answers questions — it inhabits an information space it can control, reshape, and evolve.",
  status: { label: "Converged design", level: "stable" },
  blocks: [
    {
      title: "The shared fatal assumption",
      body: "Conversational, retrieval, long-context, and memory-module paradigms share one fatal assumption: the agent knows what to ask. On long-horizon, zero-to-one, research-grade tasks that assumption systematically fails — the agent does not know what it does not know.",
      items: [
        {
          name: "Conversational",
          body: "Collaboration is treated as an extension of Q&A. The agent can only respond, never construct: no goal tree, no state, no weight.",
        },
        {
          name: "Retrieval / RAG",
          body: "Assumes the agent knows what to ask. On long-cycle tasks the agent does not know its own blind spots, so retrieval cannot find what it does not seek.",
        },
        {
          name: "Long context",
          body: "Assumes a bigger window means better memory. Context is consumable — a larger window is just greater forgetting.",
        },
        {
          name: "Memory modules",
          body: "Packages state, experience, evolution, and forgetting into a sellable story. It grabs a real pain point but declares victory too early.",
        },
      ],
    },
    {
      title: "Three design constraints",
      body: "Three constraints were confirmed before the converged design. They are the hard lines that keep self-evolution from collapsing into infinite regression.",
      items: [
        {
          name: "Fixed layer",
          body: "Without a fixed layer, self-evolution is infinite regression — who modifies the agent that modifies the pipeline? A hard line must separate the unchanging contract (foundation) from mutable slice content (building).",
        },
        {
          name: "Scheduling touchstone",
          body: "After convergence, if orchestration = graph execution, active release = delegating the Statuz attention layer, and evolution = version management, then it is mechanism and Sponge holds. If it stays three verbs, Sponge collapses into scaffolding plus a good prompt.",
        },
        {
          name: "Interface abstraction",
          body: "Replaceable parts are currently a single-source reality. The InfoSource interface must be abstracted to the strength that Statuz is merely the first implementation — otherwise replaceability is just pretty words.",
        },
      ],
    },
    {
      title: "A falsifiable paradigm",
      body: "Converged design makes Sponge testable: every claim can be checked — and checked again. Five claims, each with a falsification condition.",
      items: [
        {
          name: "C1 — The shared fatal assumption",
          body: "Weakened if, on long-cycle tasks, conversational paradigms' context-recovery cost matches Sponge's and task completion shows no significant difference.",
        },
        {
          name: "C2 — The sliced externalized state model",
          body: "Weakened if pure scaffolding plus a good prompt performs no better than Sponge's scheduling system on benchmark tasks.",
        },
        {
          name: "C3 — The scheduler is the moat",
          body: "Weakened under the same condition as C2: the scheduler must earn its keep against scaffolding plus prompt.",
        },
        {
          name: "C4 — Information sources are replaceable roles",
          body: "Weakened if interfaces cannot be abstracted to the strength that Statuz is only the first implementation.",
        },
        {
          name: "C5 — Two modes, one architecture",
          body: "Weakened if FullyAgent and Coworker prove to be architecture-level differences rather than two configurations of the same architecture.",
        },
      ],
    },
    {
      title: "Boundary",
      body: "Sponge is defined as much by what it is not as by what it is.",
      items: [
        {
          name: "Not a bigger context window",
          body: "A larger window is greater forgetting, not understanding.",
        },
        {
          name: "Not a memory module",
          body: "State, experience, evolution, and forgetting deserve honest system design — not another component bolted on.",
        },
        {
          name: "Not scaffolding plus a good prompt",
          body: "That is the collapse condition, not the paradigm. The scheduler is the structure others do not have.",
        },
        {
          name: "Not a Q&A machine",
          body: "The agent does not answer questions; it inhabits an information space it can control, reshape, and evolve.",
        },
      ],
    },
  ],
  links: [
    { label: "Concepts", href: "/concepts/" },
    { label: "Ecosystem", href: "/ecosystem/" },
  ],
};

export const zh: ContentPageData = {
  positioning:
    "Sponge 是一种 AI 系统范式：把智能体从「对话式问答机」重构为可自我演化、可自由重组、由内部调度系统驱动的切片化系统。智能体不再只是回答问题，而是栖息于一个它可以掌控、可以改造、可以进化的信息空间。",
  status: { label: "收敛设计", level: "stable" },
  blocks: [
    {
      title: "共享的致命假设",
      body: "对话式、检索式、长上下文、记忆模块化四种主流范式共享一个致命假设——「智能体知道自己该问什么」。在长周期、零到一、研究型任务上，该假设系统性失效：智能体不知道自己不知道什么。",
      items: [
        {
          name: "对话式",
          body: "把协作当作问答的延伸。智能体只能回应，无法建构：没有目标树、没有状态、没有权重。",
        },
        {
          name: "检索式 / RAG",
          body: "假设智能体知道自己该问什么。长周期任务中智能体不知道自己的盲区，检索找不到它不曾寻找的东西。",
        },
        {
          name: "长上下文",
          body: "假设窗口越大记得越多。上下文是消耗品——更大的窗口只是更大的遗忘。",
        },
        {
          name: "记忆模块化",
          body: "把状态、经验、演化、遗忘打包成一个可销售的故事。抓住了真实的痛点，却过早宣布胜利。",
        },
      ],
    },
    {
      title: "三条设计约束",
      body: "收敛设计启动前确认了三条约束。它们是让自我演化不至于坍缩成无限回归的硬线。",
      items: [
        {
          name: "固定层约束",
          body: "没有「固定层」的自我演化是无限回归——谁改那个改 pipeline 的 agent？必须划出硬线：什么是不变的契约（地基），什么是可变的切片内容（建筑）。",
        },
        {
          name: "调度试金石",
          body: "收敛后如果「编排 = 图执行、主动释放 = 委托 Statuz 注意力层、演化 = 版本管理」，那它就是机制，Sponge 成立；如果仍是三个动词，Sponge 坍缩回「脚手架 + 好 prompt」。",
        },
        {
          name: "接口抽象约束",
          body: "「可替换零部件」目前是单源现实。信息源接口必须抽象到「Statuz 只是第一个实现」的强度，否则可替换性只是漂亮话。",
        },
      ],
    },
    {
      title: "可证伪的范式",
      body: "收敛设计让 Sponge 第一次变得可检验：每个主张都能被验证——再被验证。五个主张，各有证伪条件。",
      items: [
        {
          name: "C1 — 共享的致命假设",
          body: "若长周期任务上对话式范式的上下文恢复成本与 Sponge 相当、任务完成率无显著差异 → C1 被削弱。",
        },
        {
          name: "C2 — 切片化外部化状态模型",
          body: "若「纯脚手架 + 良好 prompt」在基准任务上表现不逊于 Sponge 调度系统 → C2/C3 被削弱。",
        },
        {
          name: "C3 — 调度系统是护城河",
          body: "与 C2 同条件：调度系统必须在对阵「脚手架 + prompt」时证明自己。",
        },
        {
          name: "C4 — 信息源是可替换角色",
          body: "若接口无法抽象到「Statuz 只是第一个实现」的强度 → C4 被削弱。",
        },
        {
          name: "C5 — 双形态同架构",
          body: "若 FullyAgent 与 Coworker 被证明是架构级差异而非同一架构的两种配置 → C5 被削弱。",
        },
      ],
    },
    {
      title: "边界",
      body: "Sponge 由「不是什么」与「是什么」共同定义。",
      items: [
        {
          name: "不是更大的上下文窗口",
          body: "更大的窗口是更大的遗忘，不是理解。",
        },
        {
          name: "不是记忆模块",
          body: "状态、经验、演化、遗忘值得诚实的系统设计——而不是再外挂一个组件。",
        },
        {
          name: "不是脚手架 + 好 prompt",
          body: "那是坍缩条件，不是范式。调度系统是别人没有的结构。",
        },
        {
          name: "不是问答机",
          body: "智能体不是回答问题，而是栖息于一个它可以掌控、可以改造、可以进化的信息空间。",
        },
      ],
    },
  ],
  links: [
    { label: "概念", href: "/zh/concepts/" },
    { label: "生态", href: "/zh/ecosystem/" },
  ],
};

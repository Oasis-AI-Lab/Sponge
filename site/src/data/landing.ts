export interface HeroContent {
  kicker: string;
  title: string;
  tagline: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
}

export interface FlawContent {
  title: string;
  body: string;
  items: string[];
}

export interface MechanismContent {
  name: string;
  desc: string;
  glow: boolean;
}

export interface AmbitionContent {
  name: string;
  desc: string;
}

export interface EcosystemContent {
  title: string;
  body: string;
  layers: { level: string; name: string; role: string }[];
}

export interface MvpContent {
  title: string;
  items: string[];
}

export interface CtaContent {
  docsLabel: string;
  docsHref: string;
  paperLabel: string;
  paperHref: string;
}

export interface LandingContent {
  hero: HeroContent;
  flaw: FlawContent;
  mechanisms: { title: string; items: MechanismContent[] };
  ambitions: { title: string; items: AmbitionContent[] };
  ecosystem: EcosystemContent;
  mvp: MvpContent;
  cta: CtaContent;
}

export const en: LandingContent = {
  hero: {
    kicker: "An AI system paradigm",
    title: "Sponge",
    tagline:
      "Reconstructing the agent — from a conversational Q&A machine into a sliced system that is self-evolving, freely recomposable, and driven by an internal scheduler. The agent no longer only answers questions; it dwells in an information space it can control, reshape, and evolve.",
    ctaPrimary: "Explore the paradigm",
    ctaPrimaryHref: "/paradigm/",
    ctaSecondary: "Read the paper",
    ctaSecondaryHref: "/paper/",
  },
  flaw: {
    title: "The shared fatal assumption",
    body: "Conversational, retrieval, long-context, and memory-module paradigms share one fatal assumption: the agent knows what to ask. On long-horizon, zero-to-one, research-grade tasks, that assumption systematically fails — the agent does not know what it does not know.",
    items: ["Conversational", "Retrieval / RAG", "Long context", "Memory modules"],
  },
  mechanisms: {
    title: "Three mechanisms",
    items: [
      {
        name: "Slice",
        desc: "Free containers. Persistent, nameable, subclassable — the base class of every abstract class in Sponge.",
        glow: false,
      },
      {
        name: "AgentPark",
        desc: "The pipeline space an AI can freely control and modify. Its modification boundary is the whole evolution layer.",
        glow: false,
      },
      {
        name: "Scheduler",
        desc: "Orchestration · active release · evolution. The core moat: anyone can copy the scaffold — the scheduler is the structure others do not have.",
        glow: true,
      },
    ],
  },
  ambitions: {
    title: "Five ambitions",
    items: [
      {
        name: "Power transfer",
        desc: "Hand the power to reshape pipelines to the agent itself. Self-evolution needs no weight change — changing structure is enough.",
      },
      {
        name: "Cognizable cognition",
        desc: "Depth becomes a system property, not a model property. Cognition can be built, not only learned.",
      },
      {
        name: "The end of context",
        desc: "The agent dwells in the world instead of dragging it into a window. The world is topology, not tokens.",
      },
      {
        name: "Meta-evolution engine",
        desc: "Not the best agent — the ground that grows every agent. The next system is not a competitor but a slice.",
      },
      {
        name: "A falsifiable paradigm",
        desc: "Converged design makes Sponge testable: every claim can be checked — and checked again.",
      },
    ],
  },
  ecosystem: {
    title: "Ecosystem",
    body: "Statuz is an independent global state layer, connected through the InfoSource interface — the first implementation, not the only one. WAM, Lemma and Sandboxer grow on the same ground.",
    layers: [
      { level: "Independent layer", name: "Statuz", role: "Global state layer · cross-device · attention" },
      { level: "Paradigm layer", name: "Sponge", role: "Slices · elements · info source · channel · scheduler" },
      { level: "Derivatives", name: "WAM · Lemma · Sandboxer", role: "Representation applications on the same ground" },
    ],
  },
  mvp: {
    title: "Current state",
    items: [
      "Base slice built — the foundation of every abstract class",
      "10/10 verification tests green, incl. the derivation demo",
      "Next: element · scheduler · channel",
    ],
  },
  cta: {
    docsLabel: "Read the docs",
    docsHref: "/docs/",
    paperLabel: "The paper",
    paperHref: "/paper/",
  },
};

export const zh: LandingContent = {
  hero: {
    kicker: "一种 AI 系统范式",
    title: "Sponge",
    tagline:
      "把智能体从「对话式问答机」重构为可自我演化、可自由重组、由内部调度系统驱动的切片化系统。智能体不再只是回答问题，而是栖息于一个它可以掌控、可以改造、可以进化的信息空间。",
    ctaPrimary: "探索范式",
    ctaPrimaryHref: "/zh/paradigm/",
    ctaSecondary: "阅读论文",
    ctaSecondaryHref: "/zh/paper/",
  },
  flaw: {
    title: "共享的致命假设",
    body: "对话式、检索式、长上下文、记忆模块化四种主流范式共享一个致命假设——「智能体知道自己该问什么」。在长周期、零到一、研究型任务上，该假设系统性失效：智能体不知道自己不知道什么。",
    items: ["对话式", "检索式 / RAG", "长上下文", "记忆模块化"],
  },
  mechanisms: {
    title: "三个核心机制",
    items: [
      {
        name: "切片 Slice",
        desc: "自由容器。可持久、可命名、可子类化——Sponge 所有抽象类的基类。",
        glow: false,
      },
      {
        name: "AgentPark",
        desc: "AI 可自由掌控、更改 Pipeline 的空间。修改边界 = 演化层全集。",
        glow: false,
      },
      {
        name: "调度系统 Scheduler",
        desc: "编排 · 主动释放 · 演化。核心壁垒：脚手架可以被复制，调度系统是别人没有的结构。",
        glow: true,
      },
    ],
  },
  ambitions: {
    title: "五条野心",
    items: [
      {
        name: "权力转移",
        desc: "把改造 pipeline 的权力交给 agent 自己。自我演化不需要改权重——改结构就够了。",
      },
      {
        name: "认知可建造",
        desc: "思考深度成为系统属性而非模型属性。认知可以建造，不只可以学习。",
      },
      {
        name: "终结上下文",
        desc: "agent 栖息于世界，而不是把世界拉进窗口。世界是拓扑，不是 token 流。",
      },
      {
        name: "元进化引擎",
        desc: "不做最好的 agent，做长出所有 agent 的基底。下一个系统不是竞品，而是一个切片。",
      },
      {
        name: "可证伪的范式",
        desc: "收敛设计让 Sponge 可检验：每个主张都能被验证——再被验证。",
      },
    ],
  },
  ecosystem: {
    title: "生态",
    body: "Statuz 是独立全局状态层，经「信息源」接口对接——第一个实现，不是唯一实现。WAM、Lemma、Sandboxer 长在同一片地基上。",
    layers: [
      { level: "独立层", name: "Statuz", role: "全局状态层 · 跨设备 · 注意力" },
      { level: "范式层", name: "Sponge", role: "切片 · 元素 · 信息源 · 通道 · 调度" },
      { level: "衍生物", name: "WAM · Lemma · Sandboxer", role: "同一地基上的表征应用" },
    ],
  },
  mvp: {
    title: "当前状态",
    items: [
      "基类切片已建成——所有抽象类的地基",
      "10/10 验证测试全绿（含派生 demo）",
      "下一步：元素 · 调度 · 通道",
    ],
  },
  cta: {
    docsLabel: "阅读文档",
    docsHref: "/zh/docs/",
    paperLabel: "论文",
    paperHref: "/zh/paper/",
  },
};

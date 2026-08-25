import type { StatusLevel } from "./content";

export interface ConceptContent {
  slug: string;
  name: string;
  term: string;
  status: StatusLevel;
  positioning: string;
  definition: string;
  properties: string[];
  relationships: string[];
  boundary: string[];
  openQuestions?: string[];
}

export const en: ConceptContent[] = [
  {
    slug: "slice",
    name: "Slice",
    term: "切片",
    status: "stable",
    positioning:
      "Free container. Persistent, nameable, subclassable — the base class of every abstract class in Sponge.",
    definition:
      "The abstract class for a persistent, named, subclassable container. Slice organizes units, carries elements, and can be subclassed into infinitely many subclasses. It is the foundation every other abstract class builds on.",
    properties: [
      "Free container — organizes units and carries elements",
      "Persistent — content-addressed snapshots",
      "Nameable — every slice has a name",
      "Subclassable — infinite subclasses",
      "Callable by agents",
    ],
    relationships: [
      "Base class of every abstract class in Sponge",
      "Contains Element — components inside a slice",
      "WAM, Lemma, Sandboxer, Statuz grow as subclasses",
    ],
    boundary: [
      "Does not interpret semantics — representation is not Slice's job",
      "Does not decide when to release — that belongs to the scheduler",
      "Does not store the current state — that belongs to InfoSource / Statuz",
    ],
  },
  {
    slug: "element",
    name: "Element",
    term: "元素",
    status: "proposal",
    positioning: "A component inside a slice; a callable functional unit.",
    definition:
      "Element is a component inside a slice and a callable functional unit. Its precise boundary relative to plugins is still being settled.",
    properties: [
      "Component inside a slice",
      "Callable functional unit",
      "A distinct abstract class, separate from Slice",
    ],
    relationships: [
      "Lives under Slice in the system map",
      "Boundary vs plugin is an open question",
    ],
    boundary: [
      "Boundary relative to plugin is not yet settled",
      "Not fully resolved whether elements are plugins or a separate kind",
    ],
    openQuestions: ["What is the precise boundary between Element and plugin?"],
  },
  {
    slug: "infosource",
    name: "InfoSource",
    term: "信息源",
    status: "stable",
    positioning:
      "The interface role that provides the current state; Statuz is the first implementation.",
    definition:
      "InfoSource is an interface role that supplies the current state. It is an abstract role, deliberately independent of Statuz — Statuz is merely its first implementation, not the only one.",
    properties: [
      "Provides the current state",
      "Internal, controllable information",
      "The system can traverse, impact, and path through it",
      "Interface independent of Statuz",
    ],
    relationships: [
      "Statuz is an independent implementation of InfoSource",
      "Pipeline: native representation → InfoSource/Statuz (current state) → scheduler → agent",
      "Not Receiver — Receiver handles external uncontrollable information",
    ],
    boundary: [
      "An interface role, not the same as Statuz",
      "Does not handle external reception — Receiver's role",
      "Does not handle conversion — Translator's role",
    ],
  },
  {
    slug: "scene",
    name: "Scene",
    term: "场景",
    status: "stable",
    positioning:
      "User-facing representation: Lemma's learning methods, WAM's thinking pipelines.",
    definition:
      "Scene is the easiest-to-understand abstract class: the user-facing representation of learning, thinking, or tool use. Lemma's learning methods and WAM's thinking pipelines are Scene instances.",
    properties: [
      "User-facing representation",
      "Lemma's learning methods are instances",
      "WAM's thinking pipelines are instances",
      "The ground does not know which upper layer it serves",
    ],
    relationships: [
      "Lemma is an instance under Scene",
      "WAM is an instance under Scene",
      "May generalize to subject-facing representation",
    ],
    boundary: [
      "Not the underlying mechanism — it is the user-facing representation",
    ],
  },
  {
    slug: "translator",
    name: "Translator",
    term: "翻译器",
    status: "stable",
    positioning:
      "Converts external information into native representation — scaffolding components.",
    definition:
      "Translator is an independent abstract conversion role that materializes external information into native representation: Sponge scaffolding components. It completes the uncontrollable → controllable transition.",
    properties: [
      "Converts external information into native representation",
      "Output = scaffolding components",
      "Independent abstract class",
      "Calling-party neutral: system pipeline or agent",
      "Pairs with Receiver as the receive/convert pair",
    ],
    relationships: [
      "Paired with Receiver: Receiver introduces, Translator materializes",
      "Pipeline: external world → Receiver → Translator → native representation → InfoSource/Statuz → scheduler → agent",
      "Native representation = slice/element scaffolding + native metadata",
    ],
    boundary: [
      "Not Receiver — Receiver only accepts, Translator materializes",
      "Not InfoSource — InfoSource supplies current state",
      "Does not change structure — that belongs to Channel. Conversion ≠ modification",
    ],
  },
  {
    slug: "receiver",
    name: "Receiver",
    term: "接收器",
    status: "stable",
    positioning: "The reception entrance for external uncontrollable information.",
    definition:
      "Receiver is the reception entrance for external uncontrollable information — BBC news columns, for example. It introduces information without changing its nature.",
    properties: [
      "Accepts external uncontrollable information",
      "Introduces only, does not change information nature",
      "Pairs with Translator as the receive/convert pair",
    ],
    relationships: [
      "Paired with Translator: Receiver answers how information enters; Translator answers how it becomes controllable",
      "Not closely related to InfoSource: Receiver is the external entrance, InfoSource is internal controllable state",
    ],
    boundary: [
      "Only handles external, uncontrollable information",
      "Does not materialize or structure information",
      "Does not provide current state — InfoSource / Statuz's role",
    ],
  },
  {
    slug: "channel",
    name: "Channel",
    term: "通道",
    status: "draft",
    positioning: "A mechanism for deeper-level modification.",
    definition:
      "Channel is a mechanism for deeper-level modification — structural change, not conversion. It is the least formalized concept and the highest priority to formalize.",
    properties: [
      "Deeper-level modification mechanism",
      "Responsible for structural modification, not conversion",
      "Freer in evolving domains, constrained in settled domains",
    ],
    relationships: [
      "Translator converts; Channel modifies structure",
      "Conversion ≠ modification",
    ],
    boundary: [
      "Not Translator — conversion materializes external information; modification changes structure",
      "Still the least formalized concept",
    ],
    openQuestions: ["What exactly is Channel? (P0 — blocks everything)"],
  },
  {
    slug: "agentpark",
    name: "AgentPark",
    term: "AgentPark",
    status: "stable",
    positioning: "The pipeline space an AI can freely control and modify.",
    definition:
      "AgentPark is the space where an AI can freely control and modify pipelines. Its modification boundary is the whole evolution layer.",
    properties: [
      "AI can freely control",
      "AI can modify pipelines",
      "Modification boundary = the whole evolution layer",
    ],
    relationships: [
      "Sits alongside Slice, Element, and Channel in the system map",
      "Requires the fixed layer to avoid infinite regression",
    ],
    boundary: [
      "A control/pipeline space, not a container, receiver, translator, or information source",
    ],
  },
  {
    slug: "op-domain",
    name: "Op-Domain",
    term: "运算域",
    status: "stable",
    positioning: "Transient operands (select → operate → done), from Glora.",
    definition:
      "Op-Domain is a transient operand created by user selection, operation, and completion. It comes from Glora and is already implemented.",
    properties: [
      "Transient operand",
      "Select → operate → done",
      "Already implemented",
    ],
    relationships: [
      "Open question: can Op-Domain solidify into a Slice?",
      "Naming conflict with the broader non-abstract Domain",
    ],
    boundary: [
      "Transient, unlike Slice's persistence, naming, and subclassing",
    ],
    openQuestions: [
      "Can Op-Domain solidify into a Slice?",
      "How is the naming conflict between Domain and Op-Domain resolved?",
    ],
  },
  {
    slug: "subject",
    name: "Subject",
    term: "主体",
    status: "proposal",
    positioning:
      "The common abstract class for users and agents — carrier of actorhood, identity, permissions, perspective.",
    definition:
      "Subject is the common abstract class for users and agents, originating from Sandboxer's identity-group idea: putting users and agents into the same observation group. It is a proposal awaiting finalization.",
    properties: [
      "Actor — can initiate actions",
      "Identity — recognizable, authorizable",
      "Permissions — the carrier of permissions",
      "Perspective — everyone has a perspective",
      "Related to the two modes: FullyAgent and Coworker",
    ],
    relationships: [
      "FullyAgent = only agent Subjects",
      "Coworker = user Subject + agent Subject sharing a world",
      "Translator/Receiver calling parties can be literalized as Subject",
      "Tension: if Subject subclasses Slice, users become slices",
    ],
    boundary: [
      "Still a proposal, pending team approval",
      "Relation to Slice unresolved",
    ],
    openQuestions: ["Is Subject a subclass of Slice or a parallel abstract class?"],
  },
];

export const zh: ConceptContent[] = [
  {
    slug: "slice",
    name: "Slice",
    term: "切片",
    status: "stable",
    positioning: "自由容器。可持久、可命名、可子类化——Sponge 所有抽象类的基类。",
    definition:
      "可持久、可命名、可子类化的容器抽象类。切片负责组织单元、承载元素，可子类化为无限子类。它是所有其他抽象类的地基。",
    properties: [
      "自由容器——组织单元、承载元素",
      "可持久——内容寻址快照",
      "可命名——每个切片都有名字",
      "可子类化——无限子类",
      "可被 agent 调用",
    ],
    relationships: [
      "Sponge 所有抽象类的基类",
      "包含元素——切片内的组件",
      "WAM、Lemma、Sandboxer、Statuz 作为子类生长",
    ],
    boundary: [
      "不解释语义——表征不是切片的职责",
      "不决定何时释放——那是调度系统的职责",
      "不存储「当下状态」——那是信息源 / Statuz 的职责",
    ],
  },
  {
    slug: "element",
    name: "Element",
    term: "元素",
    status: "proposal",
    positioning: "切片内的组件；可被调用的功能单元。",
    definition:
      "元素是切片内的组件、可被调用的功能单元。它与插件的精确边界仍在界定中。",
    properties: [
      "切片内的组件",
      "可被调用的功能单元",
      "独立于切片的抽象类",
    ],
    relationships: [
      "位于切片之下（系统地图）",
      "与插件的边界是开放问题",
    ],
    boundary: [
      "与插件的边界尚未界定",
      "元素是否为插件、或独立一类，尚未定论",
    ],
    openQuestions: ["元素与插件的精确边界？"],
  },
  {
    slug: "infosource",
    name: "InfoSource",
    term: "信息源",
    status: "stable",
    positioning: "提供「当下状态」的接口角色；Statuz 是首个实现。",
    definition:
      "信息源是提供「当下状态」的接口角色。它是抽象角色，刻意独立于 Statuz——Statuz 只是它的第一个实现，不是唯一实现。",
    properties: [
      "提供「当下状态」",
      "内部可操控的信息",
      "系统可 traverse / impact / path",
      "接口独立于 Statuz",
    ],
    relationships: [
      "Statuz 是信息源的独立实现",
      "管道：原生表征 → 信息源/Statuz（当下状态）→ 调度 → agent",
      "不是接收器——接收器处理外部不可控信息",
    ],
    boundary: [
      "是接口角色，不是 Statuz 本身",
      "不处理外部接收——那是接收器的职责",
      "不处理转换——那是翻译器的职责",
    ],
  },
  {
    slug: "scene",
    name: "Scene",
    term: "场景",
    status: "stable",
    positioning: "面向用户的表征：Lemma 的学习方式、WAM 的思考 Pipeline。",
    definition:
      "场景是最容易理解的抽象类：学习、思考或工具使用的面向用户表征。Lemma 的学习方式、WAM 的思考 Pipeline 都是场景实例。",
    properties: [
      "面向用户的表征",
      "Lemma 的学习方式是实例",
      "WAM 的思考 Pipeline 是实例",
      "地基不感知上层是谁",
    ],
    relationships: [
      "Lemma 是场景下的实例",
      "WAM 是场景下的实例",
      "可能泛化为「面向主体的表征」",
    ],
    boundary: [
      "不是底层机制——它是面向用户的表征",
    ],
  },
  {
    slug: "translator",
    name: "Translator",
    term: "翻译器",
    status: "stable",
    positioning: "将外部信息转换为原生表征（脚手架构件）的转换角色。",
    definition:
      "翻译器是独立的抽象转换角色，将外部信息物化为原生表征——Sponge 脚手架构件。它完成「不可控 → 可控」的转变。",
    properties: [
      "将外部信息转换为原生表征",
      "输出 = 脚手架构件",
      "独立抽象类",
      "调用主体中立：系统管道或 agent 皆可",
      "与接收器构成「接收/转换」对",
    ],
    relationships: [
      "与接收器成对：接收器引入，翻译器物化",
      "管道：外部世界 → 接收器 → 翻译器 → 原生表征 → 信息源/Statuz → 调度 → agent",
      "原生表征 = 切片/元素脚手架 + 原生元数据",
    ],
    boundary: [
      "不是接收器——接收器只接受，翻译器物化",
      "不是信息源——信息源提供当下状态",
      "不做结构改造——那是通道的职责。转换 ≠ 改造",
    ],
  },
  {
    slug: "receiver",
    name: "Receiver",
    term: "接收器",
    status: "stable",
    positioning: "接受外部不可控信息的接收入口。",
    definition:
      "接收器是外部不可控信息的接收入口——例如 BBC 新闻专栏。它引入信息，不改变信息性质。",
    properties: [
      "接受外部不可控信息",
      "只引入，不改变信息性质",
      "与翻译器构成「接收/转换」对",
    ],
    relationships: [
      "与翻译器成对：接收器回答信息怎么进来；翻译器回答进来的信息怎么变成可操控的形态",
      "与信息源关系不密切：接收器是外部入口，信息源是内部可控状态层",
    ],
    boundary: [
      "只处理外部不可控信息",
      "不物化、不结构化信息",
      "不提供当下状态——那是信息源 / Statuz 的职责",
    ],
  },
  {
    slug: "channel",
    name: "Channel",
    term: "通道",
    status: "draft",
    positioning: "更深层次改造的机制。",
    definition:
      "通道是更深层次改造的机制——结构改造，而非转换。它是最未形式化的概念，也是形式化的最高优先级。",
    properties: [
      "更深层次改造的机制",
      "负责结构改造，而非转换",
      "待进化域里自由，确定域里受限",
    ],
    relationships: [
      "翻译器转换；通道改造结构",
      "转换 ≠ 改造",
    ],
    boundary: [
      "不是翻译器——转换物化外部信息；改造改变结构",
      "仍是最未形式化的概念",
    ],
    openQuestions: ["通道到底是什么？（P0，阻塞一切）"],
  },
  {
    slug: "agentpark",
    name: "AgentPark",
    term: "AgentPark",
    status: "stable",
    positioning: "AI 可自由掌控、更改 Pipeline 的空间。",
    definition:
      "AgentPark 是 AI 可自由掌控、更改 Pipeline 的空间。它的修改边界 = 演化层全集。",
    properties: [
      "AI 可自由掌控",
      "AI 可更改 Pipeline",
      "修改边界 = 演化层全集",
    ],
    relationships: [
      "与切片、元素、通道并列于系统地图",
      "需要固定层以避免无限回归",
    ],
    boundary: [
      "是控制 / Pipeline 空间，不是容器、接收器、翻译器或信息源",
    ],
  },
  {
    slug: "op-domain",
    name: "Op-Domain",
    term: "运算域",
    status: "stable",
    positioning: "瞬态操作数（框选 → 运算 → 结束），来自 Glora。",
    definition:
      "运算域是由用户框选、运算、结束产生的瞬态操作数。它来自 Glora，已实现。",
    properties: [
      "瞬态操作数",
      "框选 → 运算 → 结束",
      "已实现",
    ],
    relationships: [
      "开放问题：运算域能否「固化」为切片？",
      "与更广义的非抽象「域」存在命名冲突",
    ],
    boundary: [
      "瞬态，不同于切片的持久、命名、子类化",
    ],
    openQuestions: [
      "运算域能否「固化」为切片？",
      "「域」与「运算域」的命名冲突如何裁决？",
    ],
  },
  {
    slug: "subject",
    name: "Subject",
    term: "主体",
    status: "proposal",
    positioning:
      "用户与 agent 的共同抽象类——行动者、身份、权限、视角的载体。",
    definition:
      "主体是用户与 agent 的共同抽象类，源自 Sandboxer 的「身份组」构想：把用户与 agent 放进同一个「观察」组。它是待定稿的提案。",
    properties: [
      "行动者——能主动发起动作",
      "身份——可识别、可授权",
      "权限——权限载体",
      "视角——每个人都有视角",
      "与双形态相关：FullyAgent 与 Coworker",
    ],
    relationships: [
      "FullyAgent = 只有 agent 主体",
      "Coworker = 用户主体 + agent 主体共享一个世界",
      "翻译器/接收器的「调用主体」可字面化为 Subject",
      "张力：若主体子类化切片，用户就变成了切片",
    ],
    boundary: [
      "仍是提案，待团队定稿",
      "与切片的关系未决",
    ],
    openQuestions: ["主体是切片的子类还是并列抽象类？"],
  },
];

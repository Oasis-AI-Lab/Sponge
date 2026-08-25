import type { ContentPageData } from "./content";
import { link } from "../lib/link";

export const en: ContentPageData = {
  positioning:
    "The engineering ground of Sponge: the implementation spec, the execution plan, and the interface contracts that are the sole basis for implementation.",
  status: { label: "Engineering", level: "stable" },
  blocks: [
    {
      title: "Implementation spec — impl/SPEC.md",
      body: "The base Slice contract. Status: working hypothesis, not a locked contract.",
      items: [
        {
          name: "Scope",
          body: "Strictly the base abstract class (Slice). Element, InfoSource, Channel, and Scheduler are out of scope.",
        },
        {
          name: "Definition",
          body: "Slice is the free container and the base class of all abstract classes. Persistent (content-addressed snapshots), nameable, subclassable, opaque content.",
        },
        {
          name: "Interface",
          body: "id, name, kind (open namespace), parent, content (opaque JSON), latest. Methods: create, rename, save, load, subclass.",
        },
        {
          name: "Invariants",
          body: "Id immutability after first persist; content addressing (snapshot identity = hash of payload); derivation preserves content; base ignorance (zero knowledge of concrete kinds); name is not a locator.",
        },
        {
          name: "Lifecycle",
          body: "Active (in memory) → Persisted (at least one snapshot). load() returns Active with id/name/kind/parent/content intact.",
        },
      ],
    },
    {
      title: "Execution plan — impl/PLAN.md",
      body: "Build the base abstract class of Sponge — the Slice — as a working foundation.",
      items: [
        {
          name: "Phases",
          body: "Contract (English SPEC) → carrier decision → implementation → verification → acceptance → handoff hooks.",
        },
        {
          name: "Milestones",
          body: "M0a: impl/ created, English SPEC. M0b: carrier decided. M0c: base slice implemented, tests green. M0d: derivation demo passes.",
        },
        {
          name: "MVP structure",
          body: "Layered by nature of abstract classes: base (slice + store), mechanism (scheduler · channel · agentpark), role (infosource · translator · receiver · scene), content (element), runtime, tools, experiment (falsification harness), apps, tests.",
        },
        {
          name: "Status",
          body: "Base slice + store implemented; 10/10 verification tests green, including the derivation demo.",
        },
      ],
    },
    {
      title: "Contracts — 契约",
      body: "Contracts are the sole basis for implementation. One contract document per plate; contracts first, implementation later.",
      items: [
        {
          name: "Slice",
          body: "Draft — the foundation, effective after the D-A decision.",
        },
        {
          name: "Element",
          body: "Pending — depends on Slice; plugin boundary TBD.",
        },
        {
          name: "InfoSource",
          body: "Pending — interface independent of Statuz (constraint 3).",
        },
        {
          name: "Scheduler",
          body: "Pending — awaits convergence.",
        },
        {
          name: "Channel",
          body: "Pending — awaits formalization.",
        },
        {
          name: "AgentPark",
          body: "Pending — depends on Slice + Scheduler.",
        },
        {
          name: "Translator",
          body: "Pending — independent abstract class; external → native representation.",
        },
        {
          name: "Receiver",
          body: "Pending — entry for external uncontrollable information; pairs with Translator.",
        },
      ],
    },
  ],
  links: [
    { label: "Paradigm", href: link("/paradigm/") },
    { label: "Paper", href: link("/paper/") },
  ],
};

export const zh: ContentPageData = {
  positioning:
    "Sponge 的工程地基：实现规格、执行计划，以及作为实现唯一依据的接口契约。",
  status: { label: "工程", level: "stable" },
  blocks: [
    {
      title: "实现规格 — impl/SPEC.md",
      body: "基类切片契约。状态：工作台假设，尚未锁定。",
      items: [
        {
          name: "范围",
          body: "严格限定基类抽象类（切片）。元素、信息源、通道、调度系统不在范围内。",
        },
        {
          name: "定义",
          body: "切片是自由容器、所有抽象类的基类。可持久（内容寻址快照）、可命名、可子类化、内容不透明。",
        },
        {
          name: "接口",
          body: "id、name、kind（开放命名空间）、parent、content（不透明 JSON）、latest。方法：create、rename、save、load、subclass。",
        },
        {
          name: "不变式",
          body: "首次持久化后 id 不可变；内容寻址（快照身份 = 载荷哈希）；派生保留内容；基类无知（对具体 kind 零知识）；name 不是定位符。",
        },
        {
          name: "生命周期",
          body: "Active（内存中）→ Persisted（至少一个快照）。load() 返回 id/name/kind/parent/content 完整的 Active。",
        },
      ],
    },
    {
      title: "执行计划 — impl/PLAN.md",
      body: "把 Sponge 的基类抽象类——切片——建成可工作的地基。",
      items: [
        {
          name: "阶段",
          body: "契约（英文 SPEC）→ 载体决策 → 实现 → 验证 → 验收 → 交接钩子。",
        },
        {
          name: "里程碑",
          body: "M0a：创建 impl/，英文 SPEC。M0b：载体已定。M0c：基类切片实现，测试全绿。M0d：派生 demo 通过。",
        },
        {
          name: "MVP 结构",
          body: "按抽象类性质分层：base（切片 + 存储）、mechanism（调度 · 通道 · AgentPark）、role（信息源 · 翻译器 · 接收器 · 场景）、content（元素）、runtime、tools、experiment（证伪装置）、apps、tests。",
        },
        {
          name: "状态",
          body: "基类切片 + 存储已实现；10/10 验证测试全绿（含派生 demo）。",
        },
      ],
    },
    {
      title: "契约 — 契约目录",
      body: "契约是实现的唯一依据。每个板块一份契约文档；先定契约，后实现。",
      items: [
        {
          name: "切片",
          body: "草案——地基，D-A 决策后生效。",
        },
        {
          name: "元素",
          body: "待写——依赖切片；插件边界待定。",
        },
        {
          name: "信息源",
          body: "待写——接口独立于 Statuz（约束 3）。",
        },
        {
          name: "调度",
          body: "待写——等待收敛。",
        },
        {
          name: "通道",
          body: "待写——等待形式化。",
        },
        {
          name: "AgentPark",
          body: "待写——依赖切片 + 调度。",
        },
        {
          name: "翻译器",
          body: "待写——独立抽象类；外部 → 原生表征。",
        },
        {
          name: "接收器",
          body: "待写——外部不可控信息入口；与翻译器成对。",
        },
      ],
    },
  ],
  links: [
    { label: "范式", href: link("/zh/paradigm/") },
    { label: "论文", href: link("/zh/paper/") },
  ],
};

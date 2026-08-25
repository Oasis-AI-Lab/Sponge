import type { ContentPageData } from "./content";
import { link } from "../lib/link";

export const en: ContentPageData = {
  positioning:
    "The paper is the English-line entry to the Sponge paradigm — the formal argument that the paradigm works. The full paper is in preparation; this page is the entry.",
  status: { label: "In preparation", level: "proposal" },
  blocks: [
    {
      title: "Status",
      body: "The paper is in preparation. The 研发 notes (00–06) are the argument source; concepts converge there before being backfilled into the paper.",
      items: [
        {
          name: "Argument source",
          body: "The paradigm argumentation lives in the 研发 notes: 00 总论与野心 (vision and ambitions), 01 范式论证 (why existing paradigms fail), 02 概念与抽象类 (terminology constitution), 03 架构与生态位 (ecosystem), 04 收敛设计 (converged design).",
        },
        {
          name: "Falsification",
          body: "The paper carries the falsification clauses: every claim in the paradigm has a testable condition (see Paradigm).",
        },
        {
          name: "Concept discipline",
          body: "Any definition change must first update the concept constitution, then backfill the paper.",
        },
      ],
    },
    {
      title: "Entry points",
      body: "Start here to understand the paradigm before reading the paper.",
      items: [
        {
          name: "Paradigm",
          body: "The positioning, argument, constraints, and falsification clauses.",
        },
        {
          name: "Concepts",
          body: "The terminology constitution — one page per abstract class.",
        },
        {
          name: "Ecosystem",
          body: "Statuz, WAM, Lemma, Sandboxer and the InfoSource seam.",
        },
      ],
    },
  ],
  links: [
    { label: "Paradigm", href: link("/paradigm/") },
    { label: "Docs", href: link("/docs/") },
  ],
};

export const zh: ContentPageData = {
  positioning:
    "论文是 Sponge 范式的英文线入口——论证范式成立的正式文本。完整论文筹备中；本页为入口。",
  status: { label: "筹备中", level: "proposal" },
  blocks: [
    {
      title: "状态",
      body: "论文筹备中。研发笔记（00–06）是论述源；概念先在那里收敛，再回填论文。",
      items: [
        {
          name: "论述源",
          body: "范式论述存于研发笔记：00 总论与野心（愿景与野心）、01 范式论证（现有范式为何失败）、02 概念与抽象类（术语宪法）、03 架构与生态位（生态）、04 收敛设计（收敛设计）。",
        },
        {
          name: "证伪条款",
          body: "论文承载证伪条款：范式中的每个主张都有可检验的条件（见「范式」页）。",
        },
        {
          name: "概念纪律",
          body: "任何定义修改必须先更新概念宪法，再回填论文。",
        },
      ],
    },
    {
      title: "入口",
      body: "阅读论文前，从这里理解范式。",
      items: [
        {
          name: "范式",
          body: "定位、论证、约束与证伪条款。",
        },
        {
          name: "概念",
          body: "术语宪法——每个抽象类一页。",
        },
        {
          name: "生态",
          body: "Statuz、WAM、Lemma、Sandboxer 与信息源接缝。",
        },
      ],
    },
  ],
  links: [
    { label: "范式", href: link("/zh/paradigm/") },
    { label: "文档", href: link("/zh/docs/") },
  ],
};

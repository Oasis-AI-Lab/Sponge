# Editor Track — Plan (v2: mode switch first)

> Status: **draft** | Date: 2026-08-30 | Owner: execution layer (agent) | Approver: strategic layer
> Horizon: 2026-08-31 → 2026-09-13 (2 weeks, est.)
> Basis: `2026-08-30-brainstorm-editor-ui.md` · 本轮裁决（frame 级顶栏 / 结构画布 / 手写 / 可丢原型）· **运行期状态拓扑**裁决 · `plans/exec/portal/2026-08-30-plan-portal-m1-m5.md` · D-O
> Exit: **模式切换可用且有验收**——Portal 与 Editor 在同一壳内切换、共享一条 frame 级顶栏、各自状态保持；壳级不确定性清账

---

## 1. Scope

**In scope**

- **frame 级共享顶栏槽**（`ui-layout` 新增）：两个模式共享，含模式切换器；
- **两个模式**：Portal（已有页面位）+ Editor（本阶段只做空壳，不画面板）；
- **模式的路由与状态归属**：切换后各模式状态保持；模式是否持久化；
- **负面验收**：摘掉 Editor 包 → Portal 不受影响、无报错（沿用 portal-exec M1 第 5 条的做法）。

**Not doing**

- ❌ 画板（任何形式）——**受闸门，见 §2**
- ❌ 切片内容模型（闸门的产出，不是本阶段交付）
- ❌ 真实 core 数据、运算域、agent 工具面、性能、协同
- ❌ Editor 的完整 S1′/S2/S3/S4

## 2. Decisions required

| # | 待决 | 阻塞 |
|---|---|---|
| **D-E3** | 顶栏与 Portal 现有 `sponge.portal.nav` 的关系：顶栏**吞掉** nav，还是并存 | E1 |
| **D-E5** | 模式位的归属：复用 `shell.page`（Portal 当前占用），还是新增独立的模式槽 | E1 |
| **D-E6** | 模式是否持久化（刷新后停在哪个模式） | E2 |

> **闸门（本阶段之后）**：画板阶段开工前必须先有**切片内容模型的最小提案**（运行期状态拓扑：一个节点上有哪些可见字段、每种 kind 呈现成什么）。无此提案，画板只会在桩数据上演戏。

## 3. Dates and horizon

| 里程碑 | 目标日期 | 内容 |
|---|---|---|
| **E0** | 2026-09-01 (est.) | 设计冻结：顶栏结构（位置槽 + 模式语义）、模式定义、store/路由归属、D-E3/D-E5 定案、验收口径 |
| **E1** | 2026-09-06 (est.) | 壳级顶栏槽 + Editor 空模式 + **切换可用**（`dsh web` 里两模式互切） |
| **E2** | 2026-09-13 (est.) | 状态保持 + 负面验收 + 结论（壳级风险清账，交画板阶段） |

## 4. Interfaces and handoffs

**Upstream（前）**

- `plans/exec/portal/2026-08-30-plan-portal-m1-m5.md`：`shell.page`、slot 命名、store 工厂、三注册面、测试梯子（继承其纪律）；
- `2026-08-30-brainstorm-editor-ui.md` + 本轮裁决：frame 级顶栏 / 结构画布 / 手写 / 可丢原型 / 运行期状态拓扑；
- D-O：**借壳边界已按 frame 级顶栏扩展**（超出原 12 行；战略层已批）。

**Downstream（后）**

- **画板阶段**：本阶段交付"稳定的模式与顶栏底座"（这是画板的前置）；
- **Portal**：导航归属调整（若 D-E3 选择"顶栏吞掉 nav"）；
- **07 规划**：Editor 轨道顺序记录（模式底座 → 内容模型提案 → 画板）。

**跨轨接口表**

| Producer | Consumer | Interface | Closed at |
|---|---|---|---|
| harness shell (`ui-layout`) | Editor + Portal | **frame 级顶栏槽** + 模式切换语义 | E0 |
| Editor | Portal | 共享顶栏下的模式/路由/状态保持 | E2 |
| 内容模型提案 | 画板阶段 | 节点字段 + kind 投影规则 | ❓ 未闭合（闸门） |

## 5. Difficulty and unknowns

| 工作项 | 标记 | 说明 |
|---|---|---|
| frame 级顶栏槽设计 | ⚠️ | 壳语义必须克制：**只给位置与模式，不给 Sponge 语义**（延续 `shell.page` 先例） |
| 模式切换 + 状态保持 | ⚠️ | 切换不得重置各模式状态；与现有 slot 生命周期（声明即独占）对齐 |
| 与 Portal 占用者共存 | ⚠️ | 两模式是否争主区，取决于 D-E5 |
| 负面验收（摘包不炸） | ✅ | Portal M1 已有同款先例 |
| 画板 / 内容模型 | 🔴 | **不在本阶段**；闸门未解前不开工 |

## 6. Deliverables

- `packages/client/ui-layout`：**frame 级顶栏槽**（新增）
- `packages/client/ui-sponge-editor`：包骨架 + Editor 空模式 + 模式切换注册
- 模式/路由 store 与 Portal 的对接（调整最小）
- `plans/exec/editor/E2-conclusions.md`：壳级结论（切换/状态/负面验收结果，供画板阶段）
- 非平凡改动随 PR 交 Agent Note

## 7. Budget (est.)

| 区块 | 源码 | 测试 | 合计 |
|---|---|---|---|
| 壳级顶栏槽（ui-layout） | ~80 | ~70 | ~150 |
| Editor 包骨架 + 空模式 | ~150 | ~120 | ~270 |
| 模式切换 / 路由 / 状态保持 | ~200 | ~200 | ~400 |
| **合计（est.）** | ~430 | ~390 | **~820** |

## 8. Risks

| 风险 | 缓解 |
|---|---|
| 顶栏开了口子后被不断加语义 | E0 冻结：位置 + 模式，**不含任何容器/切片语义** |
| 两模式争主区（Portal 的 `shell.page` vs Editor） | D-E5 定案；不选"各占一个槽"的模糊态 |
| 切换丢状态（Portal 会话/路由被重置） | E2 验收明确"切换后各自状态保持"，并做负面验收 |
| 本阶段被当成"画板的前置"而无限追加 | 闸门写在 §2：无内容模型提案，不开工画板 |

## 9. References

- `plans/exec/editor/2026-08-30-brainstorm-editor-ui.md`
- `plans/exec/portal/2026-08-30-plan-portal-m1-m5.md`（`shell.page` / slots / store / 三注册面；as of 2026-08-30）
- `研发/07_编辑器规划.md`（公理：操作简单 = 复杂度被系统吸收）
- `packages/client/AGENTS.md`（client 栈规则）
- `packages/client/ui-layout/src/client/index.ts`（四个子槽现状；as of 2026-08-30）

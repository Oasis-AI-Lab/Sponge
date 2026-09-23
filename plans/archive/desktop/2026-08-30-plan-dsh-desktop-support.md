# DSH Desktop Plugin Support — Plan

> Status: **draft** | Date: 2026-08-30 | Owner: execution layer (agent) | Approver: strategic layer
> Horizon: 2026-08-31 → 2026-09-20 (3 weeks, est.)
> Basis: `anywhere-labs/dsh-desktop` 契约文档（`docs/plugin-development.md` · `dsh-plugin-desktop/docs/plugin-services.zh.md` · `docs/architecture.md`）· D-N（核心独立仓）· D-L（借 UI 壳）
> Exit: **兼容性审计结论 + 最小验证路径**——Sponge 作为宿主能否加载该桌面插件；缺口清单与修复建议

---

## 1. Scope

**In scope**

- **兼容性审计**：把 Desktop 依赖的上游表面逐条列出，在 Sponge 里核对（bundle 行名 / service 名 / CLI 语义 / profile 约定 / client 模块系统 / 启动注入 / 包 scope 名）；
- **命名桥评估**：我们的 rescope（`@oasisailab/sponge-*`、vendored Cordis）是否断了 Desktop 的包名与类型导入；
- **帧几何对齐**：Sponge 的全表面位（`shell.page` / `shell.sandbox`）与 Desktop 的 `safeAreaInsets` / `dragRegion` / `dsh-desktop-titlebar-inset` 契约对齐（"原生支持"的可见部分）；
- **最小 smoke 验证**：按 Desktop 自己的 fixture 模式（`tests/fixtures/desktop-host-services-smoke-plugin` + `verify:profile`）在 Sponge 上验一条加载路径；
- **决策建议**：支持目标定级（见 §2）。

**Not doing**

- ❌ 改 Desktop 仓（它是独立社区项目，我们不 fork、不提交）
- ❌ 改上游语义去迁就（宁可做桥，不改契约）
- ❌ 官方版本 pin 谈判 / 参与 Community Fabric（只列为候选）
- ❌ 自研桌面壳（Electron/Tauri 封装）

## 2. Decisions required

| # | 待决 | 阻塞 |
|---|---|---|
| **D-W1** | 支持目标定级：①仅兼容（保持上游表面不变）②提供等价 Desktop 服务 ③官方 pin Sponge 版本 | W1 审计后 |
| **D-W2** | 命名桥方式：发布兼容别名包 / 让 Desktop 侧适配 / 双轨 | W2 |
| **D-W3** | 帧几何：Sponge 的页面位是否改为**消费** Desktop 的 inset 契约（而不是各页自绘） | W2 |

## 3. Dates and horizon

| 里程碑 | 目标日期 | 内容 |
|---|---|---|
| **W1** | 2026-09-06 (est.) | **兼容性审计**：上游表面清单 × Sponge 现状逐条核对，产出"保持/已改名/缺失"三分表 + D-W1 定级 |
| **W2** | 2026-09-13 (est.) | **命名桥 + 帧几何**：包名/类型导入桥方案；页面位消费 inset 契约（D-W3） |
| **W3** | 2026-09-20 (est.) | **最小 smoke + 结论**：在 Sponge 上加载探测插件成功/失败的确证；缺口清单与修复建议 |

## 4. Interfaces and handoffs

**Upstream（前）**

- Desktop 稳定契约（**只有这三个是受支持的**）：Host `desktopProfiles`（`dsh-plugin-desktop/profile-service`）、Host `desktopPnpm`（`dsh-plugin-desktop/pnpm`）、Client `desktopWindow`（`dsh-plugin-desktop/client`）；
- Desktop 内部、**不得依赖**：`desktopRuntime`、`desktopPnpmBootstrap`、Electron BrowserWindow/tray 注册表、私有 Node helper、生成的 shim；
- Desktop 侧期望的上游表面（审计对象）：`dsh-base` / `dsh-web-app` bundle 行、`webServer` / `subprocess` / `settings` / `loader` service、`dsh.profile.bundles` reconcile、`dsh plugin --profile <active>` CLI 语义、HTTP+WebSocket carrier、client 模块系统与 slot 所有权、`window.__DSH_BOOT__` 注入、profile 目录约定。

**Downstream（后）**

- 若 W1 结论为"可兼容"：Sponge 的 client 包（Portal / Editor / Sandbox）需遵守 Desktop 的 frame inset 契约；
- 若结论为"断链"：产出给 Desktop 侧的**适配清单**（他们改 or 我们加桥）。

**跨轨接口表**

| Producer | Consumer | Interface | Closed at |
|---|---|---|---|
| Sponge 宿主（bundle/service/CLI 行） | Desktop 插件 | 上游表面兼容面 | W1 |
| Desktop `desktopWindow` | Sponge client 包 | frame inset / dragRegion 几何契约 | W2 |
| 审计结论 | 战略层 | D-W1/W2/W3 定级建议 | W3 |

## 5. Difficulty and unknowns

| 工作项 | 标记 | 说明 |
|---|---|---|
| 上游表面兼容审计 | ⚠️ | 需要真实对照：Desktop 期望 vs 我们 rebrand 后的实际（bundle 行名、service 名、scope）；**当前完全未知** |
| 命名桥（scope/类型导入） | 🔴 | Desktop 代码 type-import `@deepseek-ai/cordis`；我们是 vendored `@oasisailab/sponge-cordis`——若无法别名，Desktop 插件在我们宿主上连类型层都过不去（**最可能的断点**） |
| 帧几何对齐 | ⚠️ | Desktop 有三种呈现模式（compatibility / extended / advanced），extended 由 Desktop 持有 root layout 与 sidebar surface；我们的全表面位必须在其 inset 之下 |
| 最小 smoke 验证 | ⚠️ | 要能构建/运行 Desktop（Electron + Yarn + submodule），或退化为"只读契约核对 + Sponge 侧探测插件" |
| 上游版本固定 | ❓ | Desktop **pin 的是上游 commit**；即使我们兼容，也需要他们愿意 pin Sponge（属 D-W1 ③） |

## 6. Deliverables

- `plans/exec/desktop/2026-09-06-desktop-compat-audit.md`（审计三分表：保持 / 已改名 / 缺失）
- 帧几何对齐方案（若 D-W3 通过）→ 影响 `ui-layout` 与 Portal/Sandbox 的页面位
- Sponge 侧**探测插件**（声明 `inject = ['desktopProfiles','desktopPnpm']`，仅探测不执行 pnpm——照 Desktop 的 smoke fixture 做法）
- 结论文档：可支持程度 + 缺口清单 + 给 Desktop 侧的适配清单

## 7. Budget (est.)

| 区块 | 工作量 |
|---|---|
| 兼容性审计（读两侧、逐条核对） | ~1–2 天 |
| 命名桥方案（若需要） | ~1–2 天（可能只验证不实现） |
| 帧几何对齐 | ~0.5–1 天 + 壳改动 ~60 行 |
| 探测插件 + 验证路径 | ~1 天 |
| **合计（est.）** | **约 4–6 人日** |

## 8. Risks

| 风险 | 缓解 |
|---|---|
| **scope 改名断链**（`@deepseek-ai/*` → `@oasisailab/sponge-*`） | W1 首选验证项；桥方案优先考虑**发布兼容别名**而不是让社区改代码 |
| Desktop pin 上游固定版本 | 我们不追他们的 pin；只保证"契约兼容"，把 pin 决策交给 D-W1 ③ |
| 把内部接口当契约 | 严格只对 `desktopProfiles` / `desktopPnpm` / `desktopWindow` 三个公开 surface 负责 |
| LAN 暴露风险（他们 README 明确：无鉴权） | 不在我们范围，但任何"原生支持"文档必须**照抄这句警告** |
| 范围蔓延成"自研桌面壳" | §1 Not doing 明列；只做兼容与桥 |

## 9. References

- <https://github.com/anywhere-labs/dsh-desktop>（README：薄 Electron 宿主 + 桌面壳即插件）
- `docs/plugin-development.md`（两层插件：普通 DSH 插件 vs Desktop 专用；`ctx.get('desktopProfiles')` 探测模式）
- `dsh-plugin-desktop/docs/plugin-services.zh.md`（**受支持契约**：三个 service 的完整类型与 teardown 检查清单）
- `docs/architecture.md`（启动顺序、generation 边界、carrier、打包闭包）
- 本仓：`packages/bundle/web-app/cordis.patch.yml`（我们的 bundle 行现状）· `packages/client/AGENTS.md`（client 契约）· `研发/06`（D-N/D-L）

# Sponge Desktop P1 页面位 + P2 宿主替换 — 详细执行计划

> Status: **draft** | Date: 2026-09-23 | Owner: execution layer (agent) | Approver: strategic layer
> Basis: `2026-08-30-plan-desktop-runnable.md`（D0–D4 已完成，本计划为其后续）· dsh-desktop 实测源码（`dsh-client-ui-layout@0.1.5-rc.2` / `dsh-client-ui-sidebar` / `dsh-client-ui-renderer`）· `upstream.json` / `vendor/dsh-runtime/*/manifest.json`
> Exit: **P1** 一条命令后窗口内可打开/操作 Sponge Portal 与沙盒（零上游改动）；**P2** 本地 fork 的 Desktop 用 Sponge runtime 启动、界面全换装，交付适配清单

---

## 0. 现状基线（2026-09-23 已确证）

已提交 `7c530cc` + `a784ac9`。Desktop 窗口内侧栏底部「沙盒」「容器」入口可见可渲染，但点击 `aria-pressed` 不翻转、画布不出现（页面位未挂载）。

**本次调研的关键新事实（决定 P1 路径）：**

1. **上游 `main` 槽是 keyed 的**。`dsh-client-ui-layout` 的 `MainPanel` 渲染 `renderSlot("main", {}, { entryKey: activePanelId ?? "conversation" })`；`LayoutController.selectPanel(panelId)` 校验注册后写入 `activePanelId`；上游 sidebar 的 `PanelRow` 点击即调 `ctx.layout.selectPanel(id)`。→ **全局面板切换是上游一等公民机制，Sponge 的 Portal/沙盒注册成 keyed `main` 面板即可，不需要改上游 layout。**
2. **上游 `shell.overlay` 是 list 层（浮层），不是页面位**；`shell.page`/`shell.sandbox` 仅存在于本仓 ui-layout。Desktop 内唯一能承载整面页面的位就是 `main`。
3. **P2 的替换面**：`upstream.json` 双通道 pin（stable `fb2c4b9`/`0.1.5-rc.2` → `dsh-plugin-desktop`；beta `ddefc45`/`0.1.6-alpha.2` → `dsh-plugin-desktop-beta`），`runtimeSource` 指向 `vendor/dsh-runtime/<ver>/manifest.json`（SHA-pinned tgz 清单）。Desktop 架构文档明示「**两者都不修改上游子模块**」→ 宿主替换必须 fork/symlink 工作树。
4. **P2 的兼容面比预想好**：本仓服务名（`webServer` 等）与 bundle 行 id（`dsh-base`/`dsh-web-app`）未改名，仅 npm scope 改名。→ Desktop 宿主插件注入点（`desktopProfiles`/`desktopPnpm`/`desktopWindow` 及 Host 侧服务）无需改动，替换的是「模块解析目标」。

## 1. 目标与完成定义（DoD）

| 里程碑 | DoD |
|---|---|
| **P1 页面位** | 一条命令启动后：点「容器」→ Portal 主页出现且可操作；点「沙盒」→ 画布出现、可拖拽/缩放；再点回到对话。**零上游文件改动**（Desktop checkout 与 vendored runtime 均不被修改）。web 版 `sponge web` 行为不回归。 |
| **P2 宿主替换** | 本地 fork 的 dsh-desktop 用 Sponge runtime 启动：窗口内侧栏/主区/设置页均为 Sponge 界面；输出 Desktop 侧适配清单。窗口标题/品牌换装作为 P2-D 批次完成（见 §3）。 |

## 2. P1 页面位（可操作 Portal + 沙盒）

### 2.1 设计决策（D-P1-1）

**采用「keyed `main` 槽注册 + route→panel 桥接」，不采用原计划文档设想的「改上游 layout」。**

| 方案 | 结论 |
|---|---|
| A. keyed `main` 槽注册（本计划采用） | 插件自足；上游 `selectPanel` 机制现成；Desktop 更新不失效；组件源码零改动（只加变体入口） |
| B. 改上游 layout 增加 `shell.page`/`shell.sandbox` 分支 + patch vendored | 语义最贴 web 版，但侵入 vendored tgz，Desktop 一更新即失效，且不属受支持插件契约 |

**架构：**

```
Desktop 上游 shell（不变）
 ├─ root → AppFrame（上游 layout，keyed main 槽）
 │    ├─ main [key="conversation"]  ← 上游对话（默认）
 │    ├─ main [key="sponge.portal"]  ← 变体入口注册 PortalShell（含 sponge.portal.main 链）
 │    └─ main [key="sponge.sandbox"] ← 变体入口注册 SandboxShell（含 sponge.sandbox.main 链）
 └─ sidebar.footer.action
      ├─ [id="sponge-portal"]  PortalEntryButton（现状，组件不动）
      └─ [id="sponge-sandbox"] SandboxEntryButton（现状，组件不动）
桥接 effect（变体入口内）：订阅 route store → open → ctx.layout.selectPanel('sponge.portal'|'sponge.sandbox')；close → selectPanel(null)
```

**互斥规则（D-P1-2）**：`main` 槽一次只渲染一个 key。开 Portal 时若沙盒开着，先 close 沙盒 store（反之亦然）。桥接在开一个时把另一个 store 置为 close。

### 2.2 步骤

**P1-A 变体 client 入口（本仓，新文件 + tsdown 映射）**

1. `packages/client/ui-sponge-portal/src/client/index.upstream.ts` — 复制 `index.ts` 注册逻辑，两处变更：
   - PortalShell 注册：`{ name: 'shell.page', ... }` → `{ name: 'main', id: 'sponge-portal', key: 'sponge.portal', children: { 'sponge.portal.main': { kind: 'chain', scope: 'root' } }, store: portalStore, locale: NS, inject }`。`options.key` 是 keyed 槽的选举键（上游 renderer `entriesOfSlot().find(e => e.options.key === entryKey)`）。
   - 新增桥接 effect：`portalStore` 订阅（`create()` 后的 handle 提供 `subscribe`），route 变化时 `ctx.layout.selectPanel(route 为 none ? null : 'sponge.portal')`，并互斥关闭沙盒（通过 `ctx.slots` 无法跨包拿沙盒 store —— 互斥改用**双端各自桥接**：开 Portal 时对沙盒执行一次 `ctx.layout.selectPanel` 竞态最小化，实际以「两 store 同一应用根共享、开 A 时由 A 的桥接调 `ctx.layout.selectPanel('sponge.portal')`，B 仍挂载但被 keyed 选举顶掉」为准，无需跨包通信）。→ 注：keyed 选举天然互斥，**不需要**显式互斥逻辑；DoD 验证点即「开 A 后 B 不显示」。
   - 类型：`import type {} from '@oasisailab/sponge-client-ui-layout/client'`（变体 alias 下解析为上游 layout 的 d.ts，带来 `Context.layout` 声明）。
2. `packages/client/ui-sponge-sandbox/src/client/index.upstream.ts` — 同构：SandboxShell → `{ name: 'main', id: 'sponge-sandbox', key: 'sponge.sandbox', children: { 'sponge.sandbox.main': chain }, store: sandboxStore, locale: NS }` + 桥接。
3. `packages/client/tsdown.client.ts` — 对这两个包在 `DSH_BUILD_VARIANT=upstream` 时把 entry 换成 `src/client/index.upstream.ts`（现有 `UPSTREAM_ALIAS`/变体逻辑同处扩展）。

**P1-B 打包（本仓脚本）**

4. `plans/exec/desktop/scripts/pack-plugins.mjs` — 无需改注入表（`main` 槽由上游 layout 声明，`UPSTREAM_INJECT` 保持 `@deepseek-ai/dsh-client-store` + `dsh-client-ui-primitives`）；若变体产物 require 集新增依赖，按现有「require() 集核对」步骤补表。
5. 变体构建 + 打包：
   ```
   pnpm exec tsdown --env.DSH_BUILD_FACE client --env.DSH_BUILD_VARIANT upstream
   node plans/exec/desktop/scripts/pack-plugins.mjs
   ```

**P1-C 安装与验证（本仓脚本 + Desktop 只读）**

6. `prepare-desktop-profile.mjs` 复用（安装路径/向导跳过/清理逻辑不变）。
7. **headless 验证**：扩展 `verify-sponge-profile-boot.mjs` —— 断言 renderer 模块表内两个变体 bundle 的 client.js 含 `name: "main"` 注册行与 `key: "sponge.portal"/"sponge.sandbox"`；`ctx.layout.selectPanel` 在加载序上可用（`ctx.slots.inject('main', ...)` 保证声明后注册）。
8. **GUI 验证**（CDP，沿用 `cdp-probe.mjs` 套路）：启动 → `Runtime.evaluate` 模拟点击侧栏入口 → 断言 `aria-pressed="true"`、Portal 文案节点出现；沙盒 → `canvasCount > 0` 且 `data-route="open"`；再点 → 回到对话（`aria-pressed="false"`、Portal 文案消失）。截图存档 `artifacts/p1-*.png`。
9. **web 回归**：`sponge web` 正常启动（变体入口独立，产品构建路径不碰）。

**P1 出口**：§1 DoD 全绿；`run-desktop.md` 更新「已知限制」段为「已支持打开/操作」。

## 3. P2 宿主替换（Sponge 作 Host）

### 3.1 设计决策（D-P2-1）

**本阶段做「本地 fork 验证 + 适配清单」，不推远端仓库。** 依据：Desktop 明示不改上游子模块，宿主替换必须 fork/symlink 工作树；D3 已判定可行性成立、属 Desktop 侧 3–5 人日改造。

**替换面三条（D-P2-2）：**
1. `upstream.json`：commit/runtimeSource → 本仓构建的 manifest（fork 内改）。
2. `vendor/dsh-runtime/<ver>/`：SHA-pinned tgz 集 → 本仓全包闭包 tgz 集（同结构 manifest + sha256）。
3. profile bundles 行：`dsh-base`/`dsh-web-app` 等行 **id 保留**（Loader 行 id 与包名解耦，P1 已验证 `insert` 行 id ≠ 包名），包名指向 `@oasisailab/sponge-*`；profile node_modules 装入完整 Sponge 闭包。

**品牌换装分两批（D-P2-3）**：P2-C 先保证「窗口内界面为 Sponge」（侧栏/主区/设置页）；P2-D 第二批做窗口标题/App 图标/安装包元数据（对应本仓 branding 迁移第二批）。

### 3.2 步骤

**P2-A Sponge runtime 闭包构建（本仓）**

1. 从现有 Desktop profile 的 bundles 清单 + 各包 `dsh.client.inject` 出**完整依赖闭包**（脚本枚举 `@deepseek-ai/*` → `@oasisailab/sponge-*` 映射，参照 P1 `UPSTREAM_ALIAS` 表扩展为全表）。
2. 对闭包内每个包：产品构建（`pnpm run build` 产出 `lib/`）→ `pnpm pack` → 收集 tgz。
3. 生成 `vendor/dsh-runtime/<sponge-version>/manifest.json`（仿上游格式：name/version/filename/size/sha256）。

**P2-B 本地 fork 替换（Desktop 侧，只读验证）**

4. 拷贝 dsh-desktop 工作树（或 git worktree）为本地 fork；改 `upstream.json` 指向本仓 commit + 新 manifest。
5. 替换 `vendor/dsh-runtime/<ver>/` 内容；跑 `sync-vendored-runtime.mjs`（若其校验上游 SHA，则 fork 内同步改校验或跳过校验路径）。
6. profile 组装：bundles 行 id 保留、包名换 `@oasisailab/sponge-*`；profile node_modules 安装闭包 tgz。
7. **模块表验证**：renderer 加载后所有 `__ModuleLoader__.load({ id: "@oasisailab/..." })` 的 require 集均被满足（无 unmet external；方法同 P1 的 require() 集核对）。

**P2-C 启动与界面验证**

8. Electron 启动（复用 `prepare-desktop-profile.mjs` 的向导跳过/清理逻辑）→ 窗口出现、renderer 零 JS 异常。
9. CDP 断言：侧栏为 Sponge 界面、对话主区正常、Portal/沙盒可打开；截图存档 `artifacts/p2-*.png`。
10. 宿主服务兼容确认：`desktopProfiles`/`desktopPnpm`/`desktopWindow` 注入点、Host 侧 `webServer` 等服务名未改名 → 无需 Desktop 代码改动（验证点）。

**P2-D 品牌换装（第二批）**

11. 窗口标题 `DeepSeek Harness Desktop` → `Sponge`（Desktop fork 内 title 字段）。
12. 上游 layout `productTitle = "DeepSeek Harness"` → 本仓 ui-layout 已是 Sponge 品牌（DocumentTitle 已随本仓 branding 迁移），确认无遗漏。
13. App 图标/安装包元数据/设置页品牌文案 —— 列入适配清单与 branding 第二批，不阻塞 P2-C 验收。

**P2 出口**：本地 fork 启动后窗口内全 Sponge（截图证据）；交付 `适配清单.md`（给 Desktop 侧：upstream.json 替换法、闭包清单、品牌换装项、局域网警告照抄）。

## 4. 里程碑与验收

| 里程碑 | 内容 | 出口 | 预算(est.) |
|---|---|---|---|
| **P1-A** | 两个变体入口 + tsdown 映射 + 桥接 | `tsc`/`typecheck` 绿；变体构建产出 `lib-upstream/client.js` 含 main 注册 | 1–1.5 人日 |
| **P1-B** | 打包 + profile 安装 | `pack-plugins` 出包；`prepare` 无报错 | 0.5 人日 |
| **P1-C** | headless + GUI + web 回归 | DoD §1 P1 全绿；截图存档 | 1 人日 |
| **P2-A** | 闭包枚举 + tgz 集 + manifest | manifest 生成；闭包无缺失 | 1–1.5 人日 |
| **P2-B/C** | fork 替换 + 启动 + CDP 验证 | 窗口内全 Sponge；零 JS 异常 | 1.5–2 人日 |
| **P2-D** | 标题/品牌第二批 + 适配清单 | 适配清单交付 | 0.5 人日 |
| **合计** | | | **6–7.5 人日** |

## 5. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 变体入口与产品入口分叉后漂移（两处 apply 语义不一致） | 变体入口只改「注册位 + 桥接」，业务逻辑全部引用现有组件/store；变体文件头部注释声明「仅构建变体用，与 index.ts 保持同步」 |
| `ctx.layout` 在桥接订阅回调触发时尚未提供（加载序） | `ctx.slots.inject('main', ...)` 保证注册晚于 main 声明；桥接在订阅回调内惰性读 `ctx.layout`，回调只在用户点击后触发（此时必已就绪）；仍加防御性 guard |
| 上游 store `persist` 语义与本仓不一致 → 路由状态异常 | P1-C headless 先验证 store 创建/订阅/持久化行为；不一致则变体入口改用无 persist 的 store 变体 |
| keyed `main` 槽 renderer 对 `key` 未注册面板抛错（`selectPanel` 校验 `hasMainPanel`） | 注册与调用同包：先 `register` 成功再桥接；headless 断言注册在册 |
| P2 闭包遗漏包 → renderer 加载 unmet external | P2-A 用「现有 profile bundles + inject 闭包」枚举而非手写清单；P2-B 模块表验证兜底 |
| Desktop fork 校验 upstream SHA 拒绝替换 | 本地 fork 内同步改校验；只做本地验证，不推远端（§3.1 明确） |
| 范围蔓延成「自研壳/改上游语义」 | §1/§3.1 边界明确：P1 零上游改动、P2 只本地验证 |

## 6. 交付物

- `packages/client/ui-sponge-portal/src/client/index.upstream.ts`、`ui-sponge-sandbox/src/client/index.upstream.ts`（变体入口 + 桥接）
- `packages/client/tsdown.client.ts` 变体 entry 映射增补
- `scripts/pack-plugins.mjs` / `verify-sponge-profile-boot.mjs` / `cdp-probe.mjs` 增补（如需）
- P2：闭包枚举脚本 + `vendor/dsh-runtime/<sponge-version>/manifest.json` 生成物（存 `plans/exec/desktop/artifacts/`）+ 本地 fork 验证记录
- `run-desktop.md` 更新 + `Desktop 侧适配清单.md`
- 截图证据：`artifacts/p1-*.png` / `artifacts/p2-*.png`

## 7. 桌面侧适配清单（协作时给对方，P2 产出）

1. **无需对方改动即可跑通 P1**：Sponge Portal/沙盒以 keyed `main` 面板注册，消费上游 `ctx.layout.selectPanel` 现成机制。
2. **宿主替换三件套**：`upstream.json` 指向 Sponge manifest；`vendor/dsh-runtime/` 换成 Sponge 闭包 tgz；profile bundles 行 id 保留、包名换 `@oasisailab/sponge-*`。
3. **受支持契约（勿越界）**：仅 `desktopProfiles` / `desktopPnpm`（Host）/ `desktopWindow`（Client）；不依赖 `desktopRuntime` / `desktopPnpmBootstrap` / Electron 窗口/托盘 / 私有 Node helper。
4. **品牌第二批**：窗口标题、App 图标、安装包元数据、设置页品牌文案。
5. **局域网无鉴权警告照抄**：开放局域网 = 同网任何人可操作你的电脑。

## 8. References

- `2026-08-30-plan-desktop-runnable.md`（D0–D4 已交付：变体构建、打包、profile、一键运行、P2 可行性结论）
- dsh-desktop 实测：`dsh-client-ui-layout@0.1.5-rc.2`（`lib/client.js`：keyed `main` + `selectPanel`）、`dsh-client-ui-sidebar`（`PanelRow` → `selectPanel`）、`dsh-client-ui-renderer`（keyed 选举 `entryKey`）
- `upstream.json`、`vendor/dsh-runtime/0.1.5-rc.2/manifest.json`、`docs/architecture.md` §打包与运行时闭包 / §发行通道协议
- 本仓：`packages/client/tsdown.client.ts`（`UPSTREAM_ALIAS`）、`ui-sponge-portal/src/client/index.ts`、`ui-sponge-sandbox/src/client/index.ts`、`ui-layout/src/client/index.ts`（`shell.page`/`shell.sandbox` 声明）

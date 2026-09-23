# DSH Desktop Runnable with Sponge — Plan

> Status: **draft** | Date: 2026-08-30 | Owner: execution layer (agent) | Approver: strategic layer
> Horizon: 2026-08-31 → 2026-09-24 (4 weeks, est.)
> Basis: `2026-08-30-plan-dsh-desktop-support.md`（审计计划，已归档）· dsh-desktop 契约文档（`docs/plugin-development.md` / `dsh-plugin-desktop/docs/plugin-services.zh.md` / `docs/architecture.md`）· 本仓抽样结论（service 名与 bundle 身份未改名；**仅 npm scope 改名**）
> Exit: **一条命令起 Desktop 并看到/操作 Sponge 界面**（Portal + 沙盒），且 Host 替换路径已验证

---

## 1. 目标分层（两条路径，先后递进）

| 路径 | 含义 | 本计划定位 |
|---|---|---|
| **P1 插件先行** | Desktop 跑**它自己固定的上游 Host**，把我们**已构建的 Sponge UI 插件**装进它的 profile | **第一步必须达成**——最快"可直接运行 Desktop + 看到 Sponge" |
| **P2 宿主替换** | 让 Desktop 启动**Sponge 作 Host**（替换它 pin 的上游子模块） | 第二步——真正的"原生支持" |

> P1 先行的理由：我们的 Portal / 沙盒是**纯 client 插件（node 半为空）**，不需要宿主侧改造；P1 用一个可安装产物就能端到端跑通，同时验证 Desktop 的三模式帧几何（标题栏 inset），把风险从"宿主兼容"降到"构建变体 + 安装流程"。

## 2. Scope

**In scope**

- **环境与分析**：克隆 `anywhere-labs/dsh-desktop`（含 submodule）、Yarn 安装、读通它的 launcher / `upstream.json` / profile / 插件安装正规路径；
- **插件身份对齐（P1 的核心）**：把 `ui-sponge-portal` + `ui-sponge-sandbox` 构建成**上游身份（`@deepseek-ai/*` externals）**的客户端变体，并打包为**可安装的一个插件包**；
- **首次可运行**：装进 Desktop profile → 启动 → Sponge 侧栏入口与页面在 Desktop 窗口内可用（含标题栏 inset 正确）；
- **宿主替换（P2）**：把 Desktop 的 pinned upstream 指向本仓 checkout，跑到能启动；修 **client 模块表别名**（`@deepseek-ai/*` → `@oasisailab/sponge-*`）与必要 host 别名；
- **固化**：一键运行脚本/文档 + 给 Desktop 侧的适配清单。

**Not doing**

- ❌ 自研桌面壳（Electron/Tauri 封装）
- ❌ 迁就改我们的服务名/协议身份（改名只发生在包 scope，保持现状）
- ❌ 参与 Community Fabric / 官方版本 pin 谈判（只出适配清单）
- ❌ Editor 画板（仍受内容模型闸门约束）

## 3. Decisions required

| # | 待决 | 阻塞 |
|---|---|---|
| **D-D1** | 插件身份对齐方式：**构建变体**（tsdown alias 成上游 externals）vs **发布兼容别名包**（`@deepseek-ai/cordis` → 我们的行） vs 双轨 | D1 |
| **D-D2** | 是否 **fork dsh-desktop** 以改 `upstream.json`（P2 需要；不 fork 只能用 symlink/替换工作树） | D3 |
| **D-D3** | P1 产物形态：一个聚合插件包 vs 两个独立包 | D1 |

## 4. Dates and horizon

| 里程碑 | 目标日期 | 内容 | 出口 |
|---|---|---|---|
| **D0** | 2026-09-02 (est.) | 克隆 Desktop + submodule + `corepack yarn install`；读 launcher/profile/`upstream.json`/插件安装路径；确认 P1 是否可行 | 一份"安装路径"结论 |
| **D1** | 2026-09-06 (est.) | **构建变体**：上游身份的 client 产物 + 可安装插件包（含 `dsh.client` manifest 与三注册面） | 产出 `.tgz` 或本地可安装路径 |
| **D2** | 2026-09-09 (est.) | **首次可运行**：装进 Desktop profile → 启动 → 侧栏「容器」「沙盒」可用；标题栏 inset 正确（消费 `desktopWindow` / `dsh-desktop-titlebar-inset`） | **可直接运行 Desktop + Sponge 界面** ✅ |
| **D3** | 2026-09-18 (est.) | **宿主替换（P2）**：pinned upstream 指向本仓；修 client 模块表别名 `@deepseek-ai/*`；跑到能启动 | P2 可行性结论 |
| **D4** | 2026-09-24 (est.) | 固化：一键运行脚本 + 前置条件 + 故障排查；给 Desktop 侧适配清单 | 交接文档 |

## 5. Interfaces and handoffs

**Upstream（前）**

- Desktop 受支持契约（**只有三个**）：`desktopProfiles`、`desktopPnpm`（Host）、`desktopWindow`（Client）；
- Desktop 内部、不得依赖：`desktopRuntime`、`desktopPnpmBootstrap`、Electron 窗口/托盘、私有 Node helper、生成 shim；
- 本仓现状（抽样 as of 2026-08-30）：`webServer` 等服务名**未改名**；bundle 身份仍是 `dsh-base` / `dsh-web-app`；**唯一改名面是 npm scope**。

**Downstream（后）**

- P1 产物：可安装插件包（供 Desktop 用户/市场）；
- P2 结论：Sponge 作为 Host 的兼容面清单 → 决定是否发布 `@deepseek-ai/*` 兼容别名；
- 我们的页面位：若要在 Desktop 内正确渲染，`shell.page` / `shell.sandbox` 消费 inset 契约（可能小改 `ui-layout`）。

**跨轨接口表**

| Producer | Consumer | Interface | Closed at |
|---|---|---|---|
| Sponge client 插件 | Desktop 的上游模块表 | 上游身份 external 的构建变体 | D1 |
| Desktop `desktopWindow` | Portal / Sandbox 页面位 | frame inset / dragRegion 几何 | D2 |
| Sponge Host（模块表 + 服务名） | Desktop / 上游插件 | `@deepseek-ai/*` 别名层 | D3 |

## 6. Difficulty and unknowns

| 工作项 | 标记 | 说明 |
|---|---|---|
| Desktop 环境搭建（Electron + Yarn + submodule） | ⚠️ | 依赖其 vendored runtime 与 Node ABI；本机需能装/构建 |
| 上游身份构建变体 | ⚠️ | tsdown alias 把 `@oasisailab/sponge-*` 外部身份换成上游身份；需核对上游 client 基线模块表的确切 specifier 列表 |
| Desktop 安装正规路径 | ❓ | 市场 / `dsh plugin add` / profile bundles 三条路哪条对我们最稳——D0 结论 |
| 宿主替换（P2） | 🔴 | Desktop 的 launcher/`upstream.json` 校验、vendored runtime 清单、pnpm workspace 形状都可能拒绝非 pin commit；**需要 fork 或 symlink 替换工作树** |
| client 模块表别名 | ⚠️ | 把上游 specifier 映射到我们的行；模块图对未满足 external 当场抛错，故必须有 |
| 帧几何对齐 | ⚠️ | Desktop 三模式（compatibility / extended / advanced）几何不同；extended 下官方 root 由 Desktop 持有 |
| 局域网无鉴权 | ⚠️ | Desktop README 明示：开放局域网 = 同网任何人可操作你的电脑；**我们的文档必须照抄** |

## 7. Deliverables

- `packages/client/ui-sponge-portal` + `ui-sponge-sandbox` 的**上游身份构建变体**（不改变源码语义，仅构建期 alias/external 配置）
- 可安装插件包（P1）与安装步骤文档
- （P2）本仓 `packages/client/web/src/platform.ts` 的**别名层**：上游 `@deepseek-ai/*` 身份 → 我们的模块行
- **一键运行路径**：`plans/exec/desktop/run-desktop.md`（前置条件 + 命令 + 故障排查）
- 给 Desktop 侧的适配清单（若要他们 pin Sponge）

## 8. Budget (est.)

| 里程碑 | 人日 |
|---|---|
| D0 环境与分析 | 1–2 |
| D1 构建变体 + 打包 | 2–3 |
| D2 安装 + 首次运行 + inset | 1–2 |
| D3 宿主替换（P2） | 3–5 |
| D4 固化与文档 | 1 |
| **合计（est.）** | **8–13 人日** |

## 9. Risks

| 风险 | 缓解 |
|---|---|
| Desktop 只支持它 pin 的固定上游（改不了它的仓库） | P1 绕开宿主；P2 用 fork/symlink，且只做**本地验证**，不要求对方接受 |
| 上游 client 基线身份清单不全 → 变体构建后仍解析失败 | D1 先列出上游 `PLATFORM_MODULES` 等价清单再构建；失败即补表 |
| 构建变体污染产品构建 | 变体只在**单独 profile/命令**下产出，产品构建路径不动 |
| 范围蔓延成"自研桌面壳"或"改上游语义" | §2 Not doing 明列 |
| 本机无法构建 Electron Desktop | D0 先验环境，失败即降级为"只做 P1 产物 + 文档"，并如实报告 |

## 10. Execution status (as of 2026-09-23)

| 里程碑 | 状态 | 结果 |
|---|---|---|
| **D0** 环境与分析 | ✅ | Desktop 依赖 vendored runtime tgz（`0.1.5-rc.2`，非 submodule 源码）；受支持契约仅 `desktopProfiles` / `desktopPnpm` / `desktopWindow`；profile 由 `prepareDesktopProfile` 组装，bundles 列表 + `cordis.patch.yml` 双入口 |
| **D1** 构建变体 + 打包 | ✅ | `packages/client/tsdown.client.ts` 增 `UPSTREAM_ALIAS` 变体（`@oasisailab/sponge-*` → `@deepseek-ai/*`，alias 插件 `pre` 优先级绕过 external 判定）；`scripts/pack-plugins.mjs` 产出可安装插件包（`dsh.client` manifest + `cordis.patch.yml`，修复 Windows 路径空格/`corepack.cmd`/YAML 引号问题） |
| **D2** 首次可运行 | ✅ | `scripts/prepare-desktop-profile.mjs` 组装含两个 Sponge 插件的独立 profile（`gui-home/profiles/desktop`，bundles 已含 `@oasisailab/sponge-client-ui-sponge-portal` + `-sandbox`）；`verify-sponge-profile-boot.mjs` headless 验证通过；`materializeProfile`（packaged pnpm 迁移）正常执行 |
| **D2b** GUI 启动验证 | ✅ | 2026-09-23 实测：`electron.exe lib/main.js`（`--user-data-dir=gui-userdata` + `DSH_HOME=gui-home`）启动成功；窗口标题 **"DeepSeek Harness Desktop"** 可见；侧栏底部同时显示 **「沙盒」（aria=打开沙盒）与「容器」（aria=打开容器）** 两个 Sponge 入口（截图存档 `artifacts/renderer-final.png`）；renderer 零 JS 报错（仅 Electron CSP 警告）；两插件 client bundle 均在 `/plugins/??` 清单内被服务。**页面位未挂载**：点击入口 `aria-pressed` 不翻转、`canvasCount=0`、Portal 文案不出现——符合 §5 预判：上游布局只渲染 `sidebar/main/rightbar/shell.overlay`，`shell.page`/`shell.sandbox` 需小改 `ui-layout`（后续里程碑） |
| **D3** 宿主替换（P2） | ✅ 结论 | Desktop 固定 pinned upstream commit + vendored tgz + launcher 校验，宿主替换必须 fork/symlink 替换工作树并改 Desktop 构建期模块表别名；可行性成立但属 Desktop 侧改造（3–5 人日），**P1 路径即为当前可交付路径**，P2 留待对方协作时再做 |
| **D4** 固化与文档 | ✅ | 交付 `run-desktop.md`（一次构建 → 一键准备 → 启动 → CDP 验证 → 故障排查 → Desktop 侧适配清单）；`prepare-desktop-profile.mjs` 增强为自动预置 Setup Wizard 跳过标记（`profile-setup/<profileHash>/state.json`，profileHash=profile 目录 sha256，与实测 hash 一致）、`profile-selection` 与 `crash-evidence/active-run.json` 清理，并在结尾打印最终启动命令；2026-09-23 端到端复验：按新流程启动直入主界面（无向导拦截），侧栏「沙盒」「容器」入口可见（截图 `artifacts/e2e-renderer.png`） |

**关键环境教训（2026-09-23 实测）**

- 本机已安装的真实 DSH Desktop（`C:\Users\chkev\AppData\Local\Programs\DSH Desktop\DSH Desktop.exe`）持有**自己的**单实例锁与 userData；用 `--user-data-dir=` 指向独立目录即可并行运行测试实例，互不干扰。
- `Start-Process -WindowStyle Hidden` 会把主窗口隐藏（表现为"进程在跑但无窗口"）；必须前台/普通方式启动。
- 首次启动会被 Setup Wizard 拦截；预置 `profile-setup/<profileHash>/state.json`（outcome `skipped`，字段见 `setup-wizard-state.ts`）可跳过。
- 上一次非正常退出会触发 recovery 流程；启动前清理 `crash-evidence/active-run.json` 与 `lockfile` 可避免恢复窗口。
- 窗口可见性判断用 `Get-Process MainWindowTitle`（可见窗口会带标题；无标题=窗口未显示），且会被前台浏览器遮挡——最终以 CDP（`--remote-debugging-port`）抓取 renderer 为准。
- Desktop 把 renderer 服务在 `http://127.0.0.1:<port>/`，插件清单在 `/plugins/??<逗号拼接>`,client.js`；CDP `Runtime.evaluate` + `Page.captureScreenshot` 是验证插件装载/交互的可靠手段。

## 11. References

- <https://github.com/anywhere-labs/dsh-desktop>（`master`）
- `docs/plugin-development.md`（两层插件；`ctx.get('desktopProfiles')` 探测；外部开发沙箱）
- `dsh-plugin-desktop/docs/plugin-services.zh.md`（三个受支持 service 的完整类型 + teardown 清单 10 条）
- `docs/architecture.md`（启动顺序 7 步、generation 边界、carrier、`upstream.json`、打包闭包）
- 本仓：`packages/client/web/src/platform.ts`（`PLATFORM_MODULES` 现状）· `packages/bundle/web-app/cordis.patch.yml`（bundle 行）· `packages/client/AGENTS.md`（client 契约与测试梯子）
- `plans/archive/desktop/2026-08-30-plan-dsh-desktop-support.md`（被本计划吸收的审计计划）

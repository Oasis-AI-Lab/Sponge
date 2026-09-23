# Run Sponge inside DSH Desktop — one command

> 交付物 D4（对应 `2026-08-30-plan-desktop-runnable.md`）。P1 路径：Desktop 跑它自己固定的上游 Host，Sponge 的 Portal / 沙盒插件以**上游身份构建变体**装入独立 profile。实测基线：2026-09-23，Windows 11 + Electron 2.0.14 + upstream `0.1.5-rc.2`。

## 效果

一条命令启动 Desktop 窗口，侧栏底部出现 Sponge 的「沙盒」「容器」两个入口；两插件以**上游身份构建变体**注册为 keyed `main` 面板（`sponge.portal` / `sponge.sandbox`），渲染进程零 JS 错误。

已支持（P1 完成）：点击「容器」→ Portal 主页出现在主区可操作；点击「沙盒」→ 沙盒画布（SVG pan/zoom viewport）出现可拖拽/缩放；再点回到对话。整条链路经 `verify-p1-gui.mjs` CDP 实测通过（conversation → Portal → 沙盒 → conversation），截图存 `artifacts/p1-*.png`。

## 前置条件

| 依赖 | 要求 |
|---|---|
| Node.js | `^22.19.0`（本机 22.16.0 亦可跑通；`corepack` 可用） |
| 本仓 | `D:\github projects\Sponge`，`pnpm install` 已完成 |
| Desktop checkout | 与仓库平级的 `D:\github projects\dsh-desktop`，`dsh-plugin-desktop` 已构建（`yarn run build` 产出 `lib/`；Electron 二进制已下载到 `node_modules/electron/dist/electron.exe`） |

## 一次构建（产出插件包）

```powershell
# 1. 构建两个插件的上游身份 client 变体（lib-upstream/）
pnpm exec tsdown --env.DSH_BUILD_FACE client --env.DSH_BUILD_VARIANT upstream

# 2. 打包为可安装插件包（artifacts/ui-sponge-portal、artifacts/ui-sponge-sandbox）
node "D:\github projects\Sponge\plans\exec\desktop\scripts\pack-plugins.mjs"
```

产物不进入产品 `packages/` 树，全部留在 `plans/exec/desktop/artifacts/`。

## 一键准备（profile + 启动标记）

```powershell
node "D:\github projects\Sponge\plans\exec\desktop\scripts\prepare-desktop-profile.mjs"
```

脚本完成：重建 `artifacts/gui-home`（DSH_HOME）、组装 `desktop` profile、把两个插件包装入 profile 的 `node_modules` 并登记 bundles、预置跳过 Setup Wizard 的 `profile-setup/<hash>/state.json`、预置 `profile-selection/state.json`（active=desktop）、清理 `crash-evidence/active-run.json`（防止触发 recovery 窗口）。结束时会打印最终启动命令。

## 启动

```powershell
$env:DSH_HOME = "D:\github projects\Sponge\plans\exec\desktop\artifacts\gui-home"
& "D:\github projects\dsh-desktop\dsh-plugin-desktop\node_modules\electron\dist\electron.exe" `
  "D:\github projects\dsh-desktop\dsh-plugin-desktop\lib\main.js" `
  --user-data-dir="D:\github projects\Sponge\plans\exec\desktop\artifacts\gui-userdata" `
  --remote-debugging-port=9333
```

（`--remote-debugging-port` 仅用于验证，可省略。）首次启动直接进入主界面：侧栏底部可见「沙盒」「容器」入口，随后是「设置」。

## 验证（CDP 探测）

一键 CDP 断言（推荐）——启动后运行：

```powershell
node "D:\github projects\Sponge\plans\exec\desktop\scripts\verify-p1-gui.mjs"
```

自动点击侧栏「容器」「沙盒」，断言 Portal / 沙盒面板开合与互斥，零渲染器异常，截图存 `artifacts/p1-*.png`；期望输出 `P1 GUI PASS`。

手工探测（可选）：

```powershell
$targets = (Invoke-WebRequest -Uri "http://127.0.0.1:9333/json/list" -UseBasicParsing).Content
# 取 webSocketDebuggerUrl，然后：
node "D:\github projects\Sponge\plans\exec\desktop\scripts\cdp-probe.mjs" "ws://127.0.0.1:9333/devtools/page/<id>" "artifacts\verify.png"
```

期望输出：`sampleButtons` 含「沙盒」「容器」；`CONSOLE_EVENTS` 仅 Electron CSP 警告，无 JS 异常。截图存档见 `artifacts/e2e-renderer.png`。

## 故障排查

| 现象 | 处理 |
|---|---|
| 首次启动被 Setup Wizard 拦截 | 确认已运行过 `prepare-desktop-profile.mjs`（它预置 `profile-setup/<profileHash>/state.json`，outcome=`skipped`；profileHash 是 profile 目录绝对路径的 sha256） |
| 弹出 recovery / 恢复窗口 | 启动前清理 `gui-userdata\crash-evidence\active-run.json`（prepare 脚本已自动做）；上一次非正常退出会残留此文件 |
| 进程在跑但看不到窗口 | 不要用 `Start-Process -WindowStyle Hidden`；用 `Get-Process electron | Select MainWindowTitle` 判断窗口标题 |
| 与已安装的正式版 Desktop 冲突 | 已安装版本持有自己的单实例锁与 userData；本流程用独立 `--user-data-dir` 并行运行，互不干扰 |
| CDP `/json/list` 返回空 | renderer 还在启动，等 10–20 秒重试；确认端口号与启动参数一致 |
| 插件按钮未出现 | 确认 `artifacts/ui-sponge-portal`、`ui-sponge-sandbox` 已打包（pack-plugins），且 `prepare-desktop-profile` 输出无 "did not compose a profile layer" 报错 |

## Desktop 侧适配清单（若对方要 pin Sponge / 支持页面位）

1. **Sponge 页面位（P1 已由 keyed `main` 解决，无需改布局）**：Desktop 的上游 `dsh-client-ui-layout` 只渲染 `sidebar` / `main` / `rightbar` / `shell.overlay` 槽，且 `main` 是 keyed 的（`selectPanel` 切换）。Sponge Portal / 沙盒插件以上游身份变体注册为 `main` 的 keyed 面板 `sponge.portal` / `sponge.sandbox`，侧栏 foot 按钮点击走 route→`selectPanel` 桥接，无需侵入上游。仅当后续要支持 Sponge 原生的 `shell.page` / `shell.sandbox` 槽语义时才需要改布局插件。
2. **受支持契约（勿越界）**：只有 `desktopProfiles`、`desktopPnpm`（Host）、`desktopWindow`（Client）三个。不要依赖 `desktopRuntime`、`desktopPnpmBootstrap`、Electron 窗口/托盘、私有 Node helper。
3. **宿主替换（P2）**：Desktop 固定 pinned upstream commit + vendored runtime tgz + launcher 校验，替换宿主必须 fork/symlink 替换工作树并改构建期 client 模块表别名（`@deepseek-ai/*` → `@oasisailab/sponge-*`）。可行性成立但属 Desktop 侧 3–5 人日改造，P1 路径即为当前可交付路径。
4. **局域网无鉴权**：Desktop README 明示开放局域网 = 同网任何人可操作你的电脑，文档需照抄该警告。

# Run Sponge inside DSH Desktop — one command

> 交付物 D4（对应 `2026-08-30-plan-desktop-runnable.md`）。P1 路径：Desktop 跑它自己固定的上游 Host，Sponge 的 Portal / 沙盒插件以**上游身份构建变体**装入独立 profile。实测基线：2026-09-23，Windows 11 + Electron 2.0.14 + upstream `0.1.5-rc.2`。

## 效果

一条命令启动 Desktop 窗口，侧栏底部出现 Sponge 的「沙盒」「容器」两个入口；两个插件的 client bundle 在 renderer 模块表内被加载并服务，渲染进程零 JS 错误。

已知限制：入口按钮当前只完成挂载与渲染，**页面位未挂载**——点击不翻转、画布不出现。原因：上游布局只渲染 `sidebar` / `main` / `rightbar` / `shell.overlay` 四个槽，Sponge 扩展的 `shell.page` / `shell.sandbox` 需要小改 `ui-layout`（见文末适配清单）。

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

1. **`shell.page` / `shell.sandbox` 页面位**：上游 `dsh-client-ui-layout` 只渲染 `sidebar` / `main` / `rightbar` / `shell.overlay`。让 Sponge 页面可操作需要小改布局插件：为 `shell.page` / `shell.sandbox` 增加主区渲染分支，并把侧栏 foot 的点击事件接到路由切换（当前按钮 `aria-pressed` 不翻转即缺这一步）。
2. **受支持契约（勿越界）**：只有 `desktopProfiles`、`desktopPnpm`（Host）、`desktopWindow`（Client）三个。不要依赖 `desktopRuntime`、`desktopPnpmBootstrap`、Electron 窗口/托盘、私有 Node helper。
3. **宿主替换（P2）**：Desktop 固定 pinned upstream commit + vendored runtime tgz + launcher 校验，替换宿主必须 fork/symlink 替换工作树并改构建期 client 模块表别名（`@deepseek-ai/*` → `@oasisailab/sponge-*`）。可行性成立但属 Desktop 侧 3–5 人日改造，P1 路径即为当前可交付路径。
4. **局域网无鉴权**：Desktop README 明示开放局域网 = 同网任何人可操作你的电脑，文档需照抄该警告。

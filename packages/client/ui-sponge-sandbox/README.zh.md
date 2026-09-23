# @oasisailab/sponge-client-ui-sponge-sandbox

[English](README.md) | 中文

Sponge 开发试验台插件：它把 frame 的 `shell.sandbox` 页面位填入一个带明确徽标、仅用于开发的页面，以及一个侧栏底部入口按钮用于开关。该位置位存在的目的是证明一个机制指针；它自身不携带任何产品语义——这里的画布机制在落地 Editor 前先在沙盒里面试。沙盒路由 store 是本包独占的位置，并且刻意独立于 Portal 路由 store，因此开关一个页面绝不影响另一个。

`SandboxShell` 填入 `shell.sandbox`，当路由为 `'none'` 时渲染为空（页面层塌回会话），否则绘制带开发徽标的页头与链式路由的实验区。它声明了 `sponge.sandbox.main` 链，实验视图用路由选择器进入该链。`SandboxEntryButton` 填入一个 `sidebar.footer.action` 槽位，并且坐在 SAME route-store 句柄上，因此开关与页面共享同一个 root-scope 实例。它与 `shell.page` 无任何交互，`shell.page` 的占用者始终是 Portal 页面。

本次携带的实验是一个手写的 DOM/SVG 平移缩放视口（无画布、图形或组件库——只用 CSS tokens）：静态方框与连线，外加拖拽平移、以光标为锚点的滚轮缩放，以及点击选中方框。视图变换数学放在一个纯模块里（`zoomAt`、`panView`、`wheelZoomFactor`、`clampScale`），因此公式可被单元测试；组件只是薄薄的 DOM/SVG 绑定层。这里只有机制，没有任何切片、域或产品语义。

把包的 `dsh.client` 行从 `cordis.patch.yml` 里摘掉，就会零成本地移除入口按钮与该按钮承载的页面：`shell.sandbox` 位置位保持为空、不产生 DOM、并且不影响会话面与 Portal。

`/client` 导出只有插件主体（`apply`/`inject`）加契约类型；SandboxShell、SandboxEntryButton、画布绑定层与路由 store 都保持在 slot 注册背后的包内私有。node 半区只提供一个空的 `apply`。

## 模型体验

无；沙盒页面只渲染本地 UI 状态，这里没有任何东西会到达模型请求。

#### KV 缓存影响

无；本包既不组装也不发送任何请求方请求。

## 已知限制与暂缓工作

- **只有机制、没有语义**——方框与连线不携带任何切片、域或编辑器含义；这些受闸门约束，在后续工作中落地。
- **仅一个已携带的实验**——`pan-zoom` 视口作为链堆上的唯一入口注册；后续实验以零 shell 修改加入更多入口。
- **独立的持久化键**——路由 store 在自己的 `sponge.sandbox.route.v1` 命名空间下持久化，与 Portal 分隔开。
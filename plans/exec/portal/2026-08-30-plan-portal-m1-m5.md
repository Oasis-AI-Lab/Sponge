# Sponge Portal（标准面）执行计划

> 状态：**规划稿**（待评审）｜日期：2026-08-30｜归属：Sponge 论述 / 研发
> 阅读顺序：00（容器/栖息）→ 02 §3.8/§3.9（域 / 信息空间）→ 06 D-L（借 UI 壳）→ 07（两个窗口）
> → `packages/client/AGENTS.md` → slot 系统 note → 本文。
>
> 本文只做规划与设计，不含产品代码。所有"读代码后的结论"均以 2026-08-30 的 `main` 工作树为准，
> 落地前若 harness 有变动，第 1 章需重新核对。

---

## 0. 定案前提与本文立场

1. **Sponge = 容器（信息空间）**（02 §3.9）。agent 是居民，不是使用者；抽象类是内部构造，不是分类学。
   Portal 是容器的**大门**——日常栖息的入口，不是"又一个聊天界面"。
2. **在 DeepSeek Harness 上搭建，借 UI 壳，但绝非同一物**（06 D-L）。
   → 借的是 `apps/web` + client 插件体系 + slots 这套**交互模式**；
   Sponge 本体（容器 / 切片 / 域 / 主体 / 信息空间）的页面必须**独创**。
3. **Editor 与 Portal 的关系**：容器的两个窗口（07）。本期只规划 Portal，Editor 只留接口——
   而本文给出的"接口"就是 slot 本身（见 §2.5）：Editor 落地时作为一个新的 chain 条目注册进
   `sponge.portal.main`，Portal 一行不改。
4. **本文不改变已定的页面划分**（见 §0.1）。

### 0.1 页面清单（已定划分，本文按此展开）

| 页面 | 处置 | 本文落点 |
|---|---|---|
| 容器首页（俯瞰：居民 / 结构概览 / 域状态 / 最近变化） | 独创（只读起步） | §3.2 |
| 对话页（与居民协作） | 复用 ui-conversation 壳 + 容器语境侧栏 | §3.3 |
| 居民档案页（住哪 / 拥有 / 域 / 权限 / 活动） | 独创（活动部分嵌 ui-trajectory） | §3.4 |
| 结构浏览页（只读：切片树 / 依赖 / 场景 / 快照线） | 独创 | §3.5 |
| 活动轨迹页 | 复用 ui-trajectory | §3.4.4 |
| 作业 / 目标页 | 复用 ui-jobs / ui-goal | §1.2.4（重要修正，请先看） |
| 表征应用页（WAM / Lemma 城区） | 后置，本期不规划 | §5.5 |

### 0.2 一句话摘要

> Portal 用 **一个新增的框架页面位 `shell.page` + 一个 chain 路由槽 `sponge.portal.main`**
> 承载三个独创页面；对话 / 轨迹 / 作业 / 目标全部走原生壳，一行不改。
> 数据上 **A 级派生（session/workspace/jobs/goal）先跑起来，B 级最小新增一个只读结构服务，
> C 级（域 / 权限 / 主体域迁移）诚实标注"待 Sponge 核心"并与 MVP 派生值区分显示**。

---

## 1. 现状核对（读代码后的结论）

### 1.1 组装链路：从 `dsh web` 到一屏 UI

| 层 | 事实（读代码核实） |
|---|---|
| `apps/web` | **极薄**：`src/main.ts` 只有 6 行有效代码，`new AppWebEntry(#root).run()`。它不是应用，只是 Vite 打包入口；真正的壳在 `packages/client/web`（`AppWebEntry`）。`dsh web` 注入 `window.__DSH_BOOT__`，所以 `apps/web` 的构建产物单独打开不可用。 |
| `packages/client/web` | 静态持有 Loader 内核 + `ctx.modules`；`PLATFORM_MODULES` 播种 React / Cordis / 静态 UI 库。 |
| 客户端 cordis 树 | 浏览器侧**第二棵 cordis 树**。每个 UI 能力是一个插件，宿主在 `/` 注入 `__DSH_BOOT__` 图、`/plugins/<id>/client.js` 提供 tsdown 闭包 bundle。`immediately: true` 的行在 boot 阶段一预拉。全部 fiber ACTIVE 后 `ctx.uiRenderer.mount()` **一次成型**（无渐进渲染）。 |
| 组合机制 | **只有 slot**。`ui-renderer` 只渲染 `'root'`；插件用唯一 API `ctx.slots.register({ name, children?, store?, inject? }, Component)` 同时占槽、声明+授权子槽、声明 store、注入业务面。 |
| 三注册面 | `tsconfig.client.json` 的 `references` 条目 + `packages/bundle/web-app/cordis.patch.yml` 的 `dsh.client` 行 + `packages/bundle/web-app/package.json` 依赖。**缺任何一处会在不同时点炸**（见 §5.2）。 |
| 目录与产物 | 浏览器半在 `src/client/`，产物**一律落 `lib/`**：`lib/index.js`（node 半）、`lib/client.js`（浏览器 bundle）、`lib/types/**`。**没有 `dist/`**。 |
| 类型程序 | host / client 两套聚合（`tsconfig.host.json` / `tsconfig.client.json`），两边都用 cordis 同名 key 合并 `Context`。 |

关键约束（写进肌肉记忆）：

- **声明即独占**：一个槽的生命周期 = 声明它的 entry 的生命周期。替换 `sidebar` 会连它声明的
  `sidebar.brand.mark` / `sidebar.workspaces` / `sidebar.settings` / `sidebar.footer.action` **一起带走**。
  所以"往容器首页加东西"绝不能靠替换上层槽。
- **跨包只走 slot 与 ctx 服务**，禁止跨包导入符号（`packages/client/AGENTS.md` 导出纪律 3）。
- **store 用工厂**：`createXXXStore()`，模块级 handle 是事实单例，禁止。跨 entry 共享 =
  `apply` 里创建一次，同一个 handle 传给多个 `register`。

### 1.2 选定复用包的实际 slots / 入口（逐个读代码）

#### 1.2.1 ui-layout（壳，唯一声明 `root` 子槽的包）

`packages/client/ui-layout/src/client/index.ts` 一次 `register` 声明四个子槽：

| slot | kind / scope | 现状占用者 |
|---|---|---|
| `sidebar` | `single` / `root` | ui-sidebar 的 `SidebarRoot` |
| `conversation` | `single` / `session-maybe` | ui-conversation 的 `ConversationRoot` |
| `details` | `single` / `session` | ui-conversation 的 `DetailsPanel` |
| `shell.overlay` | `list` / `root` | 框架级浮层，条目自管指针事件（层本身 click-through） |

`AppFrame.tsx` 是三列 grid：`sidebar | center(minmax(0,1fr)) | details`，外加一个
`overlayLayer` div。`shell.overlay` 空时 `renderSlot` 返回 null，div 为空——
**这给了"加一个页面位"最省事的先例：多渲染一个槽，空即无 DOM，AppFrame 不需要任何条件分支。**

#### 1.2.2 ui-sidebar（左列）声明的子槽（Portal 入口在这里）

`packages/client/ui-sidebar/src/client/contract/slots.ts`：

- `sidebar.brand.mark` / `sidebar.brand.name`（single/root）
- `sidebar.workspaces`（single/root）← ui-workspace 占
- `sidebar.settings`（single/root）← ui-settings 占
- **`sidebar.footer.action`（list/root）** ← **Portal 的入口就挂这里**（宽/窄两态，owner 只给 `wide: boolean`）

#### 1.2.3 ui-conversation（中列）声明的子槽（对话页复用面）

`packages/client/ui-conversation/src/client/contract/slots.ts` + `apply.ts`：

- `conversation.session`（single/session）→ `conversation.view`（list/session，视图环）
- `conversation.session.header`（single/session）→ `.actions` / `.utilities`（list/session）
- `conversation.composer`（chain/session）+ `conversation.composer.bar`（single/session-maybe）
- `conversation.input.dock` / `.left` / `.right` / `.model` / `.plan`（list 或 single，session）
- `conversation.chat.node`（keyed/session）、`conversation.chat.turnTail`（chain/session）
- `conversation.hero.workspace` / `.brand.mark` / `.agentPreset`（root，仅无会话时）
- `conversation.details.tool`（single/session）

**结论**：中列被 ui-conversation 完整拥有，root 作用域的槽只有三个 hero 位，且只在"无当前会话"时渲染。
**Portal 无法在中列里插入列级 chrome**，只能在它已声明的槽里插。这是 §2.5 方案论证的硬约束。

#### 1.2.4 ui-trajectory / ui-jobs / ui-goal（重要修正）

| 包 | 实际注册（读代码） | 它是"页面"吗 |
|---|---|---|
| ui-trajectory | `slots.inject('conversation.view', …)`，一个 `id: 'trajectory'` 的**视图环条目**（session 作用域），另有 5 个 ConversationNode Definition 注册 | **不是页面**，是会话视图环的一个 tab。它的 props 是 `PropsRuntime<'conversation.view'>`，**依赖 session 作用域的 `useSession`** |
| ui-jobs | `slots.inject('conversation.session.header.actions', …)`，`id: 'job-list'`，`order: 20` | **不是页面**，是会话标题旁的一个按钮 + popover |
| ui-goal | `conversation.input.dock`（`id:'goal'`）+ `conversation.chat.node`（`key:'command-input'`）+ 一个 ProjectionDefinition | **不是页面**，是 composer 上方的一条 goal 条 |

> ⚠️ **必须向团队明确的诚实结论**：
> 页面清单里的"活动轨迹页 / 作业·目标页"在 harness 里**根本不是页面**，而是会话内的 chrome。
> 因此本期有两种读法，**必须在 M0 裁决**：
> - **读法一（本文推荐，成本最低）**：作业与目标**没有 Portal 页面**——它们以原生形态出现在对话页的
>   会话 header（jobs）与 composer（goal）上，这正是"复用 ui-jobs / ui-goal"的字面兑现。
>   活动轨迹则是居民档案页的一个区块（§3.4.4）。
> - **读法二**：若要一个全局的"作业 / 目标"页面，需要 ui-jobs / ui-goal 各**改一处**
>   （各新增一个 `slots.inject('sponge.portal.…', …)` 注册，与 §3.4.4 同一模式）。成本约 20 行 / 包，
>   代价是**上游包硬编码下游槽名**，需评审。
>
> 本文按读法一展开，读法二列为待裁决项 D-P3。

### 1.3 数据源核对（重点，诚实）

#### 1.3.1 头号事实：Sponge 核心在 harness 里**不存在**

逐个核对的结论：

- `packages/` 下**没有任何** Sponge 本体包——没有切片、没有域、没有主体、没有信息空间、没有调度器。
  （对 `slice|Slice|InfoSpace|infoSpace` 的全仓扫描只命中 `Array.prototype.slice` 之类无关代码。）
- Sponge 核心的唯一实现是 **`研发/impl/`**：一个**独立 TS 工程**（自己的 `package.json`、
  自己的 `node_modules`，`npm test`，不在 pnpm workspace 内），目前只有 `src/base/`
  （`slice.ts` + `store.ts`），即 **Slice + 内容寻址快照池**，10/10 测试通过。
  按 `impl/PLAN.md` 的既定结构，`mechanism/ role/ content/ runtime/ tools/` **全部未开工**。
- `impl` 的 `SPEC.md` 自己标注为 **"working hypothesis（工作台假设）"**，不是锁定的契约。
- `Slice` 模型（`impl/src/base/slice.ts`）：
  `{ id, name, kind(开放字符串，默认 'free'), parent, content(不透明), latest(hash) }`
  + `create / rename / save / load / subclass`。**没有域、没有 owner/role、没有权限、没有场景、没有依赖边。**

**推论**：Portal 的"容器 / 切片 / 域 / 主体"四个概念里，**只有"切片"有一份能读的模型**，
而且它不在 harness 进程内、没有服务、没有 Remote、没有事件。**其余三个在代码层面是零。**

#### 1.3.2 现有数据面（harness 里真实存在、Portal 可以直接吃）

| 数据 | 通道 | 已核实形状 |
|---|---|---|
| 会话列表 | `ctx.sessions.list`（对象层可观察源）+ 全局 `useSessions()` | `SessionSummary { id, title?, displayTitle, cwd?, agentPreset?, parentId?, origin?: 'subagent', running, pendingInteraction?, completed?, blank, updatedAt, projectionValues? }` |
| 工作区列表 | `ctx.workspaces`（`WorkspaceRuntime`）+ 全局 `useWorkspaces()` | `WorkspaceListState { items: WorkspaceView[], archivedSessionIds, state, phase, error, baselinesReady, recentWorkspaceId }`；`WorkspaceView { workspaceId, path, title, sessionIds, createdAt, updatedAt }` |
| 后台作业 | `ctx.jobs` 的 `jobsBySession` 镜像（ui-jobs 就是这么读的） | `JobView { id, kind, label, status, detail?, startedAt, finishedAt? }` |
| 目标 | `ctx.remote.goals` + 每会话 `useProjection('goal')` | `GoalProjection { goal: { id, revision, … } }` |
| 会话事件流 / 轨迹 | 对象层 `Session` + ui-trajectory 的 ConversationNode Definition | 事件窗口 + 增量投影 |
| 宿主插件清单 | `host-plugin-inventory` Remote（`ctx.remote.pluginInventory`） | 只读的 Loader 条目投影 |
| 文件系统 / 目录 | `file-reference` Remote、`workspace.*` RPC 的目录浏览 | 目录列表 / 文件引用 |
| 域 / 主体 / 切片元数据 | **无** | — |
| 权限（authority） | **无**（`ui-permission-presets` 只是访问模式的预设切换） | — |

#### 1.3.3 逐页 MVP 数据方案（A / B / C 三级，诚实标注）

> **A 级**＝现有数据面可直接映射，MVP 起即可用；
> **B 级**＝最小新增服务即可，不依赖 P0 未决项；
> **C 级**＝需 Sponge 核心实现后才有效，**MVP 用派生值或桩，且必须在 UI 上显式标注**。

**容器首页**

| 区块 | 级别 | MVP 方案 |
|---|---|---|
| 居民概览（有多少居民、谁在动） | **A** | 由 `useSessions()` 派生：按 `agentPreset ?? 'default'` 聚合成"居民"；`running` / `updatedAt` 给活跃度。另 `origin === 'subagent'` 的会话归到其 `parentId` 居民名下（子 agent 不是独立居民，是同一居民的分支活动）。 |
| 结构概览 | **B** | 见 §1.3.4。MVP 先显示"工作区数 / 已登记切片数 / 结构源（目录 or 桩）"；若 `slices/` 目录不存在，显示"尚无结构登记"而不是假数据。 |
| 域状态 | **C** | **01 §3.8 / P1-10 的域粒度未定**（切片级 / 元素级 / 内容级未裁决），MVP **不编造**：显示"未分级（待域粒度裁决）"，并给出按现有字段的**纯派生提示**（如"本页 N 个切片均无域元数据"）。 |
| 最近变化 | **A** | `sessions` 按 `updatedAt` 取前 N 条 + `jobs` 的 `startedAt/finishedAt` + 结构目录 mtime（B 级才有）合并成一条时间线。排序在**渲染侧纯函数**里做（`useMemo`），不建订阅。 |

**对话页**（复用壳）——数据全部由 ui-conversation 自己负责，Portal **零数据责任**。
只有"语境侧栏"需要数据，且全部是 A 级（当前会话的 `agentPreset` / `cwd` / 所属 workspace）。

**居民档案页**

| 区块 | 级别 | MVP 方案 |
|---|---|---|
| 身份 | **A** | `agentPreset` 或 `displayTitle`；`origin`/`parentId` 给血缘。 |
| 住哪 | **A** | 会话 `cwd` → 所属 `WorkspaceView`（`sessionIds` 反查）。 |
| 拥有 | **A** | 该居民名下的 session 列表 + `jobs` + `goal` 投影。 |
| 域 | **C** | 同上，显示"未分级"。 |
| 权限 | **C** | 调研**建议 05** 要求 `authority` 扩为 `(subject, delegate_of, scopes, issued_at, expires_at, revocable)`；harness 里没有 authority 概念 → MVP 显示"权限模型待定（建议 05）"，**不显示假的权限开关**。 |
| 活动 | **A** | 嵌 ui-trajectory（§3.4.4）。 |

**结构浏览页**

| 区块 | 级别 | MVP 方案 |
|---|---|---|
| 切片树 | **B** | 读 `slices/` 目录（对齐**建议 04 的 S1′**：`plugin.json` 信封 + 私有 `slices/`）。节点 = `Slice` 的 `{id,name,kind,parent,latest}`。MVP 用 `impl` 的同一 shape，保证未来对接零转换。 |
| 依赖 | **C** | `Slice` 模型**没有边**（`parent` 是派生链，不是依赖边）。依赖需要"通道"（P0-1，调研**建议 02** 才给出候选定义）。MVP：只画 `parent` 派生链，**明确标注"依赖边待通道定义"**。 |
| 场景 | **C** | 场景抽象类在 `impl` 里未开工。MVP：结构目录里若出现 `scenes/` 则只读列出；否则显示"无场景登记"。 |
| 快照线 | **B** | `latest`（内容寻址 hash）+ 快照池目录可直接列出 hash 序列 → **这是 MVP 唯一"真"的结构时间线**，因为 `save()` 每次产出新 hash。语义上它是"版本线"而非"演化线"，UI 文案必须写"版本快照"而非"演化"。 |

**活动轨迹 / 作业 / 目标** —— 全部 A 级，零新增需求（见 §1.2.4 读法一）。

#### 1.3.4 最小新增服务接口草案（B 级的全部内容）

**新增 host 包 `packages/sponge/structure`**（只读起步，不写、不调度、不演化）。
它**不实现 Sponge 核心**，只把"已经落在磁盘上的结构"读成视图——
这与 07 的"编辑的是结构，不是只读视图"不冲突：Editor 写文件，Portal 读文件，两者互不知。

```ts
// packages/sponge/structure/types.ts —— 全部 JSON 兼容（client 组铁律：UI 域之间只共享 JSON + 回调）

/** 域（02 §3.8）。MVP 允许 'undeclared'：未分级不是"待进化"，是"尚无元数据"。 */
export type DomainView = 'undeclared' | 'evolving' | 'fixed' | 'subject'

/** 切片只读视图：字段对齐 impl/src/base/slice.ts 的 Slice，未来对接零转换。 */
export interface SliceNodeView {
  id: string
  name: string
  kind: string            // 开放命名空间，默认 'free'；服务不解释 kind（base ignorance）
  parent: string | null   // 派生链（唯一 MVP 可画的边）
  latest: string | null   // 内容寻址快照 hash
  domain: DomainView      // MVP 恒为 'undeclared'
  children: string[]
}

/** 结构快照（版本线，非演化线）。 */
export interface SnapshotRefView { hash: string; savedAt?: number }

/** 场景登记（MVP 只读列出，不解释）。 */
export interface SceneView { id: string; name: string; sliceId: string }

/** 居民（主体）视图：MVP 由 session/agent 派生，字段预留 authority（建议 05）。 */
export interface SubjectView {
  id: string
  name: string
  origin: 'agent-preset' | 'session' | 'subagent' | 'user'
  domain: DomainView
  /** 调研建议 05 的最小落点；MVP 全部留空并在 UI 标注。 */
  authority: {
    owner: string
    role: string
    delegateOf?: string
    scopes: string[]
    issuedAt?: number
    expiresAt?: number
    revocable: boolean
  } | null
  residency: { workspaceId: string | null; sliceIds: string[] }
  activity: { sessionIds: string[]; jobIds: string[]; lastActiveAt: number | null }
}

/** 容器只读视图：一次 RPC 拿全，客户端不做增量合并。 */
export interface ContainerView {
  slices: SliceNodeView[]
  roots: string[]
  scenes: SceneView[]
  subjects: SubjectView[]
  generatedAt: number
  /** 数据出处——UI 必须能显示它，防止派生值被当成真值。 */
  source: { kind: 'directory'; root: string } | { kind: 'derived'; from: 'sessions+workspaces' } | { kind: 'stub' }
}
```

**Remote 方法（只读五个，够 MVP 用）**

```
sponge.container.get()                     -> ContainerView
sponge.slices.list(parent?: string|null)   -> { items: SliceNodeView[] }
sponge.slices.get(id)                      -> { slice: SliceNodeView; snapshots: SnapshotRefView[] }
sponge.subjects.list()                     -> { items: SubjectView[] }
sponge.subjects.get(id)                    -> { subject: SubjectView }
```

**变更通知（M5 接入）**：走 `packages/api/remotes/src/remote-events.ts` 的转发允许表加一个
`sponge/structure-changed`；MVP 阶段客户端用**轮询**（定时器挂在 inject 闭包里，随 entry 生命周期销毁），
不用事件——少一条 forward 允许表改动，M1–M4 不受阻塞。

---

## 2. 包结构与注册面

### 2.1 包清单与拆包论证

| # | 包 | 半 | 说明 |
|---|---|---|---|
| 1 | `packages/client/ui-sponge-portal` | 浏览器 | **Portal 核心**：路由 store、页面位条目、导航入口、语境侧栏、三个独创页面 |
| 2 | `packages/sponge/structure` | 宿主 | 只读结构服务 + Remote + 目录扫描（B 级数据） |

**论证：三个独创页面独立成包，还是并入 portal？→ 结论：MVP 单包，目录按未来包边界切**

| 理由 | 说明 |
|---|---|
| store 不能跨包共享 | 三个页面共享同一个路由 store。store handle **永远不出包**（slot 标准明写"constructively impossible"）。拆包后要么各注册各的（路由状态分裂），要么升格为 ctx 服务（为查看态新建一个跨包服务，违反"业务数据不进 store、查看态不进服务"之外的另一条：服务是给别的插件用的能力，路由不是）。 |
| 注册面成本 | 每多一个包就多三个注册面 + 一个 bundle 行 + 一个 README 表行 + 一个 invariant。MVP 阶段收益为负。 |
| 已有先例 | `ui-conversation` 就是多域单包：`contract/` + 域目录 + `apply.ts` 单一跨域装配点，`scripts/verify-client-domain-graph.ts` 强制域间不互导。**将来拆包 = 移动目录**，不是重写。 |
| 预算 | 10k 行预算压力在 Editor（07 八节明写）。Portal 应保持单包低开销，估计 ~1.5k 行源码 + ~1k 行测试。 |

**触发拆包的条件**（写进包 README，避免以后争论）：
`src/client` 超 2500 行，或表征应用（WAM / Lemma）接入需要独立生命周期时，
把 `resident/` `structure/` 迁出为 `ui-sponge-resident` / `ui-sponge-structure`。

**新组 `packages/sponge/`**：`packages/README.md` 说"New packages join existing groups; new groups
update their README and this table"。Sponge 本体是自主的，独立成组更诚实。
→ 需更新 `packages/README.md` 表 + 新建 `packages/sponge/README.md`。
**退路（若评审认为新组过早）**：先落 `packages/experimental/sponge-structure`（Unreleased，
`private`），M5 决策点再迁。这是待裁决项 **D-P4**。

### 2.2 `packages/client/ui-sponge-portal` 包骨架

```
packages/client/ui-sponge-portal/
├── package.json          # exports . / ./invariant / ./client / ./src/* / ./package.json
│                         # dsh.client: { platform:'web', inject:[…] }
│                         # files: lib/index.js, lib/invariant.js, lib/client.js, lib/types/**/*.d.ts
├── tsconfig.json         # extends tsconfig.base.client.json; rootDir src; outDir lib/types
│                         # references: locale, runtime, connection/tsconfig.client.json,
│                         #   ui-slots, ui-primitives, ui-layout, ui-sidebar, ui-conversation,
│                         #   ui-trajectory, runtime-diagnostics/invariants, vendor/cordis
├── tsdown.config.ts      # clientBundle('@oasisailab/sponge-client-ui-sponge-portal',
│                         #   ['lib/types/index.js','lib/types/invariant.js'])
├── css-modules.d.ts
├── README.md             # 含 Model Experience 段 + Known Limitations
├── src/index.ts          # node 半：空 apply
├── src/invariant.ts      # 伴生不变式（真实理由，非生成占位）
└── src/client/
    ├── contract/         # 唯一的跨域共享面：SlotMap merge + owner 契约 + 视图类型
    │   ├── slots.ts
    │   └── views.ts      # SubjectView / SliceNodeView 等的客户端只读镜像（type-only，不导入宿主包）
    ├── stores.ts         # createPortalRouteStore()
    ├── service.ts        # 容器数据源：远端优先 → 派生回退（apply 世界）
    ├── shell/            # PortalShell（shell.page 占用者）+ PortalNav + PortalContextPanel
    ├── home/             # 容器首页
    ├── resident/         # 居民档案页
    ├── structure/        # 结构浏览页
    ├── context/          # 语境侧栏（shell.overlay 条目）
    ├── entry/            # sidebar.footer.action 入口按钮
    ├── locales.ts        # zh / en 字典，NS = 'sponge-portal'
    └── apply.ts          # 唯一跨域装配点
```

`package.json` 的 `dsh.client.inject`（**仅信息性**，不排序激活）：

```json
"dsh": {
  "client": {
    "platform": "web",
    "inject": [
      "@oasisailab/sponge-client-locale",
      "@oasisailab/sponge-client-runtime",
      "@oasisailab/sponge-client-ui-conversation",
      "@oasisailab/sponge-client-ui-layout",
      "@oasisailab/sponge-client-ui-sidebar",
      "@oasisailab/sponge-client-ui-trajectory"
    ]
  }
}
```

依赖声明（按 `packages/client/AGENTS.md` 第 3 条）：

- **dependencies**：无 `@oasisailab/*`（动态包永不把 workspace 包放进 dependencies）。
  `clsx` 之类普通库照例放这里。
- **peerDependencies + devDependencies**：上面 inject 列表里的每个内部动态包，
  加 `@oasisailab/sponge-invariants`、`@oasisailab/sponge-cordis`。
  **ui-trajectory 是 peer/dev 双向边**（Portal 声明槽、trajectory 填槽），
  npm 层循环是允许的（`AGENTS.md` 依赖声明第 5 条），且两边都无值导入，
  同步模块请求图无环。
- **devDependencies 仅**：`@oasisailab/sponge-client-test-runtime`、
  `@oasisailab/sponge-client-ui-primitives`、`@oasisailab/sponge-client-ui-slots`、
  react / react-dom / @types/*（静态输入对动态消费者永远 dev-only）。
- **`dsh.client.external` 不填**：React / Cordis / runtime / ui-primitives / ui-slots 是基线，
  隐式外部化，重复声明会被 `verify-client-packages` 拒。

### 2.3 `packages/sponge/structure`（宿主包）

按 `packages/AGENTS.md`：`src/index.ts`（`TypertRemoteService` 子类，方法用 `@Remote('…')` 装饰）、
`src/invariant.ts`、**必须**的 `## Known Limitations and Deferred Work` README 段、
`export const name = 'sponge-structure'`、`inject` 声明它真正读的服务。
出口参照 `packages/goal/goal`：`./remote`（Typert 生成面）、`./types`（客户端安全的纯类型）、
`./invariant`、`./src/*`。
它的 `./types` 是 Portal `contract/views.ts` 的**镜像来源**——Portal 用 `export type { … } from
'@oasisailab/sponge-structure/types'` 重导，**不复制结构**（复制就会漂移）。

### 2.4 三注册面（缺一处 = 不同的失败点）

| # | 位置 | 内容 | 遗漏后的故障现象 |
|---|---|---|---|
| 1 | `tsconfig.client.json` | `references` 加 `{ "path": "./packages/client/ui-sponge-portal" }` | 客户端类型程序看不到新包；`tsc -b` 报未解析引用，且 `SlotMap` merge 不生效 → 别人的 `PropsRuntime<'shell.page'>` 解析成 never |
| 2 | `packages/bundle/web-app/cordis.patch.yml` | 浏览器名册加一行 `- id: ui-sponge-portal` / `name: '@oasisailab/sponge-client-ui-sponge-portal'` | 包根本不进 `__DSH_BOOT__`，浏览器永不加载，无报错 |
| 3 | `packages/bundle/web-app/package.json` | `dependencies` 加该包 | profile 启动经 `$DSH_HOME/profiles/node_modules` 回退解析裸名时失败 → **import 报错**（不是静默） |
| 4 | `packages/client/README.md` | 包表加一行 | `pnpm run doc-sync` / 文档门禁红 |
| 5 | `packages/README.md`（仅新组时） | 组表加一行 + 新组 README | 同上 |

宿主包 `packages/sponge/structure` 另有自己的三注册面：`tsconfig.host.json` 的 `references`、
`cordis.patch.yml` 的宿主行（`insert:` 段，非 `dsh.client` 段）、`web-app/package.json` 依赖。

**落地顺序**：先 1 + 2 + 3，`pnpm --filter @oasisailab/sponge-client-ui-sponge-portal bundle`
后起 `dsh web` 验证；README 表在提 PR 前补齐。

### 2.5 挂点：为什么必须新增 `shell.page`（方案论证）

**问题**：三个独创页面需要一个"页面级"位置。现有槽里没有：

| 候选 | 为什么不行 |
|---|---|
| 替换 `conversation` | 会带走 ui-conversation 声明的全部子槽，对话面直接没了 → 违反"对话页复用 ui-conversation 壳" |
| 替换 `conversation.session` | 同上，`conversation.view` 环（chat / trajectory）一起消失 |
| `conversation.view`（list/session） | session 作用域；容器首页与结构浏览是 root 作用域，且它一次只渲染一个 tab |
| `details` / `conversation.session.header.*` | 语义与几何都不对（右列 / header 小条） |
| `shell.overlay`（list/root，零改壳） | **能跑**：浮层覆盖全主区，Portal 自绘 chrome。代价：① 中列 conversation 仍在下面跑（流继续、渲染继续）；② 几何与 z-index 全靠自己，与 sidebar/details 的 concession 求解脱钩；③ 快照测试更脆。**列为备选方案 B** |

**推荐方案 A：给 ui-layout 新增一个 root 作用域页面位 `shell.page`（single / root）**

改动量（ui-layout，约 12 行）：

```ts
// packages/client/ui-layout/src/client/index.ts —— SlotMap merge 加一行
    /**
     * Frame-level page seat: a root-scope, single-occupant region that covers
     * the main area (center + details tracks) while occupied. The frame gives
     * POSITION only — no chrome, no navigation semantics, no copy. An
     * unoccupied seat renders nothing and costs no layout, so composing the
     * owning plugin out removes the surface entirely.
     */
    'shell.page': { kind: 'single'; scope: 'root'; owner: ShellPageOwnerProps }
```

```ts
// 同一个 register 调用的 children 加一行
        'shell.page': { kind: 'single', scope: 'root' },
```

```tsx
// AppFrame.tsx —— props 类型加一个键，grid 里加一个 item
export type AppFrameProps =
  & PropsRuntime<'root'>
  & PropsRenderSlots<'sidebar' | 'conversation' | 'details' | 'shell.overlay' | 'shell.page'>
  & PropsStore<ReturnType<typeof createLayoutStore>>

// …
      {/* Position only: empty while unoccupied (renderSlot returns null), so
          the track collapses and the columns underneath keep their geometry. */}
      <div className={css.pageLayer} data-shell-page>
        {renderSlot('shell.page', {})}
      </div>
```

```css
/* AppFrame.module.css */
.pageLayer { grid-column: 2 / 4; grid-row: 1; position: relative; z-index: 1; min-width: 0; }
.pageLayer:empty { display: none; }
```

**为什么这样改是"借壳不借魂"**：框架只给**位置**，不给任何 Sponge 语义——
没有容器、没有路由概念、没有文案、没有 chrome。Portal 组件是纯粹的 occupant。
这和 `shell.overlay` 的定位完全一致（`shell.overlay` 的注释原文就是
"Deliberately generic and unowned by any feature"）。

**关于"能不能不改壳"**：备选方案 B（`shell.overlay`）确实零改壳，M1 若评审卡住可以先用它打通，
但我们**不建议**把它作为终态——它把 Portal 变成"浮在对话上的一层"，而 Portal 在概念上
是容器的大门，不是对话的浮层。这是待裁决项 **D-P1**。

### 2.6 slot 声明总表（SlotMap merge 草案）

命名遵循 `<domain>.<entry>.<hole>`。

| slot | kind / scope | 声明者 | 占用者 | 备注 |
|---|---|---|---|---|
| `shell.page` | `single` / `root` | **ui-layout（新增）** | `PortalShell` | 主区页面位，空即无 DOM |
| `sponge.portal.nav` | `single` / `root` | `PortalShell` | `PortalNav`（同包） | 容器内导航 |
| `sponge.portal.main` | **`chain`** / `root` | `PortalShell` | 三个页面各一条 chain 注册 | 页面路由；新页面零 owner 改动 |
| `sponge.portal.context` | `single` / `root` | `PortalShell` | `PortalContextPanel` | 页面右侧语境 / 详情 |
| `sponge.portal.home.residents` | `list` / `root` | `ContainerHome` | 居民卡行 | 首页可增量 |
| `sponge.portal.home.changes` | `list` / `root` | `ContainerHome` | 最近变化行 | 同上 |
| `sponge.portal.resident.owned` | `single` / `root` | `ResidentProfile` | 拥有物列表 | |
| `sponge.portal.resident.activity` | `single` / **session** | `ResidentProfile` | **ui-trajectory（inject 贡献）** | 见 §3.4.4 |
| `sponge.portal.structure.tree` | `single` / `root` | `StructureBrowser` | 切片树 | |
| `sponge.portal.structure.snapshots` | `single` / `root` | `StructureBrowser` | 版本快照线 | |
| `sidebar.footer.action` | `list` / `root` | ui-sidebar（**已有**） | `PortalEntryButton` | **Portal 入口** |
| `shell.overlay` | `list` / `root` | ui-layout（**已有**） | `PortalContextAside` | **对话页语境侧栏** |

**Portal 绝不声明** `sidebar.*`、`conversation.*`、`settings.*`、`tool.*`——那是别人的域；
声明了就是 load-time 硬错误（"a second entry declaring an already-declared slot"）。

---

## 3. 页面 × 数据 × 组件拆解

### 3.0 公共：路由 store、owner 货币、四 shares

```ts
// src/client/stores.ts —— 工厂形式，模块级 handle 禁止
export type PortalRoute =
  | { readonly name: 'none' }                                              // 页面位空 → 中列对话面可见
  | { readonly name: 'home' }
  | { readonly name: 'resident'; readonly subjectId: string; readonly sessionId?: string }
  | { readonly name: 'structure'; readonly sliceId?: string }

export interface PortalRouteState {
  route: PortalRoute
  expandedSliceIds: string[]     // 查看态：结构树展开
  contextWidth: number           // 查看态：语境栏宽度
}

export function createPortalRouteStore() {
  return defineStore({
    init: (): PortalRouteState => ({ route: { name: 'none' }, expandedSliceIds: [], contextWidth: 320 }),
    persist: { name: 'dsh.sponge.portal' },
    actions: {
      openHome: (d) => { d.route = { name: 'home' } },
      openResident: (d, subjectId: string, sessionId?: string) => {
        d.route = { name: 'resident', subjectId, sessionId }
      },
      openStructure: (d, sliceId?: string) => { d.route = { name: 'structure', sliceId } },
      close: (d) => { d.route = { name: 'none' } },
      toggleSlice: (d, id: string) => {
        d.expandedSliceIds = d.expandedSliceIds.includes(id)
          ? d.expandedSliceIds.filter(x => x !== id)
          : [...d.expandedSliceIds, id]
      },
      setContextWidth: (d, px: number) => { d.contextWidth = clampWidth(px, 240, 560) },
    },
  })
}
```

**chain 的 owner 货币**（`sponge.portal.main`）：

```ts
export interface PortalRouteOwner {
  /** 当前路由；chain 条目用 select 自荐，owner 不认识任何页面。 */
  route: PortalRoute
  /** 派生的居民表（纯函数产物，不是订阅结果）。 */
  subjects: readonly SubjectView[]
}
```

**为什么用 chain 而不是 single**：slot 标准原文——"chain 条目自我提名，先匹配者渲染；
owner 只知道一种通用货币，新增 takeover 包零 owner 改动"。
Portal 的新页面（含未来的 Editor 面、表征应用城区）就是这种"零 owner 改动"的场景。

**PortalShell 的四 shares**

```ts
export type PortalShellInjected = {
  hooks: {
    /** 容器只读快照源（bare observable；组件只看到 useContainer）。
     *  远端可用时读 Remote；否则退化为 sessions+workspaces 的派生器（§1.3.4）。 */
    container: HostObservable<ContainerView>
  }
  /** 对话页：关闭页面位并让原生会话面接管（ctx.sessions.open）。 */
  openConversation: (sessionId: SessionId) => void
  /** 结构源重扫（B 级服务存在时才有意义；缺失时是 no-op，UI 显示"结构源不可用"）。 */
  refreshStructure: () => void
}

export type PortalShellProps =
  & PropsRuntime<'shell.page'>
  & PropsRenderSlots<'sponge.portal.nav' | 'sponge.portal.main' | 'sponge.portal.context'>
  & PropsStore<ReturnType<typeof createPortalRouteStore>>
  & InjectFace<PortalShellInjected>
  & PropsLocale<'sponge-portal'>
```

`apply.ts` 的装配（**store handle 在 apply 里创建一次，传给三个 register**）：

```ts
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sponge-portal: dictionaries')
  const route = createPortalRouteStore()          // 一次创建，三处共享
  const container = createContainerSource(ctx)    // §3.1 的数据源装配

  // 1. 页面位：等 ui-layout 声明 shell.page（方案 B 下改为 shell.overlay）
  ctx.slots.inject('shell.page', () => ctx.slots.register({
    name: 'shell.page',
    locale: NS,
    children: {
      'sponge.portal.nav':     { kind: 'single', scope: 'root' },
      'sponge.portal.main':    { kind: 'chain',  scope: 'root' },
      'sponge.portal.context': { kind: 'single', scope: 'root' },
    },
    store: route,
    inject: (): PortalShellInjected => ({
      hooks: { container },
      openConversation: (id) => { ctx.sessions.open(id); route.actions.close() },
      refreshStructure: () => { container.refresh() },
    }),
  }, PortalShell))

  // 2. 入口按钮（已有槽）
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'sponge-portal', order: 10, locale: NS,
    store: route,
  }, PortalEntryButton))

  // 3. 对话页语境侧栏（已有槽，浮层）
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'sponge-portal-context', locale: NS,
    store: route,
    inject: (): PortalContextAsideInjected => ({
      hooks: { container },
      openResident: (id, sessionId) => { route.actions.openResident(id, sessionId) },
    }),
  }, PortalContextAside))

  // 4. 三个页面的 chain 注册（每个页面一个 inject，各自独立装卸）
  ctx.slots.inject('sponge.portal.main', () => ctx.slots.register({
    name: 'sponge.portal.main', locale: NS,
    select: (o: PortalRouteOwner) => (o.route.name === 'home' ? { subjects: o.subjects } : null),
    children: {
      'sponge.portal.home.residents': { kind: 'list', scope: 'root' },
      'sponge.portal.home.changes':   { kind: 'list', scope: 'root' },
    },
    inject: homeInjected,
  }, ContainerHome))
  // … resident / structure 同构
}
```

注意 `slots.inject` 的语义：它**等真正的声明出现**，声明坍塌时撤下贡献，重新声明后重跑，
并随调用方 fiber 一起离场——这正是"贡献者与声明者激活顺序无关"的标准解法。
**裸 `slots.register` 进未声明的槽是错误**，必须走 inject。

### 3.1 数据源装配（`service.ts`）

```ts
/**
 * The container data source: a bare observable over a read-only ContainerView.
 * Remote-first; falls back to a derived view over the object layer when the
 * host service is absent (the pre-Sponge-core window), and to a marked stub
 * when neither can produce anything. Every non-remote view carries its
 * `source` discriminator so the UI can never present a derived value as real.
 */
function createContainerSource(ctx) { /* … */ }
```

三条通道，按可达性降级（**每一次降级都体现在 `ContainerView.source` 上**）：

1. `ctx.remote.sponge?.container.get()`（M5 后）——`source.kind = 'directory'` 或 `'stub'`；
2. 派生器：订阅 `ctx.sessions.list`（对象层可观察源）+ 轮询 `ctx.workspaces`，
   在 apply 世界内折叠出 `SubjectView[]`——`source.kind = 'derived'`；
3. 都拿不到：返回 `source.kind = 'stub'` 的空视图，UI 显示"容器数据不可用"。

派生的折叠逻辑是**纯函数**（`deriveSubjects(sessions, workspaces): SubjectView[]`），
单独成文件、单独测试——这是 Portal 里唯一有真实业务密度的地方，也是最容易漂移的地方。

### 3.2 容器首页（独创 / 只读）

**组件树**

```
ContainerHome                       (chain: sponge.portal.main, select route.name==='home')
├── ContainerSummaryHead            居民数 · 结构登记数 · 运行中作业数 · 数据源徽标（source.kind）
├── DomainStrip                     ★C 级：显示「未分级（域粒度待裁决 · 06 P1-10）」+ 计数
├── ResidentGrid                    renderSlot('sponge.portal.home.residents')
│   └── ResidentCard × N            （默认注册；未来表征应用可追加行）
│        └── 「对话」「档案」两个动作
└── ChangeFeed                      renderSlot('sponge.portal.home.changes')
     └── ChangeRow × N              session.updatedAt / job 起止 / 结构 mtime 合并排序
```

**数据**：全部来自 `useContainer()`（inject hooks 绑定）+ `useSessions()` / `useWorkspaces()`。
排序与聚合是 `useMemo` 纯函数，**不是新订阅**。

**props / store**：首页**不声明自己的 store**。选中态、hover、折叠这类一次性状态留在组件本地
（`useState`）；跨 entry 或跨重挂载才进 store（此处只有路由 store 是共享的）。

**可点验收行为**：见 §4 M2。

### 3.3 对话页（复用 ui-conversation 壳 + 容器语境侧栏）

**组件树**

```
原生中列（ui-conversation ConversationRoot，一行不改）
  + PortalContextAside              (shell.overlay, id 'sponge-portal-context', root, 共享 route store)
      ├── 当前居民卡（身份 · 域标签 · 「查看档案」→ openResident）
      ├── 所在切片（来自 container.slices；MVP 多为「未登记」）
      └── 数据源徽标 + 收起按钮
```

**为什么语境侧栏走 `shell.overlay` 而不是再改一次壳**：
`shell.overlay` 的定义就是"frame-wide floating layer above every column，
entries 自管指针事件"——一个贴在右侧的常驻只读面板天然属于这里，
而且它是 **list**，Portal 加一条不影响别人。**零改壳。**

**数据流**：`route.store` 判断可见性（`route.name === 'none'` 时渲染 null）；
当前居民由 `useSessions()` 的 `current` + `agentPreset` 派生（`useMemo`），
不额外订阅。

**副作用说明**：从容器首页点「对话」会 `ctx.sessions.open(sessionId)` + `route.actions.close()`，
页面位因此渲染 null，中列对话面露出。**一次动作完成"离开容器页面、进入对话"**，符合容器隐喻。

### 3.4 居民档案页（独创，活动嵌 ui-trajectory）

**组件树**

```
ResidentProfile                     (chain: sponge.portal.main, select route.name==='resident')
├── ResidentHeader                  身份 · origin · ★C 级「域：未分级」
├── AuthorityPanel                  ★C 级：显示「权限模型待定（调研建议 05）」——不是假的开关
├── ResidencyPanel                  A 级：所属 workspace（cwd → sessionIds 反查）+ 切片（多为未登记）
├── OwnedPanel                      renderSlot('sponge.portal.resident.owned')  A 级：sessions + jobs + goal
└── ActivityPanel                   renderSlot('sponge.portal.resident.activity')  ← ui-trajectory
```

#### 3.4.4 活动区如何嵌 ui-trajectory（关键设计）

**约束**：`TrajectoryView` 的 props 是 `PropsRuntime<'conversation.view'>`，
依赖 **session 作用域**的 `useSession`。Portal 是 root 作用域的页面，**拿不到组件**
（跨包导入禁止、组件不是 API）。

**解法（合法且最小）**：

1. Portal 把活动区声明为 **`sponge.portal.resident.activity`（single / session）**；
   session 作用域让渲染器注入 `SessionProvider` 并把 `sessionId` 作为框架标准 prop 交给 occupant，
   `TrajectoryView` 因此**原样可用**。
2. ui-trajectory **改一处**（约 8 行）：在现有 `conversation.view` 注册之外，追加一条
   `ctx.slots.inject('sponge.portal.resident.activity', () => ctx.slots.register({ name: 'sponge.portal.resident.activity', locale: NS, inject: <同现有的 TrajectoryViewInjected 工厂> }, TrajectoryView))`。
   inject 工厂复用现有闭包（`ctx.sessions.binding(sessionId)?.session` / `loadOlder` / duration store），
   **不新增任何业务分支**。
3. 依赖边：ui-trajectory 的 `peerDependencies`/`devDependencies` 加
   `@oasisailab/sponge-client-ui-sponge-portal`，`dsh.client.inject` 同步加一行。
   **npm 层循环允许**；两边都无值导入，同步模块图无环。

**副作用（必须写进注释与文档）**：session 作用域的子槽取的是**当前会话**。
因此 Portal 在 `openResident` 时若带 `sessionId`，会先 `ctx.sessions.open(sessionId)`——
即"打开一个居民的档案 = 把该居民的最近活动置为当前上下文"。
中列（被页面位盖住）会跟着切，这正是我们想要的一致性。若该居民没有会话，
session 作用域条目自然渲染空，活动区显示"暂无活动"。

**代价与评审点**：上游包（ui-trajectory）硬编码下游槽名（`sponge.portal.resident.activity`）。
这是"上游知道下游"的耦合，dsh 里没有更好的跨包协商机制（不能导出值）。
替代方案是 Portal 自己写一个只读活动摘要、**完全不碰 ui-trajectory**：
成本低（~150 行）、零耦合，但与"活动部分嵌 ui-trajectory"的已定划分不符。
**列为待裁决项 D-P2**，本文按"改 ui-trajectory"展开。

### 3.5 结构浏览页（独创 / 只读）

**组件树**

```
StructureBrowser                    (chain: sponge.portal.main, select route.name==='structure')
├── StructureSourceBanner           ★ 显示 source.kind：directory / derived / stub（防假数据）
├── SliceTree                       renderSlot('sponge.portal.structure.tree')
│   └── SliceNode × N               { name, kind, latest?, domain }
│        └── 展开态走 route store 的 expandedSliceIds（跨重挂载保留 → 进 store 合法）
├── DependencyNotice                ★C 级：「依赖边待通道定义（06 P0-1 / 调研建议 02）」
│                                      当前仅绘制 parent 派生链
├── SceneList                       ★C 级：scenes/ 存在则只读列出，否则「无场景登记」
└── SnapshotLine                    renderSlot('sponge.portal.structure.snapshots')
     └── 版本快照序列（内容寻址 hash）——文案必须写「版本快照」而非「演化」
```

**数据**：`useContainer()`。树是 `slices` 数组的 `parent` 折叠（纯函数 `buildTree`）。
**`kind` 一律不解释**（base ignorance，02 §3.5 / impl SPEC §1）——不按 kind 分色、不翻译 kind，
只原样显示。这是 Sponge 的硬约束，不是 UI 偷懒。

### 3.6 作业 / 目标（按 §1.2.4 读法一）

**无新增代码**。ui-jobs（会话 header 按钮）与 ui-goal（composer 上方 goal 条）
以原生形态出现在对话页。Portal 不复制、不聚合、不做"全局作业页"。

---

## 4. 里程碑与验收（每步可点、可检验）

> 每一步的"可点验收行为"都写成**人能在浏览器里点出来的动作**，不是"代码写完了"。
> 门禁命令见 §6。

### M0 —— 决策落地（无代码）

| 出口 | 内容 |
|---|---|
| D-P1 | `shell.page` 提案通过（或裁定走 `shell.overlay` 备选） |
| D-P2 | 居民活动区：改 ui-trajectory（推荐）vs 自写只读摘要 |
| D-P3 | 作业 / 目标：读法一（无页面）vs 读法二（各改一处） |
| D-P4 | `packages/sponge/` 新组 vs 先落 `experimental/` |
| 记录 | 结论回填 `研发/06_开放问题与决策.md` 与本文 |

**验收**：四项有书面结论，本文 §2.5 / §3.4.4 / §1.2.4 / §2.1 相应锁定。

### M1 —— 骨架 + 入口（`dsh web` 出现 Portal 页）

**做**：包骨架（§2.2）、三注册面（§2.4）、`createPortalRouteStore`、`PortalShell` 空壳
（只有 nav + 空 main）、`PortalEntryButton`、ui-layout 的 `shell.page` 改动、字典注册。

**可点验收**：

1. `pnpm dsh web` 打开，侧栏底部出现「容器」按钮（宽态显示文字、窄态显示图标）；
2. 点击 → 主区被 Portal 页面位覆盖，出现容器内导航（容器 / 结构两个入口）+ 空白主区；
3. 再点一次（或点导航上的「返回对话」）→ 页面位消失，中列对话面原样露出；
4. 刷新页面 → 路由保持（store `persist` 生效）；
5. 把 `ui-sponge-portal` 行从 `cordis.patch.yml` 摘掉 → 入口按钮消失且**无报错**（证明位置槽的空代价为零）。

### M2 —— 容器首页只读（A 级派生数据全跑通）

**做**：`deriveSubjects()`、`createContainerSource` 的派生回退、首页四个区块、
`sponge.portal.home.residents` / `.changes` 两个 list 槽 + 默认行组件。

**可点验收**：

1. 首页显示居民数、运行中作业数、工作区数，与侧栏会话列表**数量一致**（人工核对 3 个数字）；
2. 「最近变化」按时间倒序，点一条 → 跳到该会话的对话页（语境侧栏随之更新）；
3. 「域状态」条显示 **「未分级（域粒度待裁决 · 06 P1-10）」**——**不是**"待进化"；
4. 页面顶部数据源徽标显示 **「派生（sessions + workspaces）」**；
5. 断网 / 服务端不可达时，首页显示"容器数据不可用"而不是空白或假数据。

### M3 —— 对话页复用 + 语境侧栏

**做**：`PortalContextAside`（`shell.overlay`）、`openConversation` 动作、
`sponge.portal.context` 面板。

**可点验收**：

1. 首页点某居民卡的「对话」→ Portal 关闭，中列打开该会话，**右侧出现语境浮层**；
2. 语境浮层显示：居民身份（agent preset）、所在工作区、域标签（未分级）、
   「查看档案」按钮、收起按钮；
3. 点「查看档案」→ 跳居民档案页（M4 前为占位），回退 → 回到该会话，语境浮层仍在；
4. 语境浮层**不吃点击穿透**：浮层之外照常可操作对话（层本身 click-through，条目自管指针事件）；
5. 切换会话 → 语境浮层内容跟随变化。

### M4 —— 居民档案 / 结构浏览（只读）

**M4a 居民档案**（不含活动区）：

1. 点居民卡「档案」→ 显示身份 / 住哪 / 拥有 / 权限四块；
2. 「权限」块显示 **「权限模型待定（调研建议 05）」**，**没有任何可点的假开关**；
3. 「拥有」列出该居民名下会话与作业，点会话 → 直达对话页。

**M4b 嵌 ui-trajectory**（D-P2 走推荐路径时）：

4. 活动区显示该居民的轨迹视图，与原生「轨迹」tab **交互一致**（时间轴、展开、时长切换）；
5. 该居民无会话时，活动区显示「暂无活动」而不是报错。

**M4c 结构浏览**：

6. 显示切片树（M5 前来自桩或已存在的 `slices/` 目录），节点显示 `kind` 原样字符串（不翻译、不上色）；
7. 「依赖」区显示 **「依赖边待通道定义（06 P0-1 / 调研建议 02）」**，只画 `parent` 派生链；
8. 快照线标题写 **「版本快照」**，不写「演化」；
9. 树展开态在页面间来回切换后保留（路由 store）。

### M5 —— 数据源决策落地

**做**：`packages/sponge/structure`（§2.3）+ Remote + `ContainerView` 真源、
`source.kind` 切到 `'directory'`、结构变更刷新（先轮询，事件转发作为后续）。

**可点验收**：

1. 在结构目录里增删一个切片文件 → 点「刷新」（或轮询周期到）→ 树**真的变了**；
2. 首页与结构页的数据源徽标变为 **「目录 <root>」**；
3. 服务未启用时（从 patch 摘掉该行）→ 自动退回派生视图，徽标变回「派生」，**UI 不报错**；
4. `pnpm dsh --profile web` 冷启动无新增 FAILED fiber（boot 是全绿才翻页的）。

---

## 5. 风险与依赖

### 5.1 slot 声明冲突（最高频）

| 风险 | 触发 | 缓解 |
|---|---|---|
| 声明了别人的槽 | Portal 声明 `sidebar.*` / `conversation.*` | §2.6 的白名单守规矩；load-time 硬错误会立刻暴露，不会静默 |
| `shell.page` 与未来 Editor 争位 | Editor 也想占主区 | **现在就定死**：`shell.page` 是 single，Editor 落地时**不占它**，而是作为 `sponge.portal.main` 的一个 chain 条目（零 owner 改动）。写进 ui-layout 的 `shell.page` JSDoc 与 Portal README |
| 同槽重复 `id` | 两个 register 用同一 `id` | 命名前缀统一 `sponge-portal-`；list 槽的 id 冲突是 load-time 错误 |
| store handle 跨 scope 复用 | 一个 handle 挂两个不同 scope 的槽 | Portal 的三处共享**全是 root scope**，安全；若将来把某页面改成 session scope，必须拆出独立 handle |
| 声明者未加载 | `ui-layout` 被摘掉 | 全部走 `slots.inject`，声明缺失时安静等待，不炸 |

### 5.2 bundle 注册面遗漏

三处（+ 两处文档）在 §2.4 已列，每处遗漏的**故障现象各不相同**，最容易漏的是
`web-app/package.json`——它的失败点是 **import 报错**（profile 启动走
`$DSH_HOME/profiles/node_modules` 回退解析裸名，没声明就解析不到），
而漏 `cordis.patch.yml` 是**静默不加载**。
→ **M1 的验收第 5 条专门测这个**（摘掉一行看是否静默），并写进包的 README「移除方式」。

### 5.3 10k 行预算（前端重资产）

07 八节明写"10k 行预算的压力主要在编辑器"。Portal 的估算：

| 区块 | 源码 | 测试 | 合计 |
|---|---|---|---|
| 骨架 / store / 数据源 / 派生 | ~350 | ~350 | ~700 |
| 容器首页 | ~250 | ~250 | ~500 |
| 居民档案 | ~300 | ~300 | ~600 |
| 结构浏览 | ~300 | ~300 | ~600 |
| 语境侧栏 + 入口 | ~150 | ~150 | ~300 |
| 契约 / 字典 / README | ~150 | — | ~150 |
| **Portal 合计** | **~1500** | **~1350** | **~2850** |
| ui-layout 改动 | ~12 | ~20 | ~32 |
| ui-trajectory 改动 | ~8 | ~20 | ~28 |
| `sponge/structure`（宿主） | ~400 | ~400 | ~800 |

**Portal 自身约占预算 28%**，Editor 仍留有 ~7k 行空间。
**红线**：Portal 源码超 2500 行即触发 §2.1 的拆包条件评审。

### 5.4 与 Sponge 核心实现的依赖顺序（重点，诚实标注）

| Portal 页面 / 区块 | 依赖的 Sponge 概念 | 核心现状 | 能不能先做 |
|---|---|---|---|
| 容器首页 · 居民概览 | 主体（02 §3.7，MVP 字段形式 owner+role） | **无**（`agentPreset` 是 harness 概念，不是主体） | ✅ 先做（派生，标注为派生） |
| 容器首页 · 最近变化 | 无 | — | ✅ 先做（A 级） |
| 容器首页 · 结构概览 | 切片 | `impl/src/base` 有模型，**不在 harness 内** | ⚠️ 结构登记格式一定（S1′）后才有意义 |
| 容器首页 / 居民档案 · **域状态** | 域（02 §3.8）+ **P1-10 粒度未裁决** | **无** | ❌ **不能先做**——只能显示"未分级"。**任何"待进化/确定"的显示都是编造** |
| 居民档案 · **权限** | 调研建议 05 的 authority 六字段 | **无** | ❌ **不能先做**——不画假开关 |
| 居民档案 · 住哪 / 拥有 / 活动 | 无（workspace / session / job） | — | ✅ 先做（A 级） |
| 结构浏览 · 切片树 | 切片（S1′ 落盘格式） | 模型有，落盘格式未定 | ⚠️ **依赖 S1′ 决策**——但决策一到即可做，不依赖调度器 |
| 结构浏览 · **依赖** | **通道**（06 P0-1，调研建议 02 才给候选） | **无** | ❌ **不能先做** |
| 结构浏览 · 场景 | 场景抽象类 | `impl/role/` 未开工 | ⚠️ 只读列出，不解释 |
| 结构浏览 · **快照线（演化语义）** | 演化（04 四节 / 调度器） | **无** | ⚠️ 只能做**版本快照**（`latest` hash 序列），文案不得升级为"演化" |
| 对话页 / 轨迹 / 作业 / 目标 | 无 | — | ✅ 先做（纯复用） |
| 表征应用城区 | 场景 + 调度器 | 无 | ❌ 本期不规划 |

**依赖顺序结论**：

```
立即可做 ────────────► 结构落盘格式决策后 ────────► Sponge 核心实现后
  对话页(复用)            容器首页·结构概览            域状态
  容器首页·居民/变化      结构浏览·切片树              权限
  居民档案·身份/住哪/     结构浏览·版本快照线           依赖边
    拥有/活动                                        场景语义
  轨迹/作业/目标                                     表征应用城区
```

**Portal 的最大外部依赖不是代码，是两个决策**：① S1′ 的结构落盘格式（调研建议 04）；
② 域粒度（06 P1-10）。**这两个不定，结构浏览与域状态就只能停在桩上。**

### 5.5 其他风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| **派生值被当成真值** | 最阴险的一条：居民由 `agentPreset` 派生，看久了会被当成"主体" | `ContainerView.source` 是契约的一部分，**每页必须显示数据源徽标**，M2/M5 验收各有一条专门测它 |
| 改 ui-layout 的评审成本 | 动了 harness 核心 UI 包 | 改动 ~12 行且纯位置语义；随包提一个 Agent Note（GUI note 先例） |
| 上游包写下游槽名 | ui-trajectory 硬编码 `sponge.portal.resident.activity` | 待裁决 D-P2；注释写明原因；退路是 Portal 自写只读摘要 |
| 快照测试影响 | 新增页面位会改变组装后的 DOM | 见 §6 的梯子；`DSH_SNAPSHOT=refresh` 只在确认是有意变更后用 |
| `slices/` 目录不存在时的空态 | 结构浏览页可能长期无数据 | 空态文案是**一等公民**（不是"加载中"），M4c 验收第 6 条覆盖 |
| 跨包类型漂移 | Portal `contract/views.ts` 与宿主 `types.ts` 不一致 | 用 `export type { … } from '@oasisailab/sponge-structure/types'` 重导，**禁止复制** |

---

## 6. 测试与门禁

### 6.1 每步的测试梯子（`packages/client/AGENTS.md` 的三级梯子）

| 阶段 | 命令 | 何时跑 |
|---|---|---|
| 内环（秒级，无浏览器无服务） | `pnpm run test:gui` | **每次 GUI 代码改动**，像 typecheck 一样自由跑 |
| 可见输出变化 | `DSH_SNAPSHOT=replay pnpm run test:web` | 动了 client 组件 / 文案 / `apps/web` / Vite / 连接层 —— **M1 的 ui-layout 改动、M2–M4 每个页面首秀、M5 的数据源切换都必须跑** |
| 提交前 | `dsh-pre-push-checks`（`.agents/skills/dsh-pre-push-checks/SKILL.md`） | 选本次 diff 对应的窄检查；**没有全仓 pre-push 聚合** |
| 结构 / 宿主包 | `pnpm run test` + `pnpm run test:coverage` | M5 落地时；`test:coverage` 才是 CI 的覆盖率门禁（`packages/*/*/src` 每文件 100%） |

规则：

- `DSH_SNAPSHOT=refresh` **只在确认输出变化是刻意的时候**用；`DSH_SNAPSHOT=record` 需要 key。
- `test:gui` 在**没碰过的代码上红了**——既不静默修也不忽略，写进交接说明，进下一个 PR 窗口的清理。
- 每个 tier 只断言自己那一层：数据层语义归 runtime/host 套件，组件 spec 只管呈现行为。

### 6.2 组件 spec 的写法（按 `packages/client/AGENTS.md`）

- 文件首行 `// @vitest-environment jsdom`（共享配置是 node-env）。
- 组件 spec **直接喂 props**：store 用 `createPortalRouteStore().create()`，
  框架 hook 用 plain stub；**不搭渲染机器**。
- 断言**用户可见行为**，不断言 class 名 / hook 内部 / 渲染次数。
- chain 条目的 `select` 是**纯函数**——单独单测（"路由不匹配返回 null"），
  不靠挂载组件来测拒绝路径（slot 标准：挂载再返回 null 会白跑 hooks 和 effect）。

### 6.3 新包 / 组件清单（`packages/client/AGENTS.md` 逐条对账）

**新包**（checklist 1–6）：

- [ ] `package.json`：`@oasisailab/sponge-client-ui-sponge-portal`；exports `.` / `./invariant` /
      `./client` / `./src/*` / `./package.json`；`dsh.client` manifest；`files` 覆盖每个相对运行时导入与产物
- [ ] `tsconfig.json`：extends `tsconfig.base.client.json`；每个 workspace 依赖一个 `references` 条目 +
      `runtime-diagnostics/invariants`
- [ ] `tsdown.config.ts`：`clientBundle(id, ['lib/types/index.js','lib/types/invariant.js'])`
- [ ] `src/index.ts`（空 node apply）、`src/invariant.ts`（**真实理由**，非生成占位）、
      `src/css-modules.d.ts`
- [ ] `README.md` 含 **Model Experience** 段（除非在 omission allowlist 上）+
      **Known Limitations and Deferred Work** 段
- [ ] 三注册面（§2.4）全部到位
- [ ] 注册进别人的槽一律用 `ctx.slots.inject`；多个贡献要原子装卸时返回 generator
- [ ] `pnpm --filter @oasisailab/sponge-client-ui-sponge-portal bundle` 后再探活（registry 供的是
      `lib/client.js`，不是源码）

**新组件**（checklist 1–6）：槽进 `SlotMap` + 父 entry 的 `children` + `register`；
props 是**四 shares 的交集**（不手写 share 已派生的成员）；
共享/存活状态进 `createXXXStore()`，组件私有状态留本地；
测试直接喂 props；**CSS 只用 token**；`test:gui` 绿。

### 6.4 仓库铁律（Portal 全程）

| 铁律 | 落到 Portal |
|---|---|
| 中文产品文案 / 英文代码注释 | 字典 `locales.ts` 的 `zh` 是产品文案，`en` 同步；代码注释全英文 |
| CSS 只用 `--dsw-*` token | 见 `docs/web-styling.md`；CSS Modules + `clsx`；**无字面颜色、无组件库、无 Tailwind** |
| 每文件 100% 覆盖 | 真不可达的防御分支写 `/* v8 ignore -- <真实理由> */`，**禁止裸 ignore** |
| 注册即效果 | 全部走 `ctx.effect()` / `ctx.on()`，无模块级副作用 |
| 非平凡改动需要 Agent Note | `shell.page`（改 ui-layout）、Portal 包落地、ui-trajectory 扩展注册面——**各一篇**，随 PR 交 |
| `hygiene` | `pnpm run hygiene`（含 `verify-client-packages`、`verify-cordis-config`、publint、knip） |
| 域图 | `scripts/verify-client-domain-graph.ts`：`contract/`=0、域目录=1、`apply`/`index`=2；**兄弟域之间禁止互导** |

---

## 附：本文引入的待裁决项（M0 裁决结果 · 2026-08-30）

| # | 裁决项 | 结果 | 依据（研发/06） |
|---|---|---|---|
| **D-P1** | `shell.page`（改 ui-layout ~12 行）vs `shell.overlay` | **批准 `shell.page`** | D-O 借壳边界：壳可最小改动 |
| **D-P2** | 改 ui-trajectory vs Portal 自写只读活动摘要 | **自写摘要**（§3.4.4 按自写版执行；轨迹嵌入降级为后置备选） | D-P 战术决定：零耦合、避免"打开档案=切会话"副作用 |
| **D-P3** | 作业 / 目标：读法一 vs 读法二 | **读法一**（保持原生 chrome） | D-P |
| **D-P4** | `packages/sponge/` 新组 vs `experimental/` | **experimental/ 占位** | D-N 核心独立仓：harness 仓内不开 Sponge 新组 |

> 已回填 `研发/06_开放问题与决策.md`（D-N / D-O / D-P，2026-08-30）。
> **M0 出口达成**——四项有书面结论，可进入 M1（骨架 + 入口）。

---

## 附：本文引用清单

**论述**：`研发/00_总论与野心.md` · `研发/02_概念与抽象类.md`（§3.7 主体 / §3.8 抽象类 vs 域 / §3.9 信息空间）
· `研发/05_落地规划与里程碑.md` · `研发/06_开放问题与决策.md`（D-L / D-J / D-M / P0-1 / P1-10）
· `研发/07_编辑器规划.md` · `研发/impl/{PLAN,SPEC,README}.md` · `研发/impl/src/base/slice.ts`
· `研发/Sponge调研_技术x行业x愿景_2026-08.html`（建议 02 / 04 / 05）

**harness**：`packages/client/AGENTS.md` · `packages/AGENTS.md` · `packages/README.md` ·
`packages/client/README.md` ·
`.agents/notes/implemented/architecture/2026-07-22-slot-type-chain-implementation.md` ·
`.agents/notes/implemented/architecture/2026-07-19-gui-web-client-architecture.md`

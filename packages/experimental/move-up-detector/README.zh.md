# @oasisailab/sponge-experimental-move-up-detector

[English](README.md) | 中文

Move Up 概念的 shadow 模式观察插件：它读取会话日志、通过已注册的 Detector 判断候选语义单元，并把每次判断保留下来，供开发者检视与比较不同判断方法。它不创建、不修改、不删除任何空间对象，也不向会话日志追加任何事件。

这个插件的价值在实验台，不在 Detector。两个内置 Detector 都不实现任何判断，因此默认部署会为每个候选记录一个显式的 `stay`；真正有价值的是：换一个实现、或换一个配置选择，都不需要改动其他包。

## 配置

```yaml
- id: move-up-detector
  name: '@oasisailab/sponge-experimental-move-up-detector'
  config:
    detectors: [stub]
    contextWindow: 20
    recentLimit: 50
```

- `detectors` —— 每个语义单元要运行的已注册 Detector id，按顺序执行。该列表必须至少命名一个 Detector，且不得重复 id。
- `contextWindow` —— 单次判断可获得的最近会话事件上限。
- `recentLimit` —— 内存中保留的观测记录上限。

没有任何随包发布的 profile 装载本包，因此只有显式装载才会改变行为。

## 它观察什么

插件订阅既有的 `session/event` 供源，不新造消息总线。V0 切分器把至多一条会话消息变成一个语义单元，并原样透传文本；以下排除规则是行为而非实现细节：

- 只有当 `source.kind === 'user'` 时，`user/message` 事件才算对话内容。合成注入的上下文——文件变更通告、AGENTS.md、skill 内容、goal 续轮——同样使用 user 角色，但它们属于系统管道，不产生语义单元。
- assistant 文本也算对话内容，因此由 agent 先提出的假设与由用户提出的假设同样具备资格。
- 其余任何事件类型都不产生语义单元。

切分是 seam，不是服务：`V0_SEMANTIC_CHUNKER` 是唯一导出的实现，未来的切分器只需替换本包内的绑定，不必改动 Detector 边界。

## Detector 边界

Detector 是一个很小的可替换对象：

```ts
interface MoveUpDetector {
  readonly id: MoveUpDetectorId
  detect(chunk: SemanticChunk, context: MoveUpDetectorContext): MoveUpDetectorResult | Promise<MoveUpDetectorResult>
}
```

`MoveUpDetectorResult.decision` 取 `'stay' | 'move-up' | 'ask'`。`existingObject` 命名一个已存在的空间对象，表示该语义单元应当更新它而不是新建。`confidence` 是可选的，因为实现可以不估计置信度。

任意插件都可以注册实现：

```ts
const provider = await ctx.plugin({
  inject: ['moveUpDetector'],
  apply(providerCtx) {
    providerCtx.moveUpDetector.registerDetector(myDetector)
  },
})
```

注册由调用方 fiber 持有：卸载该 fiber 即移除注册。`registerDetector` 在 id 为空或已注册时抛错，返回的 disposer 只移除自己的那次注册。`ctx.moveUpDetector` 还暴露 `detectors()`、`recent()` 与 `observe(chunk, context?)`，因此手动判断与实时对话判断走同一条路径。

各 Detector 之间彼此隔离。抛错或被拒绝的 Detector 自己不产生观测记录并写入一条警告，而配置在它旁边的 Detector 照常运行——坏实现无法掩盖被它比较的那个实现的行为。

## 实验台

`runDetectorHarness(subject, entries?)` 把固定的 [`MOVE_UP_CORPUS`](src/corpus.ts) 喂给运行时，并按条目返回报告；`formatHarnessReport(reports)` 负责渲染。语料就是实验的输入：真实 Detector 应当能区分的对话形态，既包含看起来重要、但应当留在对话里的样例，也包含可能属于某个已存在对象的样例。

运行测试套件，它同时就是实验台的入口：

```sh
pnpm vitest run packages/experimental/move-up-detector
```

## 生命周期

dispose 会移除 `session/event` 监听器、清空保留的观测记录并注销服务；已经在途的判断会正常结束但不记录。`tests/plugin.spec.ts` 逐条钉住这些行为，`tests/loader-composition.spec.ts` 则通过 Loader 启动真实的 `cordis.yml`，证明配置确实选择了实现、卸载确实恢复了装载前状态。

## Model Experience

None, as the shadow-mode observer registers no prompt, tool schema, or session event and writes nothing back into the model request.

#### KV Cache effect

None; the plugin never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **尚不存在 Move Up 判断** —— 两个内置 Detector 都是刻意惰性的（`stub` 恒为 stay，`human-review` 恒为 ask）。当前的实验是选择 Detector，而不是编写 Detector。
- **只有 shadow 模式** —— 不创建、不更新、不 resolve。`existingObject` 可以在结果里表达 `Create`／`Update`，而插件对二者都不执行动作。
- **空间上下文恒为空** —— `MoveUpDetectorContext.spaceObjects` 是更新目标的边界，而 Sponge 目前还没有可读取的空间运行时，因此 Detector 必须把空列表理解为「存在性未知」，绝不能当作「什么都不存在」的证据。
- **切分器不可替换** —— V0 在本包内绑定 `V0_SEMANTIC_CHUNKER`。消息粒度是真正语义切分方案的占位，而后者的缺失正是概念记录里的第一个开放问题。
- **没有 UI 与实时界面** —— 检视手段是 `ctx.moveUpDetector.recent()` 与实验台报告。观测记录不持久，进程结束即消失，也没有客户端或 Remote 界面暴露它。
- **不变式检查的是保留状态，而非那次追加** —— 伴生插件在装载时与每次派发的会话事件上重新校验保留的观测记录。在最后一个会话事件之后由直接调用 `observe()` 产生的观测记录，会在下一个事件处才被校验，而不是在它自己的提交点。

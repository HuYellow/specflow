---
title: SpecFlow 软件工程 Harness 实施方案
subtitle: 工程控制层 + Maka Runtime Host · 流程组合 · 产物协作 · 阶段模型选择
template: doc
theme: shadcn
lang: zh
date: 2026-10-12
version: 0.1
status: 本地 MVP 已落地，真实供应商验收待连接配置
---

SpecFlow 管理软件工程流程、质量门禁和产物。
Maka Runtime Host 承担模型与工具执行。
本地工作台和 Maka 协议接入已实现。真实供应商连接按用户要求后续补齐。

## A 产品目标、范围与架构决策

### A.1 产品定位

面向个人和小团队，围绕本地 Git 仓库组织 AI 软件开发。
开发者组合步骤，选择各阶段的 API 和模型，并共同审阅产物。

Spec Kit 与 speckit-codex-flow 提供方法启发。
应用自行定义工程阶段、产物格式与验收规则。
这些方法通过应用机制实现，不要求用户安装对应 skill。

本方案采用已有执行底座，产品的工程规则与流程仍保持独立。

### A.2 本版确定的设计方向

| 决策 | 本版方案 | 原因 |
| --- | --- | --- |
| 产品形态 | 本地 Web 工作台 + 本地工程服务 | 便于验证独立产品与执行边界 |
| 执行底座 | 以 Maka Runtime Host 为首个接入目标 | 复用 Agent 循环、工具、事件和恢复 |
| 接入方式 | 独立控制台 + 薄适配器 | 工程模块通过明确接口访问底座 |
| 模型选择 | 每个阶段或任务独立解析连接与模型 | 配置可替换，运行身份可追踪 |
| 上下文交接 | 使用固定版本的产物与代码基线 | 减少跨模型历史迁移的依赖 |
| 数据归属 | 工程状态归 SpecFlow，执行事实归 Maka | 两层各自维护明确的事实来源 |
| 首版流程 | 可组合的串行步骤 | 先验证完整工程链，再扩展控制流 |
| 文档存储 | Markdown 在仓库，工程元数据在本机 | 文档可编辑、可版本管理 |

Maka 作为计划中的执行底座，须先通过 P0。
P0 未通过时，暂停后续接入依赖，记录阻塞项。
不将“源码存在接口”视为“实际链路已验证”。

### A.3 产品需求与首版交付

| 编号 | 需求 | MVP 交付 |
| --- | --- | --- |
| R01 | 自由组合工程步骤 | 增删、替换、重排串行节点并校验输入 |
| R02 | 共同管理文档产物 | 编辑、评论、差异、负责人和接纳记录 |
| R03 | 自由组合 API 与模型 | 项目、流程、节点三级配置与新尝试 |
| R04 | 执行真实代码开发 | 派发代码任务，取得补丁和工具记录 |
| R05 | 门禁与独立复核 | 检查证据、处理发现、人工接纳 |
| R06 | 需求变更后的影响追踪 | 按产物版本标记下游结果过期 |
| R07 | 中断恢复与可追踪运行 | 保存执行身份，重连核对原运行 |
| R08 | 本地与异步协作 | Git 产物交换、评论和复核记录 |

MVP 交付一套规格驱动模板，并允许从已有文档开始。
多人实时编辑、远程执行和复杂流程分支进入后续版本。

MVP 的执行范围是仓库修改与本地验证。
代码集成到工作项分支需要用户接纳。
合并主分支、推送和部署由用户另行触发。

## B 系统架构、模块与数据归属

### B.1 运行拓扑

```flow TB
可视化工作台 -> 本地工程服务
本地工程服务 -> 工程流程引擎
工程流程引擎 -> 上下文与产物管理
工程流程引擎 -> Maka适配器
Maka适配器 -> Maka Runtime Host
Maka Runtime Host -> 模型与Agent工具循环
模型与Agent工具循环 -> 候选工作空间
工程流程引擎 -> 确定性验证器
确定性验证器 -> 候选工作空间
本地工程服务 -> 工程状态库
Maka Runtime Host -> 执行事件存储
```

本地工程服务监听回环地址。
工作台通过本地 API 和事件订阅访问工程状态。
与 Maka 的协议和权限交互集中在适配器内。

Maka Host 保持自身执行状态的写入权威。
SpecFlow 使用公开接口，不直接修改 Maka 的数据库。

### B.2 模块边界

| 模块 | 职责 | 主要输出 |
| --- | --- | --- |
| ProjectService | 仓库发现、工程规则、工作项和基线 | Project、WorkItem |
| WorkflowCompiler | 校验节点顺序、输入引用和必需门禁 | 固定版本的可执行定义 |
| WorkflowEngine | 就绪判断、阶段推进、暂停和修订 | NodeRun、状态事件 |
| TaskScheduler | 实现节点内的任务依赖与串行派发 | TaskRun、任务结果 |
| ContextAssembler | 装配规则、产物、代码和复核发现 | ContextManifest |
| ArtifactService | 候选产物、版本、差异和接纳 | ArtifactRevision、Decision |
| GateEvaluator | 执行结构、证据和接纳检查 | GateResult、阻塞原因 |
| VerificationRunner | 执行项目配置的验证命令 | VerificationEvidence |
| ExecutionBackend | 统一执行底座接口 | 运行身份与规范化状态 |
| MakaBackend | Host 连接、会话、执行和交互适配 | Maka 身份与事件引用 |

VerificationRunner 是工程验收专用模块。
它运行固定命令清单，记录退出码和代码版本。
模型执行中的测试活动另作工具事实保存。

P0 若确认 Host 有适合的确定性验证通道，可以复用该通道。
否则使用本地受控进程执行器，并限制其职责为工程验证。
这一选择记录为 P0 的交付决策。

### B.3 数据和凭据归属

| 数据 | 所有者 | SpecFlow 的访问方式 |
| --- | --- | --- |
| 模型连接、模型目录、供应商凭据 | Maka Host | 查询可用目标，保存身份引用 |
| 模型消息、工具结果、执行终止事实 | Maka Host | 订阅、查询和按引用读取 |
| 流程、门禁、任务与接纳决策 | SpecFlow | 工程数据库与版本化定义 |
| 文档和代码 | Git 工作空间 | 版本快照、候选差异和接纳 |
| 验证命令及确定性验证报告 | 工程配置与验证器 | 版本化命令、报告和结果记录 |

SpecFlow 不复制供应商密钥到流程文件。
Maka 当前凭据存储方式由其实现决定。
本方案不将其描述为已经采用操作系统密钥链。

### B.4 建议技术栈与代码组织

界面采用 React 与 TypeScript，工程服务采用 Node.js 24 系列。
工程状态使用 SQLite，流程定义使用 YAML，产物保留 Markdown。
具体依赖版本在 P0 通过后固定。

Maka 内部包标记为 private。
适配器使用经验证的 Host 客户端或协议边界。
不假设存在可直接安装的稳定 Runtime SDK。

```tree list
specflow/
  apps/
    web/ | 流程、产物、任务和运行界面
    server/ | 本地 API、调度和数据库
  packages/
    domain/ | 流程、任务、产物与门禁契约
    workflow-engine/ | 编译、调度和状态转换
    execution-contract/ | 执行底座接口
    maka-adapter/ | Host 协议与交互适配
    artifact-service/ | 快照、差异和接纳
    verification-runner/ | 确定性工程验证
  templates/
    spec-driven/ | 默认工程流程与阶段指令
  docs/
    brainstorm/ | 方案和底座评估
```

本地 MVP 已实现对应职责。首版工作流、任务和门禁集中在 apps/server/src/service.ts，产物管理位于 artifacts.ts；后续可按该结构拆分包。

## C 流程定义、任务执行与状态机

### C.1 首版节点类型

| 类型 | 作用 | 是否使用模型 |
| --- | --- | --- |
| agent | 仓库分析、规格、设计、拆任务和实现 | 使用阶段模型 |
| review | 独立检查产物，输出结构化发现 | 使用复核模型和独立上下文 |
| verify | 运行预配置的构建、测试或检查 | 无需模型决定命令 |
| gate | 检查输入、证据与接纳条件 | 执行确定性规则 |
| human | 等待澄清、编辑或接纳 | 保存人工决策 |

MVP 按节点序列执行，并维护产物依赖图。
产物依赖图允许多个输入来源，但不能形成环。
条件分支、并行 Join 和自动修订回路进入后续版本。

模板可要求独立复核和必需验证。
用户自由组合步骤时，编译器提示缺少的工程条件。
硬门禁在工程服务执行，阶段提示词表达执行目标。

### C.2 默认规格驱动模板

| 工程阶段 | 输入 | 输出 | 放行条件 |
| --- | --- | --- | --- |
| 仓库分析与需求规格 | 项目规则、需求、仓库基线 | spec.md、未决问题 | 内容完整，必要澄清已解决 |
| 工程设计 | 已接纳规格、代码基线 | plan.md、设计决策 | 复核发现已处理，用户接纳 |
| 任务拆解 | 已接纳规格与设计 | tasks.md、任务清单 | 任务有 ID、依赖与验收条件 |
| 代码实现 | 就绪任务、相关设计与代码 | 候选补丁、实现说明 | 对应任务验证与复核通过 |
| 验证与收敛 | 候选代码、规格和任务 | 验证证据、对齐报告 | 必需检查通过，产物版本一致 |
| 接纳代码 | 已复核候选与基线 | 工作项分支的新检查点 | 用户确认，基线未变化 |

默认模板在各 AI 阶段产出后执行独立复核。
规格和设计等待人工接纳。
实现阶段按任务串行执行，最终代码等待人工接纳。

已有 Markdown 可以导入为候选输入。
通过结构检查与接纳后，流程可以从所需阶段开始。

### C.3 流程配置示例

以下是 P0 的三个阶段配置草案。
完整 MVP 模板会加入设计、任务和收敛阶段。

```yaml title="流程配置草案，尚未实现"
schemaVersion: 1
id: feature-probe
revision: 1
nodes:
  - id: specify
    type: agent
    role: analyst
    promptRef: prompts/specify.md
    inputs: [request, project-rules]
    outputs: [spec]
  - id: implement
    type: agent
    role: developer
    promptRef: prompts/implement.md
    inputs: [spec@accepted, code-base]
    outputs: [code-candidate]
  - id: review
    type: review
    role: reviewer
    inputs: [spec@accepted, code-candidate]
    outputs: [review-report]
policies:
  finalAcceptance: human
  requiredVerification: [test]
```

输出类型、文件要求和门禁规则由模板的产物契约定义。
上述引用是应用配置格式，不是 Maka 协议字段。
启动流程时校验模板、指令和角色引用是否有效。

### C.4 阶段状态与完成语义

```flow TB
待执行 -> 就绪: 输入和执行配置可用
就绪 -> 启动中: 保存执行意图
启动中 -> 执行中: 核对底座身份
执行中 -> 等待交互: 底座请求用户回答
等待交互 -> 执行中: 回答已被底座接收
执行中 -> 工程检查: 收到确定的终止事实
工程检查 -> 待接纳: 门禁与复核通过
待接纳 -> 已通过: 接纳对应版本
执行中 --> 待核对: 断线或提交结果不明
待核对 -> 执行中: 核对原身份
工程检查 --> 阻塞: 缺少产物或证据
```

底座返回 completed，表示模型执行已经结束。
阶段仍需经过产物检查、验证、复核和接纳。

运行状态、产物接纳状态和依赖新鲜度分别记录。
执行失败、工程阻塞与产物过期也分别展示。

| 情况 | 状态处理 | 后续动作 |
| --- | --- | --- |
| API 或工具执行失败 | execution = failed | 保存结果，允许创建新尝试 |
| 未解决复核发现 | gate = blocked | 处理发现后重新检查 |
| 人工未接纳 | acceptance = pending | 等待明确决策 |
| 上游产物更新 | freshness = stale | 禁止放行，选择重检或重跑 |
| 执行提交结果不明 | execution = reconciling | 查询原身份，不盲目重发 |
| 用户请求停止 | 记录停止意图 | 等待底座确认终止 |

### C.5 任务调度与修订

任务具有稳定 ID、依赖、范围和完成条件。
任务清单接纳后，TaskScheduler 按依赖串行派发。
每个 TaskRun 使用独立会话和固定输入清单。

任务补丁通过验证与复核后，形成候选分支检查点。
后续任务使用该检查点作为基线。
这些检查点仍属于候选改动，最终接纳后才进入工作项分支。

失败尝试的补丁和工具记录保留用于诊断。
重试基于明确的检查点创建新尝试。
模型更换也创建新尝试，不覆盖原记录。

首版由用户触发修订和重跑。
后续自动修订策略需声明最大尝试次数、时间和预算。

### C.6 门禁规则

| 门禁 | 确定性检查 | 语义检查与决策 |
| --- | --- | --- |
| 输入门禁 | 必需版本存在，输入哈希一致 | 是否存在未解决的需求问题 |
| 产物门禁 | 文件、任务 ID 和必需字段完整 | 独立复核对应内容 |
| 实现门禁 | 任务就绪，工作空间和配置可用 | 设计决策是否足以执行任务 |
| 验证门禁 | 必需命令成功，证据对应候选代码 | 用例是否覆盖验收目标 |
| 接纳门禁 | 基线一致，无阻塞发现，证据未过期 | 用户接纳该版本 |

语义检查输出可定位的发现，并标记严重程度。
发现处理必须绑定复核目标与后续证据。
项目可允许带理由接纳部分警告，并保存决策。
必需验证失败和执行结果不明时，保持阻塞。

## D Maka 适配、阶段模型与恢复协议

### D.1 执行底座契约

ExecutionBackend 隔离 Maka 的协议和版本差异。
工程引擎仅使用应用契约，不读取底座内部对象。

```ts title="执行底座接口草案，尚未实现"
interface ExecutionBackend {
  inspect(): Promise<BackendCapabilities>;
  listTargets(): Promise<ModelTarget[]>;
  prepare(input: AttemptInput): Promise<ExecutionRef>;
  start(ref: ExecutionRef, input: FrozenInput): Promise<StartReceipt>;
  observe(ref: ExecutionRef, cursor?: string): AsyncIterable<ExecutionUpdate>;
  query(ref: ExecutionRef): Promise<ExecutionSnapshot>;
  answer(ref: ExecutionRef, input: InteractionAnswer): Promise<AnswerReceipt>;
  stop(ref: ExecutionRef): Promise<StopReceipt>;
  planResume(ref: ExecutionRef): Promise<ResumePlan>;
  resume(plan: ResumePlan): Promise<ExecutionRef>;
  readResult(ref: ExecutionRef): Promise<ExecutionResult>;
}
```

ExecutionRef 保存 backend、rootId、sessionId、turnId 和 runId。
创建前尚不存在的身份保持为空，并随确认结果补齐。
这些身份通过 ExecutionBinding 关联阶段 Attempt。
恢复产生新的 Turn 或 Run 时，追加身份绑定并保留原关联。

start 返回的是启动回执，不是工程验收结果。
observe 可以返回暂态进度；query 用于核对确定状态。
最终放行以底座确认的终止事实和工程证据为准。

### D.2 已在源码中找到的接入点

| 应用操作 | Maka 接入点 | 当前证据 |
| --- | --- | --- |
| 查询连接与模型目标 | connection.catalog.query | 已阅读协议，待 P0 调用 |
| 创建阶段会话 | session.create + modelTarget | 已阅读协议，待真实连接验证 |
| 启动阶段执行 | turn.start | 已阅读协议，待 P0 验证 |
| 查询执行状态 | turn.query | 已阅读终止状态与事件引用 |
| 观察运行 | openSessionSubscription | 已阅读 Client 接口 |
| 回答底座交互 | interaction.query / answer | 已阅读协议，待完整交互验证 |
| 停止与恢复 | turn.stop、turn.resume.query / start | 已阅读协议，待故障场景验证 |

这里使用的是 Maka 源码里的接口名称。
并未将它们假设为 REST 路由，也未验证发布包中的兼容性。

### D.3 模型配置与覆盖规则

解析顺序为：节点覆盖 → 流程角色 → 项目默认。
角色声明执行目标、指令、输出要求和所需能力。
模型目标引用 Host 的连接身份与模型标识。

创建会话时，适配器传入显式 modelTarget。
运行前保存最终解析结果与配置哈希。
每个阶段尝试都能查看实际目标与模型用量。

| 场景 | 本版行为 |
| --- | --- |
| 规格和实现使用不同 API | 两个阶段分别创建会话并选择连接 |
| 同一角色更换模型 | 使用相同输入版本创建新尝试 |
| 修改流程中的模型配置 | 影响新运行，已启动尝试继续使用原配置 |
| 连接被删除或模型不可用 | 阻塞启动，并显示配置原因 |
| 模型能力不满足节点 | 编译或启动检查失败 |

首版关闭自动备用模型。
用户手动切换后，保留旧结果和费用记录。
后续备用策略需验证能力、权限、上下文和预算匹配。

连接配置和凭据通过 Maka 管理。
SpecFlow 的模型选择界面展示 Host 的已配置目标。
首版不新增一套供应商适配与登录实现。

### D.4 阶段输入与上下文

FrozenInput 包括以下内容：

- 工程规则、阶段指令和模板版本。
- 已接纳输入的 ArtifactRevision 与内容哈希。
- 代码基线、选定文件及上下文清单。
- 对应任务、未决问题和复核发现。
- 输出路径、产物契约与运行限制。

Maka 创建接口没有任意 system prompt 或工具白名单字段。
阶段指令可通过输入内容表达。
细粒度工具和目录限制须在 P0 验证，必要时采用小型 Host 扩展。
权限或隔离能力不足时，相关节点不能静默降级运行。

### D.5 正常运行时序

```sequence num
participants: 工作台, 工程服务, Maka Host
工作台 -> 工程服务: 运行节点
工程服务 -> 工程服务: 检查门禁并保存启动意图
工程服务 -> Maka Host: 创建显式模型目标的会话
Maka Host --> 工程服务: 确认会话身份
工程服务 -> Maka Host: 启动 Turn 并订阅状态
Maka Host --> 工程服务: 工具进度或待处理交互
工程服务 --> 工作台: 更新运行视图
Maka Host --> 工程服务: 终止状态与事件引用
工程服务 -> 工程服务: 核对产物并执行工程验收
工程服务 --> 工作台: 放行或展示阻塞原因
```

### D.6 中断、重试与预算

派发前，工程服务持久化 Attempt 和启动意图。
客户端启动请求也带有幂等键和工程状态版本。

断线后使用同一个 rootId、sessionId 和 turnId 查询。
只有底座明确证明未提交，才允许重试相同派发。
结果不明时保留 reconciling，避免重复执行写入任务。

恢复调用先取得 ResumePlan，再检查基线和输入版本。
核对工作空间时，也考虑原执行已确认的文件修改。
无法区分工具写入与外部编辑时，保持待核对状态。
底座可能拒绝恢复，此时展示原因并允许创建新尝试。
换模型重试与恢复原运行使用不同动作。

阶段交互使用底座的 interactionId 和正式回答通道。
用户回答被确认后，才继续显示执行状态。
产物接纳是 SpecFlow 的决策，不冒充底座权限回答。

maxSteps 使用已验证的底座能力约束工具步数。
时间上限触发停止请求，并等待终止确认。
费用预算按实际用量检查，阻止后续派发。
正在处理的请求可能超出估算，费用上限属于尽力约束。

## E 文档、代码、协作与工程数据模型

### E.1 文档产物协议

| 类型 | 文件示例 | 内容要求 |
| --- | --- | --- |
| project-rules | rules.md | 工程规范、验证命令、复核要求 |
| spec | spec.md | 需求 ID、用户行为、约束、验收标准 |
| plan | plan.md | 设计决策、接口、模块、风险 |
| tasks | tasks.md | 任务 ID、依赖、范围和完成条件 |
| review | review.md | 发现、位置、严重程度和建议 |
| verification | verification.json | 命令、退出码、代码版本和报告 |
| convergence | convergence.md | 需求、任务、实现与证据的对齐情况 |

阶段输出文件与产物清单共同接受检查。
产物清单记录类型、路径和输入引用。
路径相对候选工作空间解析，并检查实际文件。
缺少清单或必需文件时，保持工程阻塞。

需求到代码的关联可由模型建议。
关联记录的存在本身不构成已覆盖验收的证明。

### E.2 编辑、复核与接纳

编辑文档生成新版本，并保留旧版本。
评论绑定 ArtifactRevision 与段落位置。
段落改变后，旧评论保留并提示定位可能失效。

候选产物先保存为不可变快照。
接纳记录绑定内容哈希、复核结果、操作者与理由。
部分接纳会形成一个新的完整版本，再重新检查门禁。

多个进程修改文档时，使用 expectedRevision 和内容哈希检查。
冲突响应返回当前版本与候选差异。
不允许用旧版本直接覆盖当前内容。

人工接纳和文件写入使用持久化操作日志。
先保存意图与基线，再原子替换文件，最后提交接纳记录。
崩溃恢复根据目标哈希核对已完成的动作。
文件系统写入与 SQLite 提交不假设为同一个事务。

### E.3 上游变更后的失效传播

InputBinding 记录每次尝试消费的产物版本。
上游版本更新后，沿依赖关系标记下游结果 stale。

已运行步骤的输入不会被原地替换。
其结果可以继续保留，但不能作为新版本的已验收结果。
用户选择重检或创建新尝试，再恢复后续推进。

修改流程定义创建 WorkflowRevision。
WorkflowRun 固定自己的流程版本与工程规则版本。
首版对变更后的流程创建新运行，并复用明确接纳的输入。

### E.4 Git 工作空间与代码接纳

| 对象 | 工作空间策略 |
| --- | --- |
| Project | 用户的源仓库，记录已选择的 Git 基线 |
| WorkItem | 独立工作项分支与工作空间 |
| CodeCandidate | 基于检查点的候选分支与 worktree |
| TaskRun | 首版串行使用候选工作空间，记录自己的基线 |
| ReviewRun | 读取固定候选版本，要求只读边界 |

首版采用干净、已提交的基线。
发现用户未提交改动时，阻塞准备并说明如何选择基线。
应用不自动重置、提交或删除用户现有改动。

任务间的候选检查点用于继续开发和故障定位。
最终代码接纳前，再次核对基线、复核目标与测试证据。
集成到工作项分支时，记录 Git 操作与结果身份。
出现冲突则保留候选，等待人工处理。

测试证据绑定实际代码内容哈希与环境清单。
验证前后内容改变，证据立即标记为过期。
旧测试成功不能放行新的补丁。

只读复核和工作空间隔离属于 P0 必验能力。
可用的插件或策略扩展需保持在适配器边界内。

### E.5 核心实体

| 实体 | 核心字段 | 用途 |
| --- | --- | --- |
| Project | id、rootPath、rulesRevision、backendProfile | 仓库和工程配置 |
| WorkItem | id、projectId、kind、baseCommit、acceptedCommit | 功能、缺陷或重构 |
| WorkflowRevision | id、schemaVersion、definitionHash、promptRefs | 固定流程定义 |
| WorkflowRun | id、workItemId、workflowRevisionId、status | 一次工程流程运行 |
| NodeRun | id、workflowRunId、nodeId、status、gateStatus | 阶段实例 |
| TaskRun | id、nodeRunId、taskId、dependencyRefs、status | 实现任务实例 |
| Attempt | id、ownerType、ownerId、number、inputHash、target | 一次模型执行尝试 |
| ExecutionBinding | id、attemptId、executionRef、parentBindingId、kind | 初始执行与恢复身份 |
| ContextManifest | id、rulesHash、artifactRefs、codeHash、promptHash | 已装配的输入清单 |
| ArtifactRevision | id、logicalId、type、contentHash、originAttemptId | 不可变产物版本 |
| InputBinding | consumerId、artifactRevisionId、codeBaseline | 失效传播依据 |
| Finding | id、targetRevisionId、location、severity、status | 可追踪复核发现 |
| Decision | id、targetHash、actor、kind、reason | 接纳与例外决策 |
| VerificationEvidence | id、targetHash、commandRef、exitCode、reportRefs | 确定性验证证据 |
| Comment | id、artifactRevisionId、anchor、author、body | 协作评论 |
| EngineeringEvent | seq、entityId、kind、revision、backendRef | 可重建的界面投影 |

执行消息和工具结果按 Maka 引用读取。
SpecFlow 可以缓存展示数据，但缓存不承担执行事实权威。

### E.6 本地文件布局与协作边界

```tree list
项目仓库/
  .specflow/
    project.yaml | 工程规则、验证命令和后端引用
    workflows/ | 可导出的流程定义
    prompts/ | 阶段指令与版本
    work-items/
      工作项ID/
        spec.md
        plan.md
        tasks.md
        convergence.md
本机应用数据/
  engineering.sqlite | 状态、评论、决策和引用
  snapshots/ | 不可变文档与候选报告
  operations/ | 文件和Git操作日志
Maka状态目录/ | 由 Maka 管理，SpecFlow 通过接口访问
```

凭据和实际运行身份不写入仓库共享配置。
异步协作通过 Git 产物和评论、决策导入导出实现。
导入评论保留作者信息，导入接纳记录不能自动放行。
接纳有效性必须重新核对目标版本和本机工程规则。

首版操作者身份属于本地标识，不提供团队认证。
实时多人编辑和远程权限管理进入后续版本。

## F 工作台界面、本地 API 与操作语义

### F.1 主界面

| 区域 | 内容 | 主要动作 |
| --- | --- | --- |
| 左侧导航 | 项目、工作项、产物、历史运行 | 打开仓库，创建或切换工作项 |
| 流程视图 | 步骤列表、依赖、状态和门禁 | 增删重排、校验、运行节点 |
| 任务视图 | 任务 ID、依赖、候选和发现 | 查看任务、触发新尝试 |
| 产物视图 | Markdown、差异、评论和版本 | 编辑、比较、复核、接纳 |
| 代码与验证 | 补丁、命令结果和复核位置 | 检查候选、处理问题、接纳代码 |
| 运行视图 | 模型目标、工具进度、交互和费用 | 回答交互、停止、恢复、核对 |
| 右侧检查器 | 输入版本、指令、模型与策略 | 查看上下文，修改下一次配置 |

MVP 优先步骤列表和产物差异界面。
画布编辑器随后复用同一份 WorkflowRevision。
模型配置显示最终解析值，并说明它来自哪个层级。

底座权限询问与工程产物接纳采用不同提示和记录。
运行中需要用户回答时，将对应工作项标为等待交互。

### F.2 核心操作

| 动作 | 语义 |
| --- | --- |
| 运行节点 | 使用就绪输入创建新的 Attempt |
| 继续流程 | 仅派发门禁已通过的后续节点 |
| 换模型重试 | 保持选定输入，创建新的执行身份 |
| 恢复原执行 | 核对原身份，使用已确认 ResumePlan |
| 停止 | 提交停止意图并等待底座确认 |
| 接纳产物 | 确认目标哈希对应的决策并核对基线 |
| 重检 | 使用当前版本重新检查规则或证据 |

前端禁用重复启动不能替代服务端幂等检查。
所有修改命令使用请求幂等键和工程版本条件。

### F.3 本地应用 API 草案

以下路由属于 SpecFlow，不是 Maka 的公开路由。

| 方法与路径 | 用途 | 关键条件 |
| --- | --- | --- |
| POST /api/projects | 注册本地仓库 | 检查 Git 根路径 |
| GET /api/backend/targets | 查询可用连接与模型 | 返回底座能力和可用状态 |
| POST /api/work-items | 创建工程工作项 | 选择已确认基线 |
| POST /api/workflows/validate | 校验流程定义 | 输入契约和节点能力 |
| POST /api/workflow-runs | 固定版本并创建运行 | 幂等键、配置版本 |
| POST /api/node-runs/:id/attempts | 启动或换模型重试 | 输入版本、状态版本 |
| POST /api/attempts/:id/stop | 停止原执行 | 已保存的执行身份 |
| POST /api/attempts/:id/resume | 恢复原执行 | 已确认的 ResumePlan |
| POST /api/interactions/:id/answer | 回答底座交互 | 核对底座 interactionId |
| POST /api/artifacts/:id/revisions | 保存文档编辑 | expectedRevision、内容哈希 |
| POST /api/artifacts/:id/accept | 接纳候选版本 | 复核、基线和证据一致 |
| POST /api/code-candidates/:id/accept | 集成候选代码 | 用户确认，Git 基线一致 |
| GET /api/events?after=... | 工程事件订阅 | 按序恢复界面投影 |

评论、发现与导入导出 API 随对应模块补齐。
服务端对目录、产物路径与状态条件统一校验。
本地浏览器写操作使用应用会话凭据，并检查请求来源。

### F.4 错误与诊断

错误响应包含业务代码、相关对象和可操作的下一步。

| 代码示例 | 用户需要看到什么 |
| --- | --- |
| INPUT_MISSING | 缺少哪个产物，应该生成或导入什么 |
| INPUT_STALE | 哪个输入已更新，哪些节点受影响 |
| TARGET_UNAVAILABLE | 不可用的连接、模型或能力 |
| REVISION_CONFLICT | 当前版本与用户编辑基线的差异 |
| EXECUTION_UNKNOWN | 待核对的身份与最后确认状态 |
| VERIFICATION_FAILED | 失败命令、退出码和报告位置 |
| REVIEW_BLOCKED | 未解决发现与对应产物位置 |

诊断导出包含工程版本、执行身份和事件引用。
API 密钥不进入工程事件和导出配置。
费用缺少计价依据时显示未知，不填入虚构金额。

## G 实施任务、里程碑与验收矩阵

### G.1 P0：验证 Maka 接入

P0 的目标是证明所选底座能够完成首版必需的执行行为。
固定一个兼容源码快照或构建，并记录安装与启动方式。

| 任务 | 交付物 | 通过条件 |
| --- | --- | --- |
| P0-01 | Host 连接与版本记录 | Windows 可连接，目标 rootId 可识别 |
| P0-02 | 模型目标查询与派发记录 | 两种不同连接实际完成运行 |
| P0-03 | 规格、实现、复核三个会话 | 模型目标与配置一致，输入可交接 |
| P0-04 | 代码工具与验证证据样例 | 文件变更、命令结果和代码版本可核对 |
| P0-05 | 权限与问题交互样例 | 用户回答经正式通道确认 |
| P0-06 | 停止、重连与恢复记录 | 原身份可查询，不重复执行写入 |
| P0-07 | 只读复核与工作空间报告 | 复核不能静默写入候选代码 |
| P0-08 | 适配决策记录 | 确定验证通道、策略扩展和版本边界 |

P0 的真实 API 调用需要可用的用户连接。
本方案编写阶段没有调用模型或安装 Maka。
若缺少连接、平台能力或接口，则记录具体阻塞项。

P0 的终止条件是必需能力失败且适配无法合理补齐。
此时保留工程契约，评估替代后端；不继续假定 Maka 可用。

### G.2 P1：交付本地工程控制层

| 任务 | 依赖 | 可审阅交付物 |
| --- | --- | --- |
| P1-01 领域实体与数据库 | P0-08 | 迁移、身份和版本约束 |
| P1-02 流程编译与状态机 | P1-01 | 串行调度、门禁与变更规则 |
| P1-03 MakaBackend 实现 | P0、P1-01 | 执行、观察、交互、停止和恢复 |
| P1-04 产物与接纳服务 | P1-01 | 快照、冲突、失效传播和操作日志 |
| P1-05 Git 工作空间与验证器 | P0-08、P1-01 | 候选隔离、证据和代码接纳 |
| P1-06 默认工程模板 | P1-02、P1-04 | 规格、设计、任务、实现与收敛契约 |
| P1-07 任务调度 | P1-02、P1-03、P1-05 | 串行 TaskRun 与候选检查点 |
| P1-08 本地 API 和工作台 | 各服务契约已固定 | 步骤、产物、任务和运行界面 |

服务模块可在契约固定后分别实现。
MVP 功能完成后，通过 P2 验收再认定可用。

### G.3 P2：真实工程验收

使用隔离的测试仓库，完成一个小功能。
建议场景为“为现有项目增加 CSV 导入”。

| 验收 ID | 场景 | 必须成立的结果 |
| --- | --- | --- |
| AC01 | 导入已有规格并从设计开始 | 运行消费明确的已接纳版本 |
| AC02 | 增删或重排步骤 | 缺少输入或必需门禁时校验失败 |
| AC03 | 规格、实现、复核用不同连接 | 后端身份与阶段配置一致 |
| AC04 | 固定输入，换模型重试 | 新 Attempt 保留独立产物与用量 |
| AC05 | 模型声明完成但测试失败 | 工程阶段保持阻塞 |
| AC06 | 复核发现未解决问题 | 无法接纳对应候选版本 |
| AC07 | 接纳规格后再修改规格 | 设计、任务和证据显示过期 |
| AC08 | 文档发生并发编辑 | 返回冲突，当前内容不被覆盖 |
| AC09 | 旧证据对应新补丁 | 验证门禁拒绝放行 |
| AC10 | 断线、重启或启动回执丢失 | 核对原身份，不重复派发写入 |
| AC11 | 工程文件写入后进程崩溃 | 恢复操作日志，决策状态一致 |
| AC12 | 停止或恢复执行 | 状态与底座确认一致 |
| AC13 | Git 接纳发生基线冲突 | 保留候选，要求解决冲突 |
| AC14 | 导出工程记录 | 版本、证据和身份完整，密钥不包含 |

测试分为领域单元、假后端契约和真实 Host 集成。
假后端覆盖状态分支，真实 Host 验证接口与工具行为。
浏览器验证步骤编辑、差异接纳、交互和重连界面。
不以模拟测试替代真实模型接入验收。

### G.4 P3：扩展产品能力

| 扩展 | 前置条件 |
| --- | --- |
| 流程画布和分支 Join | 与串行定义共享已验证的流程契约 |
| 并行分析与编码 | 工作空间隔离和集成验收通过 |
| 有上限的自动修订 | 发现、证据、预算和尝试状态可靠 |
| Maka Agent Graph 复用 | 验证其调度与工程状态之间的映射 |
| 团队实时协作 | 身份、同步和权限模型已设计 |
| 远程执行与桌面插件 | 后端边界及对应平台行为已验证 |

Maka Agent Graph 的现有拓扑拒绝环。
工程修订采用新尝试，后续控制循环也需明确上限。
完整流程画布与工程门禁由 SpecFlow 定义。

## H 风险、待验证项、来源与交付标准

### H.1 设计决策与实际验证的区别

本方案已确定产品分层和首版交付路线。
Maka 的实际接入能力仍需要 P0 证据。

| 待验证项 | 影响 | 所属任务 |
| --- | --- | --- |
| 目标构建与接口兼容性 | 能否稳定创建、查询和恢复阶段 | P0-01、P0-08 |
| 两种供应商的真实工具行为 | 模型组合是否能完成工程任务 | P0-02、P0-04 |
| Windows 命令和进程生命周期 | 停止、测试、恢复是否可靠 | P0-04、P0-06 |
| 权限与用户问题交互 | 会话能否正确等待与继续 | P0-05 |
| 只读与目录边界 | 阶段策略是否能够落实 | P0-07 |
| 验证证据的结构和读取 | 门禁能否检查实际结果 | P0-04、P0-08 |

细粒度策略不足时，优先评估小型 Host 扩展。
只有公开接入边界确实不足，才评估内部修改或 Fork。
每个扩展记录原因、范围、兼容版本和验收证据。

### H.2 方案实施中的关键风险

| 风险 | 处理机制 |
| --- | --- |
| 上游接口变化 | 固定构建，适配器契约测试，升级前验证 |
| 启动结果不明 | 保存派发身份，先核对，再决定重试 |
| 流程与运行状态混淆 | 分开记录执行、门禁和接纳状态 |
| 文档变化导致旧结果误用 | 输入版本绑定与失效传播 |
| 候选代码或人工编辑冲突 | 独立工作空间、版本条件和差异处理 |
| 模型复核遗漏问题 | 确定性验证、独立上下文和人工接纳 |
| 自动修订持续消耗资源 | 首版人工触发，后续使用明确上限 |

### H.3 技术证据

Maka 阅读基线为固定源码快照：
`6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa`。

| 证据 | 支持的判断 |
| --- | --- |
| [Maka 后端架构](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/ARCHITECTURE.md) | Runtime Host 的执行权威与入口分层 |
| [会话配置协议](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/protocol/session-catalog.ts) | 显式模型目标、会话创建与配置 |
| [Turn 协议](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/protocol/turn.ts) | 启动、查询、停止、恢复与终止身份 |
| [交互协议](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/protocol/interaction.ts) | 用户交互查询与回答通道 |
| [Host Client](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/client/connection.ts) | 类型化请求与会话订阅 |
| [Agent Graph](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/docs/architecture/agent-graph-stream-scheduling-draft.md) | 图调度机制及循环、创作界面的边界 |
| [Runtime Host 包定义](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/package.json) | private 包及导出边界 |

[详细底座评估](maka-foundation-review.html)保留具体源码分析。
本方案中的接口草案与模块边界用于实施指导。当前实现和实际验证范围见 [实施与验收记录](../implementation/validation.md)。
应用已实现本地 MVP；真实供应商连接、质量和费用元数据仍待验证。

### H.4 本次文档交付与后续复核

本次将原脑暴升级为实施方案 v0.1。
同步保留 Markdown 源稿与可视化页面，并在 README 添加入口。

后续实施从 P0-01 开始，按交付物和验收结果推进。
本方案及后续代码按仓库要求交给 Claude Code 复核。
复核重点是状态语义、接入边界、产物接纳与故障恢复。

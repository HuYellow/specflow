---
title: Maka 能否成为 SpecFlow 的 Harness 底座？
subtitle: 复用 Agent 执行，把产品开发集中在工程流程与产物管理
template: doc
theme: shadcn
lang: zh
date: 2026-10-12
status: 源码评估，尚未验证真实 API 或选定底座
---

建议复用现有执行底座。Maka 具备值得验证的接入边界，可以作为首个候选。
SpecFlow 保留自己的工程流程、质量门禁和产物管理。

## A 判断：从零做执行内核会扩大工程量

**我建议调整上一版“首版自建执行内核”的路线。**

软件工程 Harness 可以分成两层：

| 层次 | 核心职责 | 建议归属 |
| --- | --- | --- |
| 工程控制层 | 组合流程、装配阶段输入、检查门禁、接纳产物 | SpecFlow 自己实现 |
| Agent 执行层 | 模型调用、工具循环、上下文管理、权限、事件与恢复 | 优先复用 Maka |

从零承担第二层，会引入大量跨模型、跨工具和异常恢复的工作。
这些工作会分散第一层的产品开发精力。

独立产品仍可以使用现有 Runtime。
流程状态与验收规则属于 SpecFlow，执行行为通过明确接口交给底座。

**Maka 适合进入接入验证；目前还不足以直接宣布选型完成。**

本次阅读了 main 的源码和架构文档。
固定快照：`6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa`。
没有安装 Maka、运行它的测试或调用真实模型 API。

## B 可以复用什么：已有执行能力与待开发产品能力

| 需求 | 源码中确认的 Maka 能力 | SpecFlow 的工作 |
| --- | --- | --- |
| 调用不同模型 | 多供应商适配与模型连接配置 | 将阶段配置映射到模型目标 |
| 模型改代码 | 文件读写、代码搜索和命令工具 | 定义工程任务与完成条件 |
| 观察运行 | Runtime Host 的会话订阅与查询接口 | 展示阶段、任务和工程状态 |
| 保存与恢复 | 事件记录、执行生命周期与恢复机制 | 保存流程位置并核对执行结果 |
| 扩展功能 | Host 扩展和 Client 界面扩展 | 工程流程、产物与门禁模块 |
| 并行工作 | Agent Graph 的子会话调度 | 工程依赖、接纳和集成策略 |

这些是接入基础。代码存在仍需验证目标版本和平台上的实际行为。

工程规格、需求关联、产物接纳和上游失效传播，仍由 SpecFlow 实现。
Maka 的通用 Artifact 和会话记录不能直接视为这些工程语义。

架构依据：[后端架构](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/ARCHITECTURE.md)。
工具依据：[内置工具](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime/src/builtin-tools.ts)。

## C 模型切换：按阶段选择，已有直接接入点

**不同阶段使用不同模型，在 Maka 中有明确的源码支持。**

创建 Session 时，可指定 `modelTarget`：

| 字段 | 用途 |
| --- | --- |
| kind = explicit | 明确选择连接和模型 |
| connectionId | 指向已配置的连接身份 |
| connectionSlug | 连接配置名称 |
| model | 该连接下的模型标识 |

公开协议有 `session.create` 和 `session.configuration.update`。
会话配置更新包含模型目标，并采用版本检查。
存在运行或待处理交互的会话有状态约束。

依据：[会话协议](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/protocol/session-catalog.ts)。
状态约束：[SessionManager](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime/src/session-manager.ts)。

CLI 的非交互运行也有 `--connection` 和 `--model` 参数。
它适合初步验证，完整产品更适合使用 Host 的查询和订阅接口。
[CLI 参数实现](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/cli/src/run-command-core.ts)

模型工厂有多种供应商和兼容接口适配。
具体模型的工具、推理和上下文能力，仍要逐连接验证。
[模型工厂](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime/src/model-factory.ts)

建议的阶段配置如下，模型名称仅表示角色：

| 阶段 | 独立会话 | 执行配置 |
| --- | --- | --- |
| 需求规格 | spec-attempt-1 | 连接 A + 规格模型 |
| 工程设计 | plan-attempt-1 | 连接 B + 设计模型 |
| 代码实现 | impl-attempt-1 | 连接 C + 编码模型 |
| 独立复核 | review-attempt-1 | 连接 B + 复核模型 |

每步传入明确版本的文档、代码基线和相关发现。
换模型重试创建新尝试，并保留原结果。
这样可以避免首版依赖长会话中的跨供应商历史迁移。

Maka 还提供带连接、模型和推理级别的子 Agent 预设。
可在后续评估其与工程角色的映射。
[子 Agent 预设](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/core/src/subagent-settings.ts)

## D 外挂方式：优先独立工程控制台与 Host 适配器

| 方式 | 能复用什么 | 主要代价 | 我的判断 |
| --- | --- | --- | --- |
| 独立工作台 → Maka Runtime Host | Agent 执行、连接、事件、会话 | 编写协议适配器与工程 UI | 建议作为第一条验证路线 |
| Maka Host + Client 扩展包 | 执行能力和已有桌面界面 | 插件生命周期与 UI 插槽约束 | 适合嵌入式工程面板 |
| Fork Maka Desktop | 全部产品代码 | 上游合并和内部界面耦合 | 接口不足时再评估 |
| 从零开发 Runtime | 完整控制权 | 工具、模型、上下文与恢复维护 | 当前产品阶段先降低这一投入 |

推荐的接缝是 Maka 的 Runtime Host。
架构将 Desktop、CLI 等入口统一放在该边界上。
SpecFlow 可以作为新的工程客户端，使用同一个执行权威。

公开 Client 接口有类型化请求和会话订阅。
它为独立控制台提供了源码上的接入路径。
[Host Client 接口](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime-host/src/client/connection.ts)

主线内部包标记为 private。
应固定 Host 与适配器版本，验证协议兼容性。
不能假设这些源码包就是可独立安装的稳定 SDK。

原生扩展包可以包含 Host 和 Client 两个入口。
Client 支持 overlay、设置页、会话动作等界面插槽。
完整流程画布需要确认合适的承载方式。
[扩展包与插槽文档](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/docs/architecture/client-plugin-runtime-pr1.md)

Host 插件的 `ctx.agents.create` 要求活跃的 Agent invocation。
后台流程控制服务需要采用合适的 Host 调用路径。
不能仅凭该插件方法的存在，就认定任意位置都能启动阶段。
[Agent 扩展接口](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/runtime/src/plugin-agent-service.ts)

## E 推荐分工：工程状态与执行记录各有归属

```flow TB
SpecFlow可视化工作台 -> 工程流程与质量门禁
工程流程与质量门禁 -> Maka适配器
Maka适配器 -> Maka Runtime Host
Maka Runtime Host -> Agent工具循环
Agent工具循环 -> 模型连接与仓库工具
Maka Runtime Host -> 执行事件与恢复
工程流程与质量门禁 -> 产物版本与接纳记录
```

| SpecFlow 保存 | Maka 保存 |
| --- | --- |
| 流程版本与阶段依赖 | Session、Turn、Run 与执行事实 |
| 阶段输入和产物哈希 | 模型调用与工具结果 |
| 验收规则与复核发现 | 权限交互和中断状态 |
| 用户接纳和上游失效状态 | Runtime 事件和执行恢复信息 |

SpecFlow 保存阶段尝试与 Maka 身份的关联。
展示工具活动时读取 Maka 记录，必要时建立可重建的缓存。
工程流程状态以 SpecFlow 的规则和记录为准。

一次阶段运行建议采用以下顺序：

1. 检查工程门禁，固定输入产物和代码基线。
2. 创建带模型目标的 Session，并记录关联身份。
3. 启动 Turn，订阅工具与执行状态。
4. 取得确定的终止结果，再检查文档、补丁和证据。
5. 处理复核发现或人工接纳，再放行下一阶段。

Maka 的执行完成，仍需经过工程验收。
权限询问由底座的交互机制处理；产物接纳由 SpecFlow 管理。

断线或重启后，先通过已保存身份查询执行结果。
结果不明时保持待核对状态，避免重复提交写入任务。
首版顺序阶段可共享同一 Feature 工作分支。
并行编码的工作空间隔离需要单独验证。

## F Agent Graph 的边界：可借鉴调度，工程流程仍需定义

Maka 的 Agent Graph 在子会话上组织依赖工作。
文档描述了拓扑、调度、汇总和恢复的机制。
它的目标是复用已有 Runtime 来执行多个 Agent。

同一文档明确没有覆盖任意循环和可视化流程创作系统。
当前拓扑校验也拒绝环。
[Agent Graph 架构](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/docs/architecture/agent-graph-stream-scheduling-draft.md)

因此应分别评估：

| 工程需求 | 接入判断 |
| --- | --- |
| 多个分析 Agent 与依赖汇总 | Agent Graph 可作为复用候选 |
| 拖拽编辑工程流程 | SpecFlow 提供创作界面与流程定义 |
| 文档接纳和质量门禁 | SpecFlow 定义并执行工程规则 |
| 失败后修订重跑 | 新尝试与有上限的控制循环 |

第一版建议让 SpecFlow 明确调度串行阶段。
后续再把合适的并行任务交给 Agent Graph。
这样可以先验证两层之间的状态和产物交接。

## G 最重要的接入风险：逐项用原型验证

| 未确认项 | 为什么影响选型 | 验证方式 |
| --- | --- | --- |
| 目标构建的接口与兼容性 | main 的能力不等于所有发布包的能力 | 固定版本，验证所需操作 |
| Windows 的执行与恢复 | 本项目优先使用本地工作空间 | 运行补丁、测试、停止和重启场景 |
| 多供应商的实际工具行为 | 模型列表不能证明工程任务表现 | 两种真实连接执行同类任务 |
| 权限和人工交互 | 阶段可能等待批准或用户回答 | 将交互完整呈现在控制台 |
| 按阶段限定工具与目录 | 创建接口只有有限的策略字段 | 检查配置边界，必要时加 Host 扩展 |
| 工程证据读取 | 最终回复不保证实际测试通过 | 读取工具结果并绑定代码版本 |

源码中的 Session 创建参数没有任意工具白名单或任意 system prompt 字段。
阶段指令可通过输入内容表达；更细的隔离策略需要额外验证。
硬门禁在工程控制层执行，并检查真实产物。

CLI 文档标记为 Beta，并说明命令和数据格式仍可能变化。
接入时固定兼容版本，并保留薄适配器边界。
[CLI 文档](https://github.com/apache/maka/blob/6b9457f5bb3c1af96e65ec9a12cc6bae63f49aaa/packages/cli/README.md)

这些是评估中发现的具体接入边界。
本次证据支持继续验证 Maka，尚未证明上述链路全部可用。

## H 最小验证：先打通模型切换与工程门禁

**建议先做三个阶段：规格 → 实现 → 独立复核。**
分别使用明确的会话和模型配置。

| 验证场景 | 应看到的结果 |
| --- | --- |
| 配置连接 A 和连接 B | 两种连接都能实际发起运行 |
| 三个阶段使用不同模型目标 | 执行记录与节点配置一致 |
| 阶段完成后更换模型重试 | 新候选产物与旧结果可比较 |
| 实现阶段调用代码工具和测试 | 工具证据对应实际文件变化 |
| 复核发现未解决问题 | 工程门禁保持阻塞 |
| 应用重启或控制台断开 | 重连后能核对原运行身份与结果 |

先用步骤列表与产物差异界面验证。
链路成立后，再扩展完整画布、任务并行和协作体验。

接入封装可以采用应用自有的 `ExecutionBackend` 接口。
它承载启动、观察、停止、恢复和结果读取。
第一个实现使用 Maka；工程流程通过接口访问底座。

这是建议的架构调整，尚未确定采用 Maka。
选择底座前，应先完成真实模型和工程工具的接入验证。

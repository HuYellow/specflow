---
title: SpecFlow 的 13 步如何对应 Spec Kit
subtitle: 当前实现核对 · 默认模板 · 2026-10-12
template: doc
theme: shadcn
lang: zh
---

当前默认模板有 **13 个执行步骤**。
其中有 5 个生成阶段、1 个澄清阶段、5 个复核阶段、1 个验证阶段和 1 个人工接纳阶段。
需求输入和项目章程在流程外准备，不计入这 13 步。
本次对照原 flow 插件固定的 Spec Kit v0.12.2。

SpecFlow 已实现规格驱动开发的主要阶段。
它通过自建阶段指令和 Maka 会话执行这些职责。
官方完整模板和全部阶段协议尚未移植。

## A 默认流程怎样走

```flow TB
需求输入与项目章程 -> 需求规格
需求规格 -> 需求澄清: 检查关键未知信息
需求澄清 -> 规格复核: 答复写回规格
规格复核 -> 工程设计与复核: 接纳规格版本
工程设计与复核 -> 任务拆解与复核: 接纳设计版本
任务拆解与复核 -> 代码实现: 接纳任务版本
代码实现 -> 测试与检查
测试与检查 -> 代码复核
代码复核 -> 收敛与复核
收敛与复核 -> 人工接纳代码: 接纳对齐报告
```

这是界面展示的默认顺序。
服务根据输入依赖、复核、接纳和证据决定能否放行。
规格、设计、任务和对齐报告的人工接纳不单列为节点。

## B 13 个步骤分别匹配什么

“职责对应”表示阶段目标相同，完整官方协议仍需补齐。
“部分覆盖”表示承担其中一些检查，不能视为完整命令。
“新增”表示 SpecFlow 的工程控制步骤。

| 序号 | SpecFlow 步骤 | 当前职责与结果 | 与 Spec Kit 的关系 |
| --- | --- | --- | --- |
| 01 | 需求规格 `specify` | 读取需求正文、文档和仓库，生成 `spec.md` | 对应 `speckit.specify` 的阶段职责 |
| 02 | 需求澄清 `clarify` | 提出最多 5 个关键问题，保存答复，生成修订后的 `spec.md` | 对应 `speckit.clarify`；独立问答、回写与门禁已实现 |
| 03 | 规格复核 `review-spec` | 检查规格完整性、歧义和可验证性，记录发现 | 新增复核；部分覆盖 `checklist` 的质量检查 |
| 04 | 工程设计 `plan` | 根据已接纳规格分析模块、接口与风险，生成 `plan.md` | 对应 `speckit.plan` 的阶段职责 |
| 05 | 设计复核 `review-plan` | 检查设计是否满足已接纳规格，记录发现 | 新增复核；部分覆盖 `analyze` 的规格与设计检查 |
| 06 | 任务拆解 `tasks` | 根据规格与设计生成带 ID、依赖和验收条件的 `tasks.md` | 对应 `speckit.tasks` 的阶段职责 |
| 07 | 任务复核 `review-tasks` | 检查任务覆盖、依赖和验收条件，记录发现 | 新增复核；部分覆盖 `analyze`，直接输入仅有任务和设计 |
| 08 | 代码实现 `implement` | 按已接纳任务修改隔离工作区，测试并形成候选代码和实现说明 | 对应 `speckit.implement`；应用另行管理任务执行和检查点 |
| 09 | 测试与检查 `verify` | 执行项目配置的真实命令，保存退出码、日志与代码哈希 | 新增确定性验证节点，使用工程服务执行 |
| 10 | 代码复核 `review-code` | 独立检查候选代码、规格与测试覆盖，保存发现和复核目标 | 新增代码复核节点 |
| 11 | 收敛与对齐 `converge` | 检查实现与规格、任务的对应关系，生成 `convergence.md` | 部分对应 `speckit.converge`；当前只输出报告 |
| 12 | 收敛复核 `review-converge` | 独立检查对齐报告，记录遗漏或阻塞问题 | 新增报告复核节点 |
| 13 | 接纳代码 `accept` | 用户确认后核对输入、测试证据、复核与 Git 基线，集成到工作项分支 | 新增人工接纳节点；后续提交 PR 是另一项操作 |

主要阶段的职责依据 [Spec Kit v0.12.2 命令说明](https://github.com/github/spec-kit/blob/v0.12.2/README.md#available-slash-commands)。
复核对应关系来自本次对节点输入和提示词的分析。

## C 各能力现在如何对应

| Spec Kit 能力 | 当前对应位置 | 实际差距 |
| --- | --- | --- |
| `constitution` 项目宪章 | 项目根目录 `AGENT.md` / `AGENTS.md` | 已接入读取、编辑和固定上下文；文件修订仍由项目维护 |
| `clarify` 需求澄清 | 独立的需求澄清步骤 | 已实现最多 5 个关键问题、持久问答、规格回写与设计前门禁 |
| `analyze` 三文档一致性分析 | 设计复核、任务复核承担部分检查 | 没有一次同时装配 `spec.md`、`plan.md`、`tasks.md` 的专门分析步骤 |
| `checklist` 需求质量清单 | 规格复核承担部分质量检查 | 没有专门生成并管理质量清单的产物 |
| `converge` 收敛补任务 | 收敛与对齐报告 | 没有把剩余工作追加到任务清单并进入下一轮实现 |
| 阶段门禁 `gate_phase` | 就绪检查、版本检查、复核和接纳检查 | 保留门禁思想；项目章程已接入，全部官方模板字段检查仍需补齐 |

[官方澄清定义](https://github.com/github/spec-kit/blob/v0.12.2/templates/commands/clarify.md)要求把回答记录回规格。
[官方分析定义](https://github.com/github/spec-kit/blob/v0.12.2/templates/commands/analyze.md)要求在任务生成后检查三份文档。
[官方清单定义](https://github.com/github/spec-kit/blob/v0.12.2/templates/commands/checklist.md)检查需求表达质量。
[官方收敛定义](https://github.com/github/spec-kit/blob/v0.12.2/templates/commands/converge.md)会将剩余工作追加为任务。
[官方宪章定义](https://github.com/github/spec-kit/blob/v0.12.2/templates/commands/constitution.md)包含修订和模板同步。

你提供的 flow 插件把 `analyze` 列在 `tasks` 前。
官方命令要求已有完整任务文档，因此本页按官方定义定位。
参照：[原插件的生命周期列表](https://github.com/HuYellow/speckit-codex-flow/blob/main/skills/speckit-flow/SKILL.md)。

## D 当前实现还需注意什么

当前收敛阶段直接装配实现说明、规格和任务。
它尚未装配工程设计及结构化测试结果。
提示词要求核对验证证据，但相应上下文还不完整。

阶段指令目前是应用自建的简化指令。
完整对齐还需补齐官方模板中的内容结构和检查规则。
新增复核节点不能自动补足这些阶段协议。

当前门禁检查产物版本、复核状态和未决标记。
它不代表官方文档模板的所有必需字段都已检查。
澄清与章程已落地，其他差距仍以本次代码核对为依据。

核对依据：[默认流程定义](../../packages/domain/index.ts)、[执行与上下文装配](../../apps/server/src/service.ts)、[产物接纳检查](../../apps/server/src/artifacts.ts)。
原插件的门禁思想参照 [speckit-codex-flow 门禁规则](https://github.com/HuYellow/speckit-codex-flow#gate-rules)。

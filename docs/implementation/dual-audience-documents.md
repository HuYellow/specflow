# 面向 AI 与人类的双份流程文档

日期：2026-10-15。

每份流程文档保留一份完整、可追溯的执行契约，并提供一份便于人快速阅读的简报。执行契约保存在产物修订的 `content` 中，继续承担后续 AI 输入、独立复核、版本失效检查和接纳的依据。简报用于说明本阶段的结论、范围、决策、风险及下一步，不新增执行指令，也不替代原文中的细节。

## 生成与修订

模型输出协议为每个 `artifacts` 条目增加可选的 `humanBrief`：`title`、`summary` 和包含 `title`、`items` 的 `sections`。派发提示要求同时输出完整 Markdown 契约及与其一致的纯文本简报，保留稳定的需求、决策或任务 ID，以及边界、异常处理、验收条件和上游追溯。顶层运行 `summary` 继续表示一次执行的概述，不能代替逐份文档的简报。

简报的标题、摘要、章节及要点具有长度和数量限制。应用按文本渲染这些内容，模型无需输出页面代码。该约束提高输出的一致性，但不能证明简报与正文在语义上完全一致；阅读界面提供对应修订的执行原文。独立复核把简报作为单独的 `human_brief` 材料与完整契约核对，检查其结论是否有正文依据，复核与接纳仍以完整契约为依据。

包含作者简报的复核批次新增 `human_brief_consistency` 准则，在该项检查中必须成对引用简报及其来源正文。两种复核视角都检查矛盾、无依据新增、可能误导决策的省略和虚假成功声明；结构校验拒绝遗漏对应引文的报告，复核发现的不一致阻塞接纳。语义判断仍取决于接入模型的实际能力。

导入文档、手动编辑和已有历史数据可能没有模型简报，此时从当前原文提取标题和有限片段生成阅读视图，并标记为 `extractive`。这是一份内容摘录，不声称完成语义总结或识别了全部风险。编辑正文时不沿用旧修订的简报，避免旧结论被显示在新正文旁边；旧修订继续关联自己的简报与原文。

## 版本绑定与接口

`GET /api/artifact-revisions/:id/reading` 返回 `schemaVersion: 1`、`sourceRevisionId`、`sourceContentHash`、`brief` 和 `mode`。`mode` 为 `authored` 时使用该修订的模型简报，为 `extractive` 时使用原文摘录。每次读取按指定修订生成，历史阅读视图不会因当前版本变化而换成新内容。

`GET /api/artifact-revisions/:id/reading.html` 下载独立 HTML 阅读页面，`source.md` 下载该修订的完整执行契约。页面展示来源修订与内容哈希，便于把截图、下载文件与严谨原文对应。下载接口继承本地会话和来源保护，并使用 `no-store` 响应策略。人类阅读文档仅提供 HTML 格式。

普通下游 AI 的冻结输入继续只引用 `content` 和 `contentHash`，简报只作为独立复核时的待检查材料。输入绑定、接纳决策和文件变更检查使用完整契约的哈希，不使用阅读文档的哈希。生成、查看或下载简报不会产生接纳记录，也不会解除复核或澄清门禁。

## 工作空间文件与恢复

接纳文档时，应用在 `.specflow/work-items/<工作项 ID>/` 导出两份文件：

| 文件 | 用途 |
| --- | --- |
| `<logicalId>.md` | 严谨执行契约；后续执行与变更检测的依据 |
| `<logicalId>.human.html` | 内置视觉阅读页面；可离线打开 |

阅读文件是指定修订的派生副本。修改阅读文件不会导入成新执行契约，也不会改变已有接纳判断；需要修改执行要求时应编辑或导入严谨原文并重新复核。恢复流程为成功写入的执行契约补齐阅读文件，并能够重新生成已接纳修订缺失的阅读副本。

若执行原文已写入、但阅读文件因路径障碍等原因写入失败，接纳操作仍保留为待完成。清除障碍后重试同一接纳操作或重新执行恢复流程，会核对原文哈希并完成原操作，不把应用自身的写入误判为外部修改。恢复期间的阅读副本导出错误记录为 `artifact.reading-export-failed` 事件，保留后续重试所需的操作状态，不阻断其他工作项的启动与恢复。

最终接纳代码时，完整 Markdown 契约与 HTML 阅读文件一同纳入工作项仓库的 Git 记录。代码集成期间锁定该工作项的文档修订与接纳，保证集成过程使用的文档版本稳定；集成结束或失败后释放锁。

## 页面设计与安全边界

页面采用结论优先、短摘要、少量章节和清晰信息层级的设计，参考 [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) 的阅读体验。实现为 SpecFlow 内置的确定性渲染器，没有复制该项目代码，也不在运行时安装或调用外部 skill。

简报和导入正文属于不可信文本。HTML 渲染对文本进行转义，不解释模型提供的 HTML、Markdown 链接或脚本，不加载外部字体、图片、脚本或其他远端资源。独立页面的内容安全策略禁止脚本与外部资源，下载响应声明 MIME 类型并禁止类型嗅探。阅读页面不会把文档中的链接或命令转变为执行入口。

## 验证与复核入口

`tests/human-documents.test.ts` 验证完整契约与阅读简报分离、下游冻结输入保留原文、编辑后不复用旧简报、历史修订绑定、两份接纳文件、导入及下载接口、技术文本保真、恶意文本转义、桌面读取保护、文档集成锁，以及中断、文件障碍和重试恢复。模型输出协议与持久化测试位于 `tests/stage-output-documents.test.ts`；`tests/engineering.test.ts` 的完整流程检查完整 Markdown 与 HTML 阅读文件都纳入 Git。这些测试不评估真实模型的摘要质量，也不声称自动检查了简报与正文的全部语义一致性。验证命令：`npm test -- tests/human-documents.test.ts tests/stage-output-documents.test.ts tests/engineering.test.ts`。

Claude Code 复核入口：`packages/document-presentation/index.ts`、`apps/server/src/artifacts.ts`、`apps/server/src/service.ts`、`apps/server/src/app.ts`、`packages/domain/index.ts`、`packages/execution-contract/index.ts`、`apps/web/src/Documents.tsx` 和 `tests/human-documents.test.ts`。重点检查来源绑定、旧修订兼容、接纳文件操作与恢复、派生内容不进入 AI 执行上下文，以及不可信文本的渲染边界。

`tests/human-brief-review.test.ts` 进一步验证复核材料的来源绑定、成对引文要求、普通下游只读取完整正文，以及简报矛盾时两轮复核阻塞接纳。相关策略实现位于 `apps/server/src/reviews.ts` 和 `packages/review-policy/index.ts`。本次尚未调用外部 Claude Code；以上文件与配套阅读页可作为复核入口。

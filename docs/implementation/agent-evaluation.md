# Agent 流程评估记录与工具

此工具汇总独立 trial 记录，不启动模型，也不生成评价结论。当前交付只有合成夹具验证，没有真实模型性能结果。`tests/fixtures/agent-eval.json` 必须保留 `sourceKind: "fixture"`；其成功率、耗时和费用均不能作为产品性能宣传。

## 运行

通过项目的 Node.js 24 工具链执行：

```powershell
node scripts/toolchain.mjs agent-eval --input tests/fixtures/agent-eval.json --output .tools/agent-eval-fixture-report.json
```

省略 `--output` 时，命令向标准输出打印 JSON。无效记录使整个输入失败，不会悄悄排除坏记录。工具拒绝将输出路径直接设为输入路径。

真实实验按同一结构提供 `sourceKind: "recorded"`。这只表示输入是实验记录；工具不会检查证据文件内容，也不为 oracle 的正确性背书。输出中的 `evidenceValidation` 明确标记为引用与哈希绑定检查。

## 输入合同

顶层字段为 `schemaVersion: 1`、`sourceKind`、`baselineVariant` 和 `trials`。基线名称必须实际存在，每个 trialId 必须全局唯一。

| 字段 | 记录内容 |
| --- | --- |
| trialId / taskId / taskVersion | 独立重复运行 ID、稳定任务 ID、固定需求与验收集版本 |
| variant | baseline、with-policy 等实验变体名称 |
| provenance.specflowVersion | 实际运行的 Git commit 或完整发布版本 |
| provenance.harness | 执行底座 ID 与实际版本，不能把不同底座记录混合 |
| provenance.model | 模型供应商与精确模型 ID |
| provenance.policyHash | 本次执行冻结策略的哈希 |
| status | completed、failed、timeout、cancelled、unknown |
| resultHash | 最终受评候选代码或产物的哈希；未知时为 null |
| oracle | 独立评估的种类、独立性、结果、taskVersion、受评 hash 和证据引用 |
| reviewVerdict | 可选工程流程内部复核结果，不能充当独立成功判据 |
| durationMs | 本次 trial 的总耗时，含失败与超时；未知时为 null |
| usage | modelCalls、inputTokens、outputTokens、costUsd，未知必须写 null |
| humanInterventions | 需要用户介入的次数；未知时为 null |

`oracle.kind` 支持 deterministic、human 和 model。只有 deterministic/human、`independent: true`、非空证据引用、任务版本与受评哈希均匹配且 verdict 为 pass，才满足成功评价条件。trial 还必须处于 completed。模型复核通过、引用缺失、过期哈希、未完成执行都不能计为成功。

此合同只验证记录结构与绑定。实验执行方必须保证 oracle 检查了真实结果。例如给 CSV 修复任务使用未进入生成上下文的固定测试集，并保存测试命令、退出码、日志及候选 hash；人工评价需保存预先固定的量表与结果。不能把 SpecFlow 自己的 review pass 复制成 independent oracle pass。

## 输出口径

所有输入 trial 进入成功率分母，含失败、超时、取消和未知。每个版本/底座/模型/策略组合形成独立 cohort；每个 cohort 另按 taskId 与 taskVersion 列出结果。工具不会从这些描述统计自动推导因果收益或统计显著性。

费用和 token 输出 `knownTotal`、`reportedTrials`、`missingTrials`。有任意缺失时 `total` 为 null，不用 0 补齐。耗时同时显示全部 trial 和成功 trial 的样本量、缺失数、均值、p50 与 p95；小样本分位数只用于描述。

比较变体前，固定任务版本、起始代码、模型目标、权限、总预算和独立 oracle。每次运行创建独立 trial，保留全部结果。固定一个变量后再比较，不能删除超时、挑选最佳重复运行或将不同预算的数字直接称为性能提升。

## 验证范围

`tests/evaluation.test.ts` 验证独立 oracle、旧哈希和模型自评不得判成功，缺失费用不补零，重复 trial 被拒绝，版本分组不混合，以及 CLI 输出与输入保护。这些测试验证评估工具的口径，不证明真实 agent 的正确率或成本已经改善。

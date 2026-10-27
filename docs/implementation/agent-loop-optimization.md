# Agent 执行与工程流程优化实施记录

设计依据：[调研与设计](../brainstorm/agent-loop-optimization.md)。用户于 2026-10-27 授权实施。

## 交付追踪

- [x] P0-A 策略快照、能力与终止事实、预算预留、用量账本。
- [x] P0-B 持久 deadline、停止意图、恢复核对、验证取消与日志完整性标记。
- [x] P1-A 有限修订、候选快照/派生日志、专用修订动作。
- [x] P1-B 自动推进、必要接纳/澄清/权限边界、桌面与 DSH 界面。
- [x] P2-A 结构化任务、上下文清单与交接、任务验证映射。
- [x] P3 的评估合同、汇总工具与夹具验证，见[评估工具说明](agent-evaluation.md)。
- [ ] P2-B 的冻结证据读取与长材料分片。依设计门禁，覆盖协议与质量评估通过前不启用；超限仍明确拒绝。
- [ ] P3 的真实模型基线/变体实验，以及据此决定的复核并行或流程模板变更。尚无真实模型效果数据。

## 已实现行为

### 策略、预算与用量

新尝试保存策略和能力快照，派发意图与预算预留在 SQLite 事务内提交。父运行额度来自冻结的 workflow 策略，子节点不能扩大额度；未知执行保持预留。每个 Attempt 默认限时 5 分钟，每尝试最多 128 次派发，每运行最多 1024 次派发。单次底座执行请求 `maxSteps: 40`，约束强度由底座的 native/observed 能力决定。双视角复核各有独立 Attempt，不能将此时限理解为整个复核节点合计 5 分钟。

流程和节点支持 `executionPolicy`。例如在流程 YAML 中设置：

```yaml
executionPolicy:
  timeoutMs: 300000
  maxDispatches: 8
  maxRunDispatches: 64
```

可选 `maxReservedSteps` / `maxRunReservedSteps` 限制保守预留的步数；跨底座不同单位不可混算。`maxCostUsd` 仅控制已知消费达到阈值后的后续派发。严格费用封顶目前不受底座支持，设置 `strictCostLimit` 会明确拒绝，未知费用不会写成零。

用量按底座、会话、turn 或 session meter 汇总，重复终态与恢复累计快照不重复计入。运行详情显示已知部分、unknown/partial、停止请求和确认事实，缺少能力的历史记录不伪造保证。

### 停止、重启与身份

Attempt 的 deadline 在创建时固定，包含准备、工具、等待运行时交互和任务内验证。重启与恢复不刷新时限。停止意图先持久化，再请求底座停止并取消本地验证；停止未确认时持续占用工作区，禁止替代写入。

启动恢复覆盖 reconciling，并对可核对身份做有限重试。已确定尚未派发的排队第二视角或修订可调度；已进入未知派发的操作不重发。恢复回执丢失也不能拿旧绑定的完成状态代替新恢复结果。

Maka 的显式恢复不保证继承剩余步数，因此严格累计步数策略下拒绝这类恢复。OpenCode 保持观测限制，DSH 无 live handle 时保留未确认停止状态。所有新派发核对冻结 target 与实际 backend/root 身份。

独立 verify 节点也保存自动化所有权、deadline 和停止意图。若应用在验证中退出，无法核对原本机进程时保持阻塞；界面要求用户先确认命令及其子进程已结束，再提交有版本条件和理由的人工确认。确认不会让原证据变为通过，仍需重新验证。

### 自动推进与有限修订

默认手动。流程页可以选择“运行到下一处需要我处理的位置”，并单独勾选自动修订。界面提供 1 或 2 轮；API 支持明确配置的 1–10 轮，默认 2 轮。必要人工接纳仍由用户执行。

每轮记录专用生成尝试、候选、验证证据和新的双视角批次。生成者处理测试/复核的具体失败；纯输出契约修复强制只读。代码修改、改措辞或重新生成问题 ID 不单独算进展，连续无进展或额度耗尽会停止。

快照采用独立 Git index 和持久 ref，保留失败候选中的普通未跟踪文件，不改其 HEAD 或暂存区。`baseCommit` 仍是接纳基线，`seedCommit` 是修复起点。prepared/snapshotted/seeded/activated 日志支持崩溃重入；只有激活后候选才参与当前候选查询。

修复不重放已完成任务的实现动作。旧任务的状态只用于定位；新代码重新运行验证，再继续尚未实施的任务，最后验证全量命令并独立复核。人工接纳使用基于原 acceptedCommit 的累积差异提交，保留前轮有效改动。

取消在异步检查、候选派生或底座 inspect 期间到达时，控制器和服务的派发边界都会重新检查持久状态。暂停保留原 owner、轮次和快照操作；恢复未完工作使用原 owner 与原设置。只读阶段写入、任务越界、上游或人工产物变更立即阻塞修订。

### TaskSpec 与上下文

任务支持版本化 JSON TaskSpec，显式声明依赖和验收条目。需求 ID、允许路径、验证命令和上下文引用可省略，默认空数组；`contextRefs` 当前记录引用，不自动检索或裁剪输入。旧 Markdown 清单继续可读，只有明确的依赖声明形成边；普通提到 T 编号不会误建依赖。

Attempt 与执行绑定保存 ContextManifest，包含材料 hash、可见内容 hash、UTF-8 字节数和实际提示词大小。任务提示加入已完成依赖的产物与证据记录。完整审核材料仍保持原文；当前清单记录和交接并不等于已实现运行中压缩或检索工具。

任务可以选择已登记的局部验证命令，最终候选仍需通过完整命令集合。普通任务仅在 `allowedPaths` 非空时检查实际改动；修订级检查仅在全部原任务都声明范围时检查范围并集。旧 Markdown 或空范围不提供完整任务路径限制。越界后保留候选并停止，此事后检测不是操作系统沙箱。日志保留尾部、总字节数和截断标记，尚未持久化完整日志；不能把截断日志或补丁当作完整材料。

## 修复的实际验证缺陷

- 清除子进程继承的 `NODE_TEST_CONTEXT`，避免项目 `node --test` 跳过断言却返回成功。
- Git 输出依据字节截断标记拒绝不完整补丁，覆盖大段中文内容的情况。
- 未确认的底座终态不能被 taskMode 的合成完成结果掩盖。
- 非候选工作区的只读文档阶段也核对代码哈希，违规写入不会发布产物或进入下一修订轮。
- 停止自动化覆盖没有 Attempt 的独立验证节点。
- 候选集成包含整个 lineage 的累积差异，而非仅 cherry-pick 最后一轮修改。

## 兼容与迁移

领域新增字段均可选，旧记录不补造过去的策略、费用、deadline 或终止原因。缺少自动化设置仍为手动。首次打开旧 SQLite 状态时，Store 在写入新控制数据前生成一致性备份 `*.before-agent-loops-v2-*.sqlite`，随后记录 user_version 2；重复打开不重复备份。

迁移回归验证旧 Attempt 原文保持不变、备份保留旧数据库版本和数据。历史执行继续使用自己的 backend/ref；改工程默认底座不会移动历史执行。

## 验证与复核

主要回归位于 `tests/execution-control.test.ts`、`execution-policy-budget.test.ts`、`execution-migration.test.ts`、`automation-service.test.ts`、`automation-races.test.ts`、`automation-cancellation.test.ts`、`execution-identity.test.ts`、`readonly-repair.test.ts`、`git-evidence.test.ts`、`context-task-spec.test.ts` 和 `verification-runner.test.ts`。

[浏览器验收报告](agent-loop-qa/README.md)覆盖 1440 与 390 宽度的 8 个状态及实际停止/确认操作。桌面与 DSH 复用运行事实、自动化和验证恢复组件；插件另有协议、API 与类型检查。

2026-10-27 最终验证：

| 检查 | 结果 |
| --- | --- |
| `node scripts/toolchain.mjs test` | 287/287 通过，0 失败、0 跳过；包含实际 Maka Host 的本地协议夹具 |
| `node scripts/toolchain.mjs dsh-test` | 22/22 通过，0 失败、0 跳过 |
| 主项目 typecheck 与 `dsh-typecheck` | 通过 |
| 主项目 build 与 `dsh-build` | 通过；Vite 提示单个前端 chunk 大于 500 kB，当前约 554 kB |
| Chrome UI smoke | 8 个桌面/窄屏页面状态通过，无横向溢出、英文页面中文残留或浏览器异常 |
| 评估 CLI | fixture 输入生成明确标注为夹具的报告，不代表真实模型效果 |
| `git diff --check` | 通过 |

结果摘要见 [validation.json](agent-loop-qa/validation.json)。测试覆盖隔离仓库中的真实代码修改、验证进程、Git 快照与人工接纳；模型行为使用确定性或本地协议夹具，没有调用付费云端模型，也没有改动用户业务工程的数据。

## 必须维持的工程约束

Maka 的正式发布来源与默认地位、原执行身份、未知执行不重发、冻结输入新鲜度、双视角审核、真实验证和人工接纳规则继续执行。

实现经过 Codex 子代理独立审阅与反例验证。尚未调用外部 Claude Code；该文档、代码差异和测试可供后续 Claude Code 复核。

import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultWorkflow, type NodeRun, type WorkflowNode, type WorkflowRun } from '../packages/domain/index.ts';
import { contextPaneSizing, dispatchBlockers, getConditionReasons, getFlowReadinessKey, getNextAction, getNodeDispatchScopes, getStepStatus, getWorkflowProgress, groupWorkflowNodes, selectCurrentNode } from '../apps/web/src/flowSelectors.ts';

const entity = { revision: 1, createdAt: '2026-10-15T00:00:00Z', updatedAt: '2026-10-15T00:00:00Z' };
function workflow(): WorkflowRun { return { ...entity, id: 'run', workItemId: 'item', workflowId: 'workflow', definition: defaultWorkflow(), rules: '', rulesHash: '', state: 'active' }; }
function step(definition: WorkflowNode, patch: Partial<NodeRun> = {}): NodeRun {
  return { ...entity, id: `node-${definition.id}`, workflowRunId: 'run', nodeId: definition.id, name: definition.name, type: definition.type, execution: 'completed', gate: 'passed', freshness: 'fresh', acceptance: 'accepted', blockers: [], ...patch };
}

test('步骤四项事实独立，执行结束不会掩盖门禁阻塞、过期或待人工接纳', () => {
  const def = defaultWorkflow().nodes[0];
  const blocked = getStepStatus(step(def, { gate: 'blocked', acceptance: 'pending' }), def);
  assert.equal(blocked.execution.value, '已结束');
  assert.equal(blocked.gate.value, '阻塞');
  assert.equal(blocked.freshness.value, '当前有效');
  assert.equal(blocked.acceptance.value, '待人工接纳');
  assert.equal(blocked.effectivelyPassed, false);
  assert.equal(getStepStatus(step(def, { freshness: 'stale' }), def).effectivelyPassed, false);
  assert.equal(getStepStatus(step(def, { acceptance: 'pending' }), def).effectivelyPassed, false);
  assert.equal(getStepStatus(step(def, { execution: 'running' }), def).effectivelyPassed, false);
  assert.equal(getStepStatus(step(def), def).effectivelyPassed, true);
});

test('复核和验证的系统确认不标为人工接纳，无独立接纳动作的pending不扣分', () => {
  const def = defaultWorkflow().nodes.find(value => value.type === 'verify')!;
  const confirmed = getStepStatus(step(def), def);
  assert.equal(confirmed.acceptance.value, '系统已确认');
  assert.equal(confirmed.acceptance.raw, 'accepted');
  const pending = getStepStatus(step(def, { acceptance: 'pending' }), def);
  assert.equal(pending.acceptance.value, '无独立接纳动作');
  assert.equal(pending.acceptance.raw, 'pending');
  assert.equal(pending.effectivelyPassed, true);
  const human = defaultWorkflow().nodes.find(value => value.type === 'human')!;
  assert.equal(getStepStatus(step(human, { acceptance: 'pending' }), human).effectivelyPassed, false);
});

test('进度以冻结定义为分母，仅计当前运行且要求执行、门禁、新鲜度和必要接纳均有效', () => {
  const run = workflow(), nodes = run.definition.nodes.map(def => step(def));
  nodes[0].acceptance = 'pending';
  nodes[1].acceptance = 'pending'; // clarification has no separate manual acceptance
  nodes[2].gate = 'blocked';
  nodes[3].freshness = 'stale';
  nodes[4].execution = 'running';
  const result = getWorkflowProgress(run, [...nodes, step(run.definition.nodes[0], { id: 'unrelated', workflowRunId: 'old-run' })]);
  assert.deepEqual(result, { completed: 9, total: 13, percent: 69, stale: 1, awaitingAcceptance: 1 });
  assert.equal(getWorkflowProgress(run, nodes.slice(1)).total, 13);
  assert.equal(getWorkflowProgress(run, nodes.slice(1)).completed, 9);
  assert.equal(getWorkflowProgress(undefined, nodes).percent, undefined);
  assert.equal(getWorkflowProgress({ ...run, definition: { ...run.definition, nodes: [] } }, nodes).percent, undefined);
});

test('默认与旧版分组只使用运行定义；自定义或重排流程保留原顺序', () => {
  const run = workflow(), nodes = run.definition.nodes.map(def => step(def));
  assert.deepEqual(groupWorkflowNodes(run, nodes).map(group => group.name), ['需求', '设计', '任务', '实现', '交付']);
  const old = { ...run, definition: { ...run.definition, nodes: run.definition.nodes.filter(def => def.id !== 'clarify'), requireClarification: false } };
  assert.equal(groupWorkflowNodes(old, nodes).flatMap(group => group.nodes).length, 12);
  assert.ok(!groupWorkflowNodes(old, nodes).flatMap(group => group.nodes).some(node => node.nodeId === 'clarify'));
  const custom = { ...run, definition: { ...run.definition, nodes: [...run.definition.nodes].reverse() } };
  const grouped = groupWorkflowNodes(custom, nodes);
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].nodes.map(node => node.nodeId), custom.definition.nodes.map(def => def.id));
});

test('待交互和待核对优先于运行、新派发；旧运行不影响当前推荐', () => {
  const run = workflow(), nodes = run.definition.nodes.map(def => step(def, { execution: 'pending', gate: 'unchecked', acceptance: 'pending' }));
  nodes[0].execution = 'failed';
  nodes[1].execution = 'running';
  nodes[2].execution = 'reconciling';
  nodes[3].execution = 'waiting_interaction';
  const irrelevant = step(run.definition.nodes[0], { workflowRunId: 'old', execution: 'waiting_interaction' });
  assert.equal(selectCurrentNode(run, [irrelevant, ...nodes])?.id, nodes[3].id);
  nodes[3].execution = 'completed';
  assert.equal(selectCurrentNode(run, nodes)?.id, nodes[2].id);
  nodes[2].execution = 'completed';
  assert.equal(selectCurrentNode(run, nodes)?.id, nodes[1].id);
  nodes[1].execution = 'completed';
  assert.equal(selectCurrentNode(run, nodes)?.id, nodes[0].id);
});

test('服务端ready仍保留本地草稿阻塞；检查失败和loading均不能伪装成ready', () => {
  assert.deepEqual(dispatchBlockers({ state: 'ready', reasons: [] }, ['需求尚未保存']), ['需求尚未保存']);
  assert.deepEqual(dispatchBlockers({ state: 'blocked', reasons: ['章程无法读取'] }, ['章程无法读取']), ['章程无法读取']);
  assert.deepEqual(dispatchBlockers({ state: 'blocked', reasons: [] }, []), ['服务端条件尚未满足']);
  assert.match(dispatchBlockers({ state: 'loading' }, [])[0], /正在检查/);
  assert.match(dispatchBlockers({ state: 'error', message: '断线' }, [])[0], /无法检查运行条件：断线/);
  assert.deepEqual(getConditionReasons({ state: 'blocked', reasons: ['项目章程读取失败：文件无效'] }, ['文件无效'], ['项目章程读取失败：文件无效']), [{ reason: '项目章程读取失败：文件无效', sources: ['服务端运行检查', '步骤记录', '客户端检查'] }]);
});

test('常驻上下文按容器剩余空间钳制，确保中央内容至少560px', () => {
  assert.deepEqual(contextPaneSizing(1000), { maxWidth: 400, inlineAllowed: true });
  assert.deepEqual(contextPaneSizing(900), { maxWidth: 328, inlineAllowed: true });
  assert.deepEqual(contextPaneSizing(852), { maxWidth: 280, inlineAllowed: true });
  assert.deepEqual(contextPaneSizing(851), { maxWidth: 279, inlineAllowed: false });
});

test('主动作优先处理真实交互和原执行核对，readiness ready不能导致再次派发', () => {
  const def = defaultWorkflow().nodes[0];
  const base = { node: step(def, { execution: 'pending' }), runState: 'active' as const, accepted: false, readiness: { state: 'ready' as const, reasons: [] }, clientBlocked: false, unsavedRequirements: false, dispatchEnabled: true, hasOutput: false, hasAttempt: true, pendingCount: 2 };
  assert.equal(getNextAction(base).kind, 'dispatch');
  const waiting = { id: 'interaction:1', kind: 'interaction', title: '确认权限' };
  assert.equal(getNextAction({ ...base, waiting }).kind, 'attention');
  assert.equal(getNextAction({ ...base, waiting }).attentionId, waiting.id);
  for (const execution of ['running', 'reconciling', 'failed', 'cancelled'] as const) {
    assert.equal(getNextAction({ ...base, node: step(def, { execution }) }).kind, 'run');
  }
  assert.equal(getNextAction({ ...base, accepted: true, waiting }).kind, 'evidence');
  assert.equal(getNextAction({ ...base, readiness: { state: 'error', message: '断线' } }).kind, 'retry');
  assert.equal(getNextAction({ ...base, unsavedRequirements: true, clientBlocked: true, dispatchEnabled: false }).kind, 'requirements');
});

test('已暂停的流程仍保留活动执行入口；过期结果不伪装为当前产物审阅', () => {
  const def = defaultWorkflow().nodes[0];
  const base = { node: step(def), runState: 'active' as WorkflowRun['state'], accepted: false, readiness: { state: 'ready' as const, reasons: [] }, clientBlocked: false, unsavedRequirements: false, dispatchEnabled: false, hasOutput: true, hasAttempt: true, pendingCount: 0 };
  assert.equal(getNextAction(base).kind, 'artifact');
  assert.equal(getNextAction({ ...base, node: step(def, { freshness: 'stale' }) }).kind, 'dispatch');
  const paused = getNextAction({ ...base, runState: 'paused', node: step(def, { execution: 'running' }) });
  assert.equal(paused.kind, 'run');
  assert.match(paused.summary, /当前执行未因此暂停/);
  const idle = getNextAction({ ...base, runState: 'paused', node: step(def, { execution: 'pending' }) });
  assert.equal(idle.kind, 'blocked');
  assert.equal(idle.disabled, true);
});

test('固定步骤的运行条件会随其他步骤终态、独立复核或澄清记录变化重新读取', () => {
  const node = { id: 'selected', revision: 1 }, run = { id: 'run', revision: 1 };
  const snapshot = { nodes: [{ id: 'peer', revision: 1 }], revisions: [{ id: 'spec', revision: 1 }], clarifications: [{ id: 'session', revision: 1 }] };
  const original = getFlowReadinessKey(node, run, snapshot);
  for (const key of ['nodes', 'revisions', 'clarifications'] as const) {
    const changed = { ...snapshot, [key]: snapshot[key].map(value => ({ ...value, revision: 2 })) };
    assert.notEqual(getFlowReadinessKey(node, run, changed), original, `${key} 变更应使旧运行条件失效`);
  }
  assert.equal(getFlowReadinessKey(node, run, { ...snapshot }), original);
});

test('新派发同时观察当前尝试锁，人工接纳与代码页复用候选资源锁', () => {
  const flow = defaultWorkflow();
  const agent = step(flow.nodes[0], { currentAttemptId: 'attempt' });
  assert.deepEqual(getNodeDispatchScopes(agent, 'candidate'), { scope: `node:${agent.id}`, locks: [`node:${agent.id}`, 'attempt:attempt'] });
  const human = step(flow.nodes.at(-1)!, { currentAttemptId: 'previous' });
  assert.deepEqual(getNodeDispatchScopes(human, 'candidate'), { scope: 'candidate:candidate', locks: [`node:${human.id}`, 'attempt:previous', 'candidate:candidate'] });
});

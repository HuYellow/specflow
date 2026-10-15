import test from 'node:test';
import assert from 'node:assert/strict';
import { getAttentionItems } from '../apps/web/src/attention.ts';
import { affectsSelection, parseWorkspaceEvent } from '../apps/web/src/eventState.ts';
import { emptyLocation, locationSearch, readLocation, validateLocation } from '../apps/web/src/location.ts';
import { api, ApiError } from '../apps/web/src/api.ts';
import { parseRuntimeRequest } from '../apps/web/src/RuntimeInteraction.tsx';
import type { Snapshot } from '../apps/web/src/context.tsx';

function snapshot(): Snapshot {
  return { item: { id: 'item', status: 'active' }, project: { id: 'project', guidance: { contentHash: 'guidance' } }, requirements: { current: { id: 'requirements' }, history: [] }, nodes: [{ id: 'node', name: '规格', blockers: ['请回答'] }], attempts: [{ id: 'attempt', nodeRunId: 'node', number: 1, execution: 'waiting_interaction' }], clarifications: [], interactions: [], artifacts: [], revisions: [], findings: [], runs: [], workflows: [], bindings: [], candidates: [], evidence: [], tasks: [], comments: [], decisions: [], clarificationDrafts: [] } as unknown as Snapshot;
}
test('待处理按真实对象聚合：同一条件不重复计数，跨页请求保留原尝试与版本定位', () => {
  const state = snapshot();
  state.interactions = [{ id: 'permission', attemptId: 'attempt', state: 'pending', request: { kind: 'permission' } }, { id: 'answered', state: 'answered' }] as Snapshot['interactions'];
  state.clarifications = [{ id: 'clarify', nodeRunId: 'node', state: 'waiting_answers', questions: [{ id: 'q', question: '确认？' }] }] as Snapshot['clarifications'];
  state.artifacts = [{ id: 'artifact', logicalId: 'spec', currentRevisionId: 'revision', revisionIds: ['revision'] }] as Snapshot['artifacts'];
  state.revisions = [{ id: 'revision', artifactId: 'artifact', requirementRevisionId: 'requirements', guidanceHash: 'old', reviewed: false }] as Snapshot['revisions'];
  const tasks = getAttentionItems(state);
  assert.equal(tasks.length, 3); assert.equal(tasks[0].priority, 0);
  assert.equal(tasks.find(task => task.kind === 'interaction')?.attemptId, 'attempt');
  assert.equal(tasks.find(task => task.kind === 'artifact')?.revisionId, 'revision');
  assert.equal(tasks.find(task => task.kind === 'artifact')?.stale, true);
  state.revisions[0].guidanceHash = 'guidance'; state.revisions[0].originAttemptId = 'attempt';
  state.nodes[0].freshness = 'stale';
  assert.equal(getAttentionItems(state).find(task => task.kind === 'artifact')?.stale, true);
  state.item.status = 'accepted'; assert.deepEqual(getAttentionItems(state), []);
});
test('事件范围兼容旧事件，内容隔离不吞掉工程与工作项目录更新', () => {
  const selected = { projectId: 'project', itemId: 'item' };
  const base = { seq: 1, entityId: 'e', kind: 'nodes.updated' };
  assert.equal(affectsSelection(base, selected), true);
  assert.equal(affectsSelection({ ...base, projectId: 'project', workItemId: 'other' }, selected), false);
  assert.equal(affectsSelection({ ...base, kind: 'workItems.created', projectId: 'project', workItemId: 'other' }, selected), true);
  assert.equal(affectsSelection({ ...base, kind: 'projects.created', projectId: 'other' }, selected), true);
  assert.equal(parseWorkspaceEvent('{bad'), undefined);
  assert.equal(parseWorkspaceEvent(JSON.stringify({ ...base, seq: -1 })), undefined);
});
test('定位只序列化视图对象，合法修订可推导产物，失效定位有明确回退', () => {
  const state = snapshot();
  state.artifacts = [{ id: 'artifact' }] as Snapshot['artifacts'];
  state.revisions = [{ id: 'revision', artifactId: 'artifact' }] as Snapshot['revisions'];
  const location = { ...emptyLocation, project: 'project', item: 'item', view: 'artifacts' as const, revision: 'revision', mode: 'pinned' as const };
  assert.deepEqual(readLocation(locationSearch(location)), location);
  assert.equal(validateLocation(location, state).location.artifact, 'artifact');
  const fallback = validateLocation({ ...location, node: 'missing', artifact: 'removed', revision: 'old' }, state);
  assert.equal(fallback.invalid, true); assert.equal(fallback.location.revision, '');
  const parsed = readLocation('?view=unexpected&request=secret&token=secret');
  assert.equal(parsed.view, 'flow'); assert.ok(!locationSearch(parsed).includes('secret'));
});
test('执行请求解析保留false和0的默认值，拒绝字段不完整的表单', () => {
  const request = parseRuntimeRequest({ kind: 'form', fields: [{ name: 'flag', kind: 'boolean', default: false }, { name: 'count', kind: 'integer', default: 0 }] });
  assert.equal(request?.fields?.[0].default, false); assert.equal(request?.fields?.[1].default, 0);
  assert.equal(parseRuntimeRequest({ kind: 'form', fields: [{ label: 'missing' }] }), undefined);
  assert.equal(parseRuntimeRequest({ kind: 'question', questions: [null] }), undefined);
});
test('写请求网络或5xx结果不确定时保留操作键，不自动重试；4xx保留明确失败语义', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => { calls++; assert.equal(new Headers(options?.headers).get('Idempotency-Key'), 'same-operation'); throw new Error('lost'); };
    await assert.rejects(api('/node-runs/node/attempts', { expectedRevision: 1 }, { idempotencyKey: 'same-operation' }), error => error instanceof ApiError && error.uncertain && error.operationKey === 'same-operation');
    assert.equal(calls, 1);
    globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'receipt unavailable' }), { status: 500 }); };
    await assert.rejects(api('/node-runs/node/attempts', {}, { idempotencyKey: 'same-operation' }), error => error instanceof ApiError && error.uncertain && error.operationKey === 'same-operation');
    globalThis.fetch = async () => new Response(JSON.stringify({ code: 'REVISION_CONFLICT', message: 'changed' }), { status: 409 });
    await assert.rejects(api('/artifacts/a/revisions', {}), error => error instanceof ApiError && !error.uncertain && error.code === 'REVISION_CONFLICT');
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

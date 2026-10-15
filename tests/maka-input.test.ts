import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError, type ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';
import { MakaBackend } from '../packages/maka-adapter/index.ts';

const textLimit = 48 * 1024;
const ref: ExecutionRef = { backend: 'maka', rootId: 'fake-host', sessionId: 'fake-session', turnId: 'fake-turn' };

function input(prompt: string): FrozenInput {
  return { attemptId: 'size-boundary', prompt, workspace: 'unused-workspace', target: { backend: 'maka', connectionId: 'fake-connection', connectionSlug: 'fake-connection', model: 'same-model' }, readOnly: true, maxSteps: 8, inputHash: 'fake-input', node: { id: 'review-spec', name: '规格复核', type: 'review', role: 'reviewer', prompt: '', inputs: ['spec'], outputs: [] }, artifacts: [] };
}

class FakeHostBackend extends MakaBackend {
  connections = 0;
  requests: { operation: string; input: unknown }[] = [];
  constructor() { super('unused-package', 'unused-root'); }
  override async connect() {
    this.connections++;
    return { rootId: 'fake-host', request: async (operation: string, value: unknown) => {
      this.requests.push({ operation, input: value });
      return operation === 'turn.start' ? { kind: 'started', turn: { runId: 'fake-run' } } : {};
    }, status: async () => ({}), openSessionSubscription: async () => ({}), close: async () => {} };
  }
}

function isTooLarge(actualBytes: number) {
  return (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, 'INPUT_TOO_LARGE');
    assert.equal(error.status, 413);
    assert.deepEqual(error.details, { actualBytes, maxBytes: textLimit });
    assert.match(error.message, /缩小/);
    assert.match(error.message, /不能截断/);
    return true;
  };
}

test('超出正式版文本上限时，prepare 在连接 Host 或创建会话前拒绝', async () => {
  const backend = new FakeHostBackend();
  await assert.rejects(backend.prepare(input('a'.repeat(textLimit + 1))), isTooLarge(textLimit + 1));
  assert.equal(backend.connections, 0);
  assert.deepEqual(backend.requests, []);
});

test('UTF-8 恰好 48 KiB 可以创建会话，增加一个字节即被拒绝', async () => {
  const backend = new FakeHostBackend(), boundary = '需'.repeat(textLimit / 3);
  assert.equal(Buffer.byteLength(boundary, 'utf8'), textLimit);
  const created = await backend.prepare(input(boundary));
  assert.equal(created.sessionId, 'size-boundary');
  assert.equal(backend.connections, 1);
  assert.equal(backend.requests[0].operation, 'session.create');
  await assert.rejects(backend.prepare(input(`${boundary}a`)), isTooLarge(textLimit + 1));
  assert.equal(backend.connections, 1);
  assert.equal(backend.requests.length, 1);
});

test('正常输入保留显式模型、全新会话和只读策略，并能启动 turn', async () => {
  const backend = new FakeHostBackend(), frozen = input('独立检查原始需求与候选规格。');
  const created = await backend.prepare(frozen);
  const request = backend.requests[0].input as { sessionId: string; modelTarget: unknown; collaborationMode: string };
  assert.equal(request.sessionId, frozen.attemptId);
  assert.deepEqual(request.modelTarget, { kind: 'explicit', connectionId: 'fake-connection', connectionSlug: 'fake-connection', model: 'same-model' });
  assert.equal(request.collaborationMode, 'plan');
  const snapshot = await backend.start(created, frozen);
  assert.equal(snapshot.state, 'running');
  assert.equal(snapshot.ref.runId, 'fake-run');
  assert.equal(backend.requests[1].operation, 'turn.start');
  assert.equal((backend.requests[1].input as { content: { text: string } }).content.text, frozen.prompt);
});

test('start 会重新检查追加任务后的最终文本，超限时不连接 Host 或派发 turn', async () => {
  const backend = new FakeHostBackend(), boundary = 'a'.repeat(textLimit);
  const prepared = await backend.prepare(input(boundary));
  await assert.rejects(backend.start(prepared, input(`${boundary}\n当前任务：T001`)), isTooLarge(Buffer.byteLength(`${boundary}\n当前任务：T001`, 'utf8')));
  assert.equal(backend.connections, 1);
  assert.deepEqual(backend.requests.map(request => request.operation), ['session.create']);
});

test('start 独立拒绝超限文本，即使调用方提供了现成执行身份', async () => {
  const backend = new FakeHostBackend();
  await assert.rejects(backend.start(ref, input('需'.repeat(textLimit / 3 + 1))), isTooLarge(textLimit + 3));
  assert.equal(backend.connections, 0);
  assert.deepEqual(backend.requests, []);
});

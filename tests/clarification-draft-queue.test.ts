import test from 'node:test';
import assert from 'node:assert/strict';
import { ClarificationDraftQueue, type SavedClarificationDraft } from '../apps/web/src/clarification-draft-queue.ts';

function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }

test('remount waits for the old delayed write and reuses identical confirmed answers', async () => {
  const gate = deferred(), calls: number[] = [];
  const queue = new ClarificationDraftQueue(async (_sessionId, revision, answers) => { calls.push(revision); await gate.promise; return { revision: revision + 1, answers }; });
  const staleSnapshot = { revision: 0, answers: {} }, answers = { Q1: '抛出明确错误' };
  const oldMount = queue.save('session', staleSnapshot, answers);
  await Promise.resolve();
  const newMount = queue.save('session', staleSnapshot, answers);
  assert.equal(queue.state('session').saving, true); assert.deepEqual(calls, [0]);
  gate.resolve();
  assert.equal((await oldMount).revision, 1); assert.equal((await newMount).revision, 1);
  assert.deepEqual(calls, [0]); assert.equal(queue.state('session').saving, false);
  assert.equal(queue.isSaved('session', staleSnapshot, answers), true);
});

test('different answers from the new mount use the old write confirmed revision', async () => {
  const gate = deferred(), calls: { revision: number; answer: string }[] = [];
  const queue = new ClarificationDraftQueue(async (_sessionId, revision, answers) => { calls.push({ revision, answer: answers.Q1 }); if (!revision) await gate.promise; return { revision: revision + 1, answers }; });
  const initial = { revision: 0, answers: {} };
  const oldMount = queue.save('session', initial, { Q1: 'first' });
  await Promise.resolve();
  const newMount = queue.save('session', initial, { Q1: 'second' });
  gate.resolve(); await oldMount; assert.equal((await newMount).revision, 2);
  assert.deepEqual(calls, [{ revision: 0, answer: 'first' }, { revision: 1, answer: 'second' }]);
});

test('real server revision conflicts remain blocked until explicit comparison acknowledgement', async () => {
  let server: SavedClarificationDraft = { revision: 2, answers: { Q1: 'another window' } }, writes = 0;
  const conflict = new Error('REVISION_CONFLICT');
  const queue = new ClarificationDraftQueue(async (_sessionId, revision, answers) => { writes++; if (revision !== server.revision) throw conflict; server = { revision: revision + 1, answers }; return server; });
  const stale = { revision: 0, answers: {} };
  await assert.rejects(queue.save('session', stale, { Q1: 'local' }), error => error === conflict);
  await assert.rejects(queue.save('session', stale, { Q1: 'new local' }), error => error === conflict);
  assert.equal(writes, 1); assert.equal(queue.state('session').error, conflict);
  queue.acknowledge('session', server);
  assert.equal((await queue.save('session', server, { Q1: 'compared local' })).revision, 3);
  assert.equal(writes, 2); assert.equal(queue.state('session').error, undefined);
});

test('a newer snapshot from another window cannot be mistaken for a local duplicate', async () => {
  let writes = 0;
  const queue = new ClarificationDraftQueue(async (_sessionId, revision, answers) => { writes++; return { revision: revision + 1, answers }; });
  const first = { revision: 0, answers: {} };
  await queue.save('session', first, { Q1: 'local' });
  const external = { revision: 2, answers: { Q1: 'external' } };
  assert.equal(queue.isSaved('session', external, { Q1: 'local' }), false);
  await assert.rejects(queue.save('session', external, { Q1: 'local' }), /其他编辑者/);
  assert.equal(writes, 1);
});

test('separate sessions remain independent while one session waits for a delayed response', async () => {
  const gate = deferred();
  const queue = new ClarificationDraftQueue(async (sessionId, revision, answers) => { if (sessionId === 'slow') await gate.promise; return { revision: revision + 1, answers }; });
  const initial = { revision: 0, answers: {} }, slow = queue.save('slow', initial, { Q1: 'slow' });
  assert.equal((await queue.save('fast', initial, { Q1: 'fast' })).revision, 1);
  assert.equal(queue.state('slow').saving, true); gate.resolve(); await slow;
});

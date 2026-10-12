import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { Store } from '../apps/server/src/store.ts';
import { EngineeringService } from '../apps/server/src/service.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import type { ExecutionBackend } from '../packages/execution-contract/index.ts';
export async function fixture(backend?: ExecutionBackend) {
  const root = await mkdtemp(join(tmpdir(), 'specflow-test-'));
  const store = new Store(join(root, 'engineering.sqlite'));
  const service = new EngineeringService(store, root, { sandbox: new SandboxBackend(), maka: backend || new SandboxBackend() });
  await service.initialize(); await service.seedDemo();
  const item = store.list('workItems')[0];
  const cleanup = async () => { await service.waitForIdle(); store.close(); if (!resolve(root).startsWith(resolve(tmpdir())) || !basename(root).startsWith('specflow-test-')) throw new Error('Refusing test cleanup outside named temp fixture'); await rm(root, { recursive: true, force: true }); };
  return { root, store, service, item, cleanup };
}
export async function runNode(f: Awaited<ReturnType<typeof fixture>>, nodeId: string, target?: any) {
  const run = f.store.list('runs').at(-1)!;
  const node = f.store.list('nodes', n => n.workflowRunId === run.id && n.nodeId === nodeId)[0];
  await f.service.startNode(node.id, node.revision, target); await f.service.waitForIdle();
  return f.store.get('nodes', node.id);
}
export async function acceptedDocuments(f: Awaited<ReturnType<typeof fixture>>) {
  for (const [nodeId, reviewId, logical] of [['specify', 'review-spec', 'spec'], ['plan', 'review-plan', 'plan'], ['tasks', 'review-tasks', 'tasks']]) {
    await runNode(f, nodeId); if (nodeId === 'specify') await clarifySpec(f); await runNode(f, reviewId);
    const artifact = f.store.list('artifacts', a => a.logicalId === logical)[0]; await f.service.acceptArtifact(artifact.id, artifact.revision);
  }
}
export async function clarifySpec(f: Awaited<ReturnType<typeof fixture>>) {
  await runNode(f, 'clarify');
  for (let round = 0; round < 5; round++) {
    const session = f.store.list('clarifications').at(-1)!;
    if (session.state !== 'waiting_answers') return;
    await f.service.answerClarification(session.id, session.revision, session.questions.filter(q => !q.answer).map(q => ({ questionId: q.id, answer: q.options[0] || '已确认，按规格描述执行' })));
    await f.service.waitForIdle();
  }
  throw new Error('Clarification fixture did not converge within 5 questions');
}

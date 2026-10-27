import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, runNode } from './helpers.ts';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import type { ExecutionRef, ModelTarget } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

test('repair preserves the frozen target root when the registered backend identity changes', async () => {
  class ChangingRoot extends SandboxBackend {
    root = 'first-root'; calls = 0;
    target: ModelTarget = { backend: 'maka', rootId: 'first-root', connectionId: 'same', connectionSlug: 'same', model: 'same' };
    override async inspect() { return { ...await super.inspect(), rootId: this.root }; }
    override async listTargets() { return [this.target]; }
    override async prepare(input: FrozenInput) { return { ...await super.prepare(input), backend: 'maka' as const, rootId: this.root }; }
    override async start(ref: ExecutionRef, input: FrozenInput) { this.calls++; const result = await super.start(ref, input); if (this.calls === 1) result.output = 'invalid stage output'; return result; }
  }
  const backend = new ChangingRoot(), f = await fixture(backend);
  try {
    const run = f.store.list('runs')[0];
    f.store.update('runs', run.id, { definition: { ...run.definition, roles: { ...run.definition.roles, reviewer: backend.target } } });
    const failed = await runNode(f, 'specify', backend.target);
    assert.equal(failed.gate, 'blocked');
    backend.root = 'replacement-root';
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision);
    await f.service.waitForIdle();
    assert.equal(backend.calls, 1, JSON.stringify({ cycle: f.store.get('repairCycles', cycle.id), attempts: f.store.list('attempts').map(a => ({ root: a.target.rootId, ref: a.bindingId && f.store.get('bindings', a.bindingId).ref })) }));
  } finally { await f.cleanup(); }
});

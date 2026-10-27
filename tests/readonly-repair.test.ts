import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, runNode } from './helpers.ts';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

test('read-only document output repair rejects source changes even without a candidate', async () => {
  class UnexpectedWrite extends SandboxBackend {
    calls = 0;
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.id === 'specify') {
        this.calls++;
        if (this.calls === 1) result.output = 'invalid stage output';
        else { assert.equal(input.readOnly, true); await writeFile(join(input.workspace, 'unexpected-source.txt'), 'changed during read-only output repair'); }
      }
      return result;
    }
  }
  const f = await fixture(), backend = new UnexpectedWrite(); f.service.backends.sandbox = backend;
  try {
    const failed = await runNode(f, 'specify');
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision, { maxRounds: 2, mode: 'output' });
    await f.service.waitForIdle();
    const repair = f.store.list('attempts', a => a.repairCycleId === cycle.id && !a.review)[0];
    assert.equal(repair.errorCode, 'CODE_STALE');
    assert.equal(f.store.list('artifactRevisions', a => a.originAttemptId === repair.id).length, 0);
    const stopped = f.store.get('repairCycles', cycle.id);
    assert.equal(stopped.rounds.length, 1);
    assert.equal(stopped.stopReason, 'candidate_drift');
    assert.equal(backend.calls, 2, 'one original generation and one rejected repair; no second repair after a scope violation');
  } finally { await f.cleanup(); }
});

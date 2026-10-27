import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/server/src/app.ts';
import { fixture } from './helpers.ts';

test('workflow API preserves explicit execution policy and rejects malformed or misspelled limits', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const token = (await app.inject('/api/bootstrap')).json().token;
    const workflow = f.store.list('workflows')[0];
    const definition = structuredClone(workflow.definition);
    definition.executionPolicy = { maxRunDispatches: 20, maxRunReservedSteps: 800 };
    definition.nodes[0].executionPolicy = { maxDispatches: 2, maxCostUsd: 1 };
    const send = (key: string, value: unknown) => app.inject({ method: 'POST', url: `/api/workflows/${workflow.id}/save`, headers: { 'x-specflow-token': token, 'idempotency-key': key }, payload: { expectedRevision: workflow.revision, definition: value } });
    const invalid = await send('invalid-budget', { ...definition, executionPolicy: { maxRunDispatches: 0 } });
    assert.equal(invalid.statusCode, 400);
    const misspelled = await send('unknown-budget', { ...definition, executionPolicy: { maxRunDispatces: 2 } });
    assert.equal(misspelled.statusCode, 400);
    const saved = await send('policy-save', definition);
    assert.equal(saved.statusCode, 200, saved.body);
    const stored = f.store.get('workflows', workflow.id).definition;
    assert.deepEqual(stored.executionPolicy, definition.executionPolicy);
    assert.deepEqual(stored.nodes[0].executionPolicy, definition.nodes[0].executionPolicy);
  } finally { await app.close(); await f.cleanup(); }
});

test('automation routes retain session protection, bounded rounds, and explicit revisions', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const token = (await app.inject('/api/bootstrap')).json().token;
    const node = f.store.list('nodes')[0], run = f.store.list('runs')[0];
    const cases = [
      { url: `/api/node-runs/${node.id}/repair`, payload: { expectedRevision: node.revision, maxRounds: 0 } },
      { url: `/api/workflow-runs/${run.id}/automation`, payload: { expectedRevision: run.revision, autoAdvance: true, autoRepair: true, maxRepairRounds: 11 } },
    ];
    for (const [index, request] of cases.entries()) {
      assert.equal((await app.inject({ method: 'POST', ...request })).statusCode, 403);
      const invalid = await app.inject({ method: 'POST', ...request, headers: { 'x-specflow-token': token, 'idempotency-key': `invalid-${index}` } });
      assert.equal(invalid.statusCode, 400, invalid.body);
    }
    assert.equal(f.store.list('repairCycles').length, 0);
    assert.equal(f.store.list('automationRuns').length, 0);
  } finally { await app.close(); await f.cleanup(); }
});

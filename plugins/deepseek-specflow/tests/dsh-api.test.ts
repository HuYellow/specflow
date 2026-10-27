import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SpecflowApi, createSpecflowFetchRoute } from '../src/api.ts';
import { acceptedDocuments, clarifySpec, fixture, runNode } from '../../../tests/helpers.ts';
import type { ArtifactRevision, RequirementDocument, RequirementRevision, WorkItem } from '../../../packages/domain/index.ts';
import type { SpecflowBootstrap, SpecflowSnapshot } from '../src/protocol.ts';
import manifest from '../package.json' with { type: 'json' };

test('DSH API reads the shared core and retries commands without creating duplicate runs', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    const bootstrap = await api.read({ resource: 'bootstrap' }) as SpecflowBootstrap;
    assert.equal(bootstrap.canWrite, true);
    assert.equal(bootstrap.version, manifest.version);
    assert.equal(bootstrap.workItems[0].id, f.item.id);
    const snapshot = await api.read({ resource: 'snapshot', id: f.item.id }) as SpecflowSnapshot;
    assert.equal(snapshot.item.id, f.item.id);
    const workflow = f.store.list('workflows')[0];
    const request = { operation: 'createRun', input: { workflowId: workflow.id }, idempotencyKey: 'dsh-create-run-1' };
    const first = await api.command(request), second = await api.command(request);
    assert.deepEqual(second, first);
    assert.equal(f.store.list('runs').length, 2);
    await assert.rejects(api.command({ ...request, input: { workflowId: 'different-workflow' } }), { code: 'IDEMPOTENCY_CONFLICT' });
    assert.equal(f.store.list('runs').length, 2);
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH commands preserve the independent review gate and reject malformed or missing revisions', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    f.service.artifacts.create(f.item.id, 'spec', '# Requirement\n\nFR01: Return a structured CSV result.');
    const artifact = f.store.list('artifacts')[0];
    await assert.rejects(api.command({ operation: 'acceptArtifact', id: artifact.id, input: { expectedRevision: artifact.revision }, idempotencyKey: 'no-review' }), (error: unknown) => error instanceof Error && /复核|澄清/.test(error.message));
    assert.equal(f.store.get('artifacts', artifact.id).acceptedRevisionId, undefined);
    await assert.rejects(api.command({ operation: 'acceptArtifact', id: artifact.id, input: {}, idempotencyKey: 'no-revision' }));
    await assert.rejects(api.command({ operation: 'acceptArtifact', id: artifact.id, input: { expectedRevision: artifact.revision, actor: 'spoofed-owner' }, idempotencyKey: 'spoof-actor' }));
    await api.close();
    await assert.rejects(api.read({ resource: 'bootstrap' }), { code: 'PLUGIN_STOPPING' });
    await assert.rejects(api.command({ operation: 'createRun', input: { workflowId: f.store.list('workflows')[0].id }, idempotencyKey: 'after-shutdown' }), { code: 'PLUGIN_STOPPING' });
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH automation commands validate bounded repair and revision inputs before invoking the shared controller', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    const node = f.store.list('nodes')[0], run = f.store.list('runs')[0];
    await assert.rejects(api.command({ operation: 'startRepair', id: node.id, input: { maxRounds: 2 }, idempotencyKey: 'repair-without-revision' }));
    await assert.rejects(api.command({ operation: 'startRepair', id: node.id, input: { expectedRevision: node.revision, maxRounds: 0 }, idempotencyKey: 'repair-zero-rounds' }));
    await assert.rejects(api.command({ operation: 'startAutomation', id: run.id, input: { expectedRevision: run.revision, autoAdvance: true, autoRepair: true, maxRepairRounds: 11 }, idempotencyKey: 'too-many-rounds' }));
    assert.equal(f.store.list('repairCycles').length, 0);
    assert.equal(f.store.list('automationRuns').length, 0);
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH requirement editing keeps attached sources and rejects a stale draft without writing', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    const documents: RequirementDocument[] = [
      { id: 'prd-upload', name: 'csv-prd.md', content: '# CSV requirements\nReject duplicate record IDs.', source: 'upload' },
      { id: 'repo-acceptance', name: 'acceptance.txt', content: 'Keep quoted CSV fields intact.', source: 'repository', repositoryPath: 'docs/acceptance.txt' },
    ];
    const item = await api.command({ operation: 'createWorkItem', input: { projectId: f.item.projectId, name: 'Editable CSV requirements', request: 'Import CSV records.', documents }, idempotencyKey: 'requirements-item' }) as WorkItem;
    const original = f.service.requirements.current(item.id);
    const saved = await api.command({ operation: 'saveRequirements', id: item.id, input: { expectedRevisionId: original.id, request: 'Import CSV records and reject duplicate IDs.', documents: original.documents }, idempotencyKey: 'requirements-save' }) as RequirementRevision;
    assert.notEqual(saved.id, original.id);
    assert.equal(saved.number, original.number + 1);
    assert.equal(saved.request, 'Import CSV records and reject duplicate IDs.');
    assert.deepEqual(saved.documents, documents);
    assert.deepEqual(f.store.get('requirementRevisions', original.id), original);
    const snapshot = await api.read({ resource: 'snapshot', id: item.id }) as SpecflowSnapshot;
    assert.equal(snapshot.requirements.current.id, saved.id);
    assert.deepEqual(snapshot.requirements.current.documents, documents);

    const before = f.store.list('requirementRevisions', revision => revision.workItemId === item.id).length;
    await assert.rejects(api.command({ operation: 'saveRequirements', id: item.id, input: { expectedRevisionId: original.id, request: 'Overwrite the newer requirements.', documents: [] }, idempotencyKey: 'requirements-stale' }), { code: 'REVISION_CONFLICT' });
    assert.equal(f.store.list('requirementRevisions', revision => revision.workItemId === item.id).length, before);
    assert.deepEqual(f.service.requirements.current(item.id), saved);
    assert.equal(f.store.get('workItems', item.id).request, saved.request);
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH document editing creates an unreviewed candidate and keeps stale drafts from replacing it', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    await runNode(f, 'specify'); await clarifySpec(f); await runNode(f, 'review-spec');
    let artifact = f.store.list('artifacts', artifact => artifact.logicalId === 'spec')[0];
    await api.command({ operation: 'acceptArtifact', id: artifact.id, input: { expectedRevision: artifact.revision }, idempotencyKey: 'editing-accept-original' });
    artifact = f.store.get('artifacts', artifact.id);
    const original = f.store.get('artifactRevisions', artifact.currentRevisionId);
    assert.equal(original.reviewed, true);
    assert.equal(original.acceptance, 'accepted');
    assert.ok(original.reviewGroupId);

    const edited = await api.command({ operation: 'editArtifact', id: artifact.id, input: { expectedRevision: artifact.revision, content: `${original.content}\nOwner clarification: preserve CSV record ordering.\n` }, idempotencyKey: 'editing-save' }) as ArtifactRevision;
    assert.notEqual(edited.id, original.id);
    assert.equal(edited.reviewed, false);
    assert.equal(edited.acceptance, 'candidate');
    assert.equal(edited.reviewGroupId, undefined);
    assert.equal(edited.originAttemptId, undefined);
    const current = f.store.get('artifacts', artifact.id);
    assert.equal(current.currentRevisionId, edited.id);
    assert.equal(current.acceptedRevisionId, original.id);
    assert.equal(current.revisionIds.length, artifact.revisionIds.length + 1);
    const persisted = f.store.get('artifactRevisions', edited.id);
    assert.deepEqual(f.store.get('artifactRevisions', original.id), original);
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec@accepted'), { code: 'INPUT_STALE' });

    await assert.rejects(api.command({ operation: 'editArtifact', id: artifact.id, input: { expectedRevision: artifact.revision, content: 'A stale owner draft must not replace the latest candidate.' }, idempotencyKey: 'editing-stale' }), { code: 'REVISION_CONFLICT' });
    assert.deepEqual(f.store.get('artifacts', artifact.id), current);
    assert.equal(f.store.list('artifactRevisions', revision => revision.artifactId === artifact.id).length, current.revisionIds.length);
    assert.deepEqual(f.store.get('artifactRevisions', edited.id), persisted);
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH document editing preserves upstream and candidate provenance through later code changes', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code'); await runNode(f, 'converge');
    const artifact = f.store.list('artifacts', artifact => artifact.logicalId === 'convergence')[0];
    const original = f.store.get('artifactRevisions', artifact.currentRevisionId);
    assert.ok(original.inputs.some(input => input.logicalId === 'implementation'));
    assert.ok(original.candidateId); assert.ok(original.codeHash);
    const edited = await api.command({ operation: 'editArtifact', id: artifact.id, input: { expectedRevision: artifact.revision, content: `${original.content}\nOwner verified the report wording.\n` }, idempotencyKey: 'provenance-edit' }) as ArtifactRevision;
    assert.deepEqual(edited.inputs, original.inputs);
    assert.equal(edited.candidateId, original.candidateId);
    assert.equal(edited.codeHash, original.codeHash);
    assert.equal(edited.reviewed, false);
    assert.equal(edited.acceptance, 'candidate');

    const candidate = f.store.get('candidates', original.candidateId!);
    const code = join(candidate.workspace, 'csv.js');
    await writeFile(code, `${await readFile(code, 'utf8')}\n// Candidate changed after the report edit.\n`);
    const review = f.store.list('nodes', node => node.nodeId === 'review-converge')[0];
    const readiness = await api.read({ resource: 'readiness', id: review.id }) as { ready: boolean };
    assert.equal(readiness.ready, false);
    await assert.rejects(api.command({ operation: 'acceptArtifact', id: artifact.id, input: { expectedRevision: f.store.get('artifacts', artifact.id).revision }, idempotencyKey: 'provenance-reject-stale' }), { code: 'CODE_STALE' });
    assert.equal(f.store.get('artifacts', artifact.id).acceptedRevisionId, undefined);
  } finally { await api.close(); await f.cleanup(); }
});

test('DSH exact API route validates its Connection envelope and preserves request correlation', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service), route = createSpecflowFetchRoute(api, 'specflow/read');
  const request = (body: unknown, signal?: AbortSignal) => new Request('http://127.0.0.1/api/specflow/read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  try {
    assert.equal((await route.fetch(request({ resource: 'bootstrap' }))).status, 400);
    const envelope = { type: 'client-request', rpcId: 'test-correlation', method: 'specflow/read', payload: { resource: 'bootstrap' } };
    const accepted = await (await route.fetch(request(envelope))).json();
    assert.equal(accepted.rpcId, 'test-correlation');
    assert.equal(accepted.result.ok, true);
    const mismatch = await (await route.fetch(request({ ...envelope, method: 'specflow/command' }))).json();
    assert.equal(mismatch.result.ok, false);
    assert.equal(mismatch.result.error.code, 'INVALID_REQUEST');
    const cancelled = await (await route.fetch(request(envelope, AbortSignal.abort()))).json();
    assert.equal(cancelled.result.ok, false);
    assert.equal(cancelled.result.error.code, 'REQUEST_CANCELLED');
  } finally { await api.close(); await f.cleanup(); }
});

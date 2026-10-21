import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/server/src/app.ts';
import { localizeApiResponse } from '../apps/server/src/localization.ts';
import { createReading, renderReadingHtml } from '../packages/document-presentation/index.ts';
import { defaultWorkflow } from '../packages/domain/index.ts';
import { fixture } from './helpers.ts';

test('API language negotiation translates system messages without mutating canonical records or user content', async () => {
  const f = await fixture(), app = await createApp(f.service);
  const node = f.store.list('nodes')[0];
  f.store.update('nodes', node.id, { name: '当前阶段仍在执行或待核对', blockers: ['缺少 spec', '当前阶段仍在执行或待核对'] });
  const revision = f.service.artifacts.create(f.item.id, 'spec', '# 需求规格\n\n当前阶段仍在执行或待核对');
  try {
    const headers = { 'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.5' };
    const missing = await app.inject({ url: '/api/work-items/absent', headers });
    assert.equal(missing.statusCode, 404);
    assert.equal(missing.json().message, 'The record does not exist');
    assert.equal(missing.headers['content-language'], 'en');
    const snapshot = (await app.inject({ url: `/api/work-items/${f.item.id}`, headers })).json();
    const returned = snapshot.nodes.find((entry: any) => entry.id === node.id);
    assert.equal(returned.name, '当前阶段仍在执行或待核对');
    assert.deepEqual(returned.blockers, ['Missing spec', 'The current stage is executing or awaiting reconciliation']);
    assert.equal(snapshot.revisions.find((entry: any) => entry.id === revision.id).content, revision.content);
    assert.deepEqual(f.store.get('nodes', node.id).blockers, ['缺少 spec', '当前阶段仍在执行或待核对']);
    const exported = (await app.inject({ url: `/api/work-items/${f.item.id}/export`, headers })).json();
    assert.deepEqual(exported.nodes.find((entry: any) => entry.id === node.id).blockers, ['缺少 spec', '当前阶段仍在执行或待核对']);
    const chinese = await app.inject({ url: '/api/work-items/absent', headers: { 'accept-language': 'zh-CN;q=1,en;q=0.5' } });
    assert.equal(chinese.json().message, '记录不存在');
    const reading = await app.inject({ url: `/api/artifact-revisions/${revision.id}/reading.html`, headers });
    assert.match(reading.body, /<html lang="en">/);
    assert.match(reading.body, /READING BRIEF/);
    assert.match(reading.body, /当前阶段仍在执行或待核对/);
    const download = await app.inject({ url: `/api/artifact-revisions/${revision.id}/reading.html?locale=en`, headers: { 'accept-language': 'zh-CN' } });
    assert.equal(download.headers['content-language'], 'en');
    assert.match(download.body, /<html lang="en">/);
    const invalid = await app.inject({ url: `/api/artifact-revisions/${revision.id}/reading.html?locale=fr`, headers });
    assert.equal(invalid.statusCode, 400);
  } finally { await app.close(); await f.cleanup(); }
});

test('workflow diagnostics use English while user workflow names, prompts and input IDs are preserved', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const { token } = (await app.inject('/api/bootstrap')).json();
    const definition = defaultWorkflow('zh-CN');
    definition.nodes[0].inputs = ['用户的需求'];
    const response = await app.inject({ method: 'POST', url: '/api/workflows/validate',
      headers: { 'accept-language': 'en', 'x-specflow-token': token, 'idempotency-key': 'validate-localized' }, payload: { definition } });
    assert.equal(response.statusCode, 200, response.body);
    assert.ok(response.json().errors.some((error: any) => error.message === 'An upstream node does not provide 用户的需求'));
    assert.equal(definition.nodes[0].name, defaultWorkflow('zh-CN').nodes[0].name);
    const expired = await app.inject({ method: 'POST', url: '/api/projects', headers: { 'accept-language': 'en' }, payload: {} });
    assert.equal(expired.json().message, 'The local app session expired. Refresh the page');
  } finally { await app.close(); await f.cleanup(); }
});

test('structured response localization does not translate arbitrary strings in documents, logs or identities', () => {
  const original = { backends: [{ id: 'sandbox', name: '本地验收后端', capabilities: { reason: '执行底座无法连接，请检查配置' } }], targets: [{ name: '执行底座无法连接，请检查配置', rootId: '执行底座无法连接，请检查配置' }], sandbox: { reason: '执行底座无法连接，请检查配置' } };
  const translated: any = localizeApiResponse('/api/backend/targets', 200, original, 'en');
  assert.equal(translated.backends[0].name, 'Local acceptance backend');
  assert.equal(translated.backends[0].capabilities.reason, 'Cannot connect to the execution backend. Check its configuration');
  assert.deepEqual(translated.targets, original.targets);
  assert.equal(original.backends[0].name, '本地验收后端');
  const error: any = localizeApiResponse('/api/node-runs/node/attempts', 409, { code: 'NODE_BLOCKED', message: '缺少 spec；当前阶段仍在执行或待核对', details: { content: '缺少 spec' } }, 'en');
  assert.equal(error.message, 'Missing spec; The current stage is executing or awaiting reconciliation');
  assert.deepEqual(error.details, { content: '缺少 spec' });
  const review: any = localizeApiResponse('/api/node-runs/node/attempts', 409, { code: 'OUTPUT_INVALID', message: '审核报告无效：准则 用户的准则 没有排除反例，不能判定通过' }, 'en');
  assert.equal(review.message, 'Invalid review report: Criterion 用户的准则 did not rule out its counterexample and cannot pass');
});

test('offline reading translates generated fallback labels and leaves authored content verbatim', () => {
  const revision: any = { id: 'revision', content: '````\ncode\n````', contentHash: 'hash' };
  const reading = createReading(revision, 'spec', 'en');
  assert.equal(reading.brief.title, 'spec Reading Summary');
  assert.equal(reading.brief.sections[0].title, 'Reading Note');
  assert.match(renderReadingHtml(reading, 'spec', 'en'), /Complete document:/);
  const authored = createReading({ ...revision, humanBriefSourceHash: 'hash', humanBrief: { title: '阅读提示', summary: '缺少 spec', sections: [{ title: '文档要点', items: ['需求正文'] }] } }, 'spec', 'en');
  assert.equal(authored.brief.title, '阅读提示');
  assert.equal(authored.brief.summary, '缺少 spec');
});

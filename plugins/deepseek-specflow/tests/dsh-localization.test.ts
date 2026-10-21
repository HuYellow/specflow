import test from 'node:test';
import assert from 'node:assert/strict';
import { SpecflowApi, createSpecflowFetchRoute } from '../src/api.ts';
import { fixture } from '../../../tests/helpers.ts';

test('DSH RPC accepts locale over HTTP and IPC, preserves user content, and freezes new workflow language', async () => {
  const f = await fixture(), api = new SpecflowApi(f.service);
  const route = createSpecflowFetchRoute(api, 'specflow/read');
  const request = (payload: unknown, language = 'en') => new Request('http://127.0.0.1/api/specflow/read', {
    method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': language },
    body: JSON.stringify({ type: 'client-request', rpcId: 'locale-request', method: 'specflow/read', payload }),
  });
  try {
    const missing = await route.fetch(request({ resource: 'snapshot', id: 'absent' }));
    assert.equal(missing.headers.get('content-language'), 'en');
    assert.equal((await missing.json()).result.error.message, 'The record does not exist');
    const chinese = await route.fetch(request({ resource: 'snapshot', id: 'absent', locale: 'zh-CN' }));
    assert.equal(chinese.headers.get('content-language'), 'zh-CN');
    assert.equal((await chinese.json()).result.error.message, '记录不存在');
    const node = f.store.list('nodes')[0];
    f.store.update('nodes', node.id, { blockers: ['缺少 spec'], name: '原始用户步骤名称' });
    const snapshot: any = await api.read({ resource: 'snapshot', id: f.item.id, locale: 'en' });
    assert.equal(snapshot.nodes.find((entry: any) => entry.id === node.id).blockers[0], 'Missing spec');
    assert.equal(snapshot.nodes.find((entry: any) => entry.id === node.id).name, '原始用户步骤名称');
    const created: any = await api.command({ operation: 'createWorkItem', locale: 'en', idempotencyKey: 'localized-work-item', input: {
      projectId: f.item.projectId, name: '保留用户名称', request: '保留需求正文', documents: [],
    } });
    assert.equal(created.name, '保留用户名称');
    assert.equal(created.request, '保留需求正文');
    const workflow = f.store.list('workflows', workflow => workflow.workItemId === created.id)[0];
    assert.equal(workflow.definition.locale, 'en');
    assert.equal(workflow.definition.nodes[0].name, 'Requirements specification');
    const invalid = await route.fetch(request({ resource: 'snapshot', id: f.item.id, locale: 'fr' }));
    assert.equal((await invalid.json()).result.error.message, 'Request fields do not match the Specflow contract');
  } finally { await api.close(); await f.cleanup(); }
});

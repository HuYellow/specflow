import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopViewSearch, emptyDesktopViewState, parseDesktopView, parseDesktopViewState, updateDesktopViewState } from '../apps/desktop/view-state.ts';
import { readLocation } from '../apps/web/src/location.ts';

const view = { project: 'project-1', item: 'item-1', view: 'flow' as const, node: 'clarify-node', artifact: '', revision: '', attempt: 'attempt-1', mode: 'pinned' as const, documentView: 'reading' as const };
test('桌面视图白名单持久化定位，不保存正文、凭据或附加字段', () => {
  const state = updateDesktopViewState(emptyDesktopViewState(), { ...view, content: 'private document', token: 'secret', nested: { apiKey: 'credential' } });
  assert.deepEqual(state.last, view);
  assert.deepEqual(state.items, [view]);
  assert.ok(!JSON.stringify(state).includes('private document'));
  assert.ok(!JSON.stringify(state).includes('secret'));
  for (const invalid of [null, [], { ...view, item: '' }, { ...view, project: '../outside' }, { ...view, node: 'x'.repeat(129) }, { ...view, attempt: 'a\nquery' }, { ...view, view: 'unknown' }, { ...view, mode: 'running' }, { ...view, documentView: 'html' }, { ...view, node: 12 }]) {
    assert.equal(parseDesktopView(invalid), null);
    assert.throws(() => updateDesktopViewState(state, invalid));
  }
});
test('桌面重启查询恢复固定澄清与文档位置，并只保留最近 100 个工作项', () => {
  let state = emptyDesktopViewState();
  for (let index = 0; index < 105; index++) state = updateDesktopViewState(state, { ...view, item: `item-${index}` });
  assert.equal(state.items.length, 100); assert.equal(state.items[0].item, 'item-5'); assert.equal(state.last?.item, 'item-104');
  state = updateDesktopViewState(state, { ...view, item: 'item-12', node: 'another-node', view: 'artifacts', artifact: 'artifact-12', revision: 'revision-12', documentView: 'compare' });
  assert.equal(state.items.length, 100); assert.equal(state.items.at(-1)?.item, 'item-12');
  const persisted = parseDesktopViewState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(readLocation(desktopViewSearch(persisted.last)), persisted.last);
  assert.deepEqual(readLocation(desktopViewSearch(view)), view);
  assert.equal(desktopViewSearch({ ...view, mode: 'invalid' }), '');
});
test('桌面视图文件的非法条目被丢弃，未知格式返回空状态', () => {
  assert.deepEqual(parseDesktopViewState({ schemaVersion: 2, items: [view], last: view }), emptyDesktopViewState());
  const state = parseDesktopViewState({ schemaVersion: 1, items: [{ ...view, node: '../outside' }, view], last: { ...view, item: 'item-2', token: 'must disappear' }, token: 'not persisted' });
  assert.equal(state.items.length, 2); assert.equal(state.last?.item, 'item-2');
  assert.ok(!JSON.stringify(state).includes('token'));
});

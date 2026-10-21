import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BackendId, Interaction } from '../packages/domain/index.ts';
import { InteractionCard } from '../apps/web/src/RuntimeInteraction.tsx';
import { Workspace, type WorkspaceContext } from '../apps/web/src/context.tsx';
import { setLocale } from '../apps/web/src/i18n.ts';

function render(request: unknown, backend: BackendId) {
  const context = { snapshot: { item: { status: 'active' }, attempts: [{ id: 'attempt', nodeRunId: 'node', target: { backend } }] }, isPending: () => false, perform: async () => {} } as unknown as WorkspaceContext;
  const interaction = { id: 'interaction', attemptId: 'attempt', request } as Interaction;
  return renderToStaticMarkup(createElement(Workspace.Provider, { value: context }, createElement(InteractionCard, { interaction })));
}

test('English runtime interactions localize the OpenCode permission wrapper while preserving supplied content', async () => {
  await setLocale('en');
  try {
    const request = { kind: 'permission', prompt: { toolName: 'bash', hint: '允许执行 bash：echo 用户原文', args: { command: 'echo 用户原文' } } };
    const english = render(request, 'opencode');
    assert.match(english, /Allow bash: echo 用户原文/);
    assert.match(english, /echo 用户原文/);
    assert.match(render(request, 'maka'), /允许执行 bash：echo 用户原文/);
    const question = render({ kind: 'question', questions: [{ question: '运行详情', options: ['拒绝'] }] }, 'opencode');
    assert.match(question, /运行详情/);
    assert.match(question, />拒绝<\/button>/);
    assert.match(question, /Submit answers/);
  } finally { await setLocale('zh-CN'); }
});

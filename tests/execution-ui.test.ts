import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Attempt, NodeRun, WorkflowRun } from '../packages/domain/index.ts';
import { defaultWorkflow } from '../packages/domain/index.ts';
import { ExecutionFacts, usageValue } from '../apps/web/src/ExecutionFacts.tsx';
import { AutomationControls, automationReason } from '../apps/web/src/AutomationControls.tsx';
import { getLocale, setLocale } from '../apps/web/src/i18n.ts';
import { englishMessages } from '../packages/i18n/index.ts';

const attempt = { id: 'attempt', target: { backend: 'opencode' }, usageSummary: { inputTokens: 120, outputTokens: null, costUsd: null, known: { inputTokens: 120, outputTokens: 0, costUsd: 0 }, unknownCounts: { inputTokens: 1, outputTokens: 2, costUsd: 2 }, completeness: 'partial', executions: 2, meters: 2 }, stopReason: 'user_cancelled', stopRequestedAt: '2026-10-27T00:00:00Z' } as Attempt;

test('shared execution facts preserve unknown totals and unconfirmed stop semantics in both UI variants', async () => {
  const before = getLocale();
  try {
    await setLocale('en');
    assert.equal(usageValue(attempt, 'inputTokens'), '120 + 1 unknown measurements');
    assert.equal(usageValue(attempt, 'outputTokens'), 'Unknown');
    assert.equal(usageValue(attempt, 'costUsd'), 'Unknown');
    for (const compact of [false, true]) {
      const markup = renderToStaticMarkup(createElement(ExecutionFacts, { attempt, compact }));
      assert.match(markup, /Requesting a stop/);
      assert.doesNotMatch(markup, /Terminal state confirmed/);
      assert.doesNotMatch(markup, /\$0/);
      assert.doesNotMatch(markup, /\p{Script=Han}/u);
    }
  } finally { await setLocale(before); }
});

test('automatic repair is opt-in and unavailable on human acceptance nodes or stale inputs', async () => {
  const before = getLocale();
  try {
    await setLocale('en');
    const workflowRun = { id: 'run', revision: 1, state: 'active', definition: defaultWorkflow('en') } as WorkflowRun;
    const node = { id: 'node', type: 'human', execution: 'completed', currentAttemptId: 'attempt', freshness: 'fresh', gate: 'blocked' } as NodeRun;
    let dispatched = false;
    for (const compact of [false, true]) {
      const markup = renderToStaticMarkup(createElement(AutomationControls, { workflowRun, node, compact, onCommand: () => { dispatched = true; } }));
      assert.match(markup, /Allow bounded repair during progression/);
      assert.doesNotMatch(markup, /checked=""/);
      assert.match(markup, /<button[^>]*disabled=""[^>]*>Repair the current artifact/);
      assert.doesNotMatch(markup, /\p{Script=Han}/u);
    }
    assert.equal(dispatched, false);
    assert.equal(automationReason('artifact_acceptance_required'), 'Waiting for human acceptance');
    assert.ok(englishMessages['自动化操作已提交']);
  } finally { await setLocale(before); }
});

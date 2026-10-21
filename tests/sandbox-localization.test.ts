import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultWorkflow, parseTasks } from '../packages/domain/index.ts';
import type { FrozenInput, StageOutput } from '../packages/execution-contract/index.ts';
import { createReviewCriteria } from '../packages/review-policy/index.ts';
import { SandboxBackend, sandboxTargets } from '../packages/specflow-core/sandbox-backend.ts';

function input(workspace: string, nodeId: string, locale: FrozenInput['locale'] = 'en'): FrozenInput {
  const node = defaultWorkflow(locale).nodes.find(node => node.id === nodeId)!;
  return { locale, workspace, node, attemptId: `${nodeId}-${locale}`, prompt: node.prompt, target: sandboxTargets[0], readOnly: true, maxSteps: 40, inputHash: 'frozen-input', artifacts: [] };
}

async function execute(backend: SandboxBackend, source: FrozenInput): Promise<StageOutput> {
  const ref = await backend.prepare(source);
  const snapshot = await backend.start(ref, source);
  assert.equal(snapshot.state, 'completed');
  return JSON.parse(snapshot.output!);
}

test('English demo attempts produce English documents and briefs with stable task and requirement IDs', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'specflow-sandbox-locale-'));
  try {
    const backend = new SandboxBackend();
    const outputs = await Promise.all(['specify', 'plan', 'tasks', 'implement', 'converge'].map(nodeId => execute(backend, input(workspace, nodeId))));
    for (const output of outputs) {
      assert.doesNotMatch(JSON.stringify(output), /\p{Script=Han}/u);
      assert.ok(output.artifacts[0].humanBrief?.sections.length);
    }
    assert.match(outputs[0].artifacts[0].content, /FR01.*\n.*FR02.*\n.*FR03.*\n.*FR04/);
    assert.equal(parseTasks(outputs[2].artifacts[0].content)[0].taskId, 'T001');
    assert.match(await readFile(join(workspace, 'csv.js'), 'utf8'), /export function parseCsv/);
    const legacy = await execute(backend, input(workspace, 'specify', 'zh-CN'));
    assert.match(legacy.artifacts[0].content, /CSV 导入需求规格/);
    assert.match(legacy.artifacts[0].humanBrief!.title, /需求规格/);
  } finally { await rm(workspace, { recursive: true, force: true }); }
});

test('English clarification preserves original specification content and user answers verbatim', async () => {
  const backend = new SandboxBackend(), source = input('', 'clarify');
  const original = '# User content\n保留原文 {value2}';
  source.artifacts = [{ logicalId: 'spec', content: original, contentHash: 'source' }];
  const questions = (await execute(backend, source)).clarification!.questions;
  assert.doesNotMatch(JSON.stringify(questions), /\p{Script=Han}/u);
  const answer = '按用户原文处理 ${value1}';
  source.attemptId += '-answers';
  source.clarification = { questions: questions.map(question => ({ ...question, answer })) };
  const result = await execute(backend, source);
  assert.ok(result.artifacts[0].content.startsWith(original));
  assert.ok(result.artifacts[0].content.includes(answer));
  assert.match(result.artifacts[0].content, /## Confirmed decisions/);
  assert.doesNotMatch(JSON.stringify(result.artifacts[0].humanBrief), /\p{Script=Han}/u);
});

test('English review explains the fixture in English and preserves quoted evidence', async () => {
  const backend = new SandboxBackend(), source = input('', 'review-spec');
  const evidence = '用户原始依据 FR01';
  source.review = { version: 1, groupId: 'group', perspective: 'coverage', subjects: [], sources: [{ id: 'requirements', kind: 'requirement', content: evidence }], criteria: createReviewCriteria(['spec'], true), priorFindings: [] };
  const result = await execute(backend, source);
  assert.doesNotMatch(result.review!.summary, /\p{Script=Han}/u);
  for (const check of result.review!.checks) {
    assert.doesNotMatch(check.explanation, /\p{Script=Han}/u);
    assert.doesNotMatch(check.counterexample.scenario + check.counterexample.reason, /\p{Script=Han}/u);
    assert.equal(check.evidence[0].quote, evidence);
  }
});

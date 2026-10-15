import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewArtifactSources } from '../apps/server/src/reviews.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { DomainError, hash, type ExecutionRef, type HumanBrief } from '../packages/domain/index.ts';
import type { FrozenInput, StageOutput } from '../packages/execution-contract/index.ts';
import { createReviewCriteria, reviewInstructions, reviewPassed, validateReviewReport, type ReviewContext, type ReviewReport } from '../packages/review-policy/index.ts';
import { clarifySpec, fixture, runNode } from './helpers.ts';

const content = '# 导入执行契约\n\nFR001：重复记录返回 DUPLICATE_RECORD，保留原记录。\n\nAC001：重复记录需要验证；当前尚未执行测试。\n';
const brief: HumanBrief = { title: '导入阅读简报', summary: '重复记录会返回错误，验证仍待执行。', sections: [{ title: '边界与状态', items: ['重复记录保留原值。', '测试尚未执行。'] }] };

function reviewFixture() {
  const context: ReviewContext = {
    version: 1, groupId: 'brief-review-group', perspective: 'coverage',
    subjects: [{ logicalId: 'spec', artifactRevisionId: 'spec-revision', contentHash: hash(content) }],
    sources: [
      { id: 'requirement:request', kind: 'requirement', content: '重复导入时不得覆盖原记录，必须返回明确错误。' },
      { id: 'artifact:spec-revision', kind: 'artifact', content },
      { id: 'human-brief:spec-revision', kind: 'human_brief', content: JSON.stringify({ sourceContentHash: hash(content), humanBrief: brief }) },
      { id: 'artifact:upstream-revision', kind: 'artifact', content: '上游约束：所有重复记录错误均保留原记录内容。' },
      { id: 'human-brief:upstream-revision', kind: 'human_brief', content: '上游阅读简报：重复记录错误保留原记录。' },
    ],
    criteria: createReviewCriteria(['spec'], true), priorFindings: [],
  };
  const evidence = context.sources.map(source => ({ sourceId: source.id, quote: source.content }));
  const report: ReviewReport = {
    version: 1, groupId: context.groupId, perspective: context.perspective, verdict: 'pass', summary: '逐份核对简报和正文，未发现新增行为或虚假成功声明。',
    checks: context.criteria.map(criterion => ({ criterionId: criterion.id, result: 'pass', explanation: '正文与简报均明确重复记录返回错误并保留原值，验证尚未执行。', evidence: structuredClone(evidence), counterexample: { scenario: '重复导入已有 ID 的记录，检查简报是否声称会覆盖或测试已成功。', outcome: 'ruled_out', reason: '比对正文和简报，均未声明覆盖原值或测试已执行。' } })),
    resolutions: [],
  };
  return { context, report };
}

test('复核材料仅添加与正文哈希绑定且结构有效的作者简报', async () => {
  const f = await fixture();
  try {
    const revision = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const input = { logicalId: 'memo', artifactRevisionId: revision.id, contentHash: revision.contentHash };
    const sources = reviewArtifactSources(f.store, [input]);
    assert.deepEqual(sources, [
      { id: `artifact:${revision.id}`, kind: 'artifact', content },
      { id: `human-brief:${revision.id}`, kind: 'human_brief', content: JSON.stringify({ sourceContentHash: hash(content), humanBrief: brief }) },
    ]);
    f.store.update('artifactRevisions', revision.id, { humanBriefSourceHash: hash('另一版正文') });
    assert.deepEqual(reviewArtifactSources(f.store, [input]), sources.slice(0, 1));
    f.store.update('artifactRevisions', revision.id, { humanBriefSourceHash: revision.contentHash, humanBrief: { ...brief, title: '' } });
    assert.deepEqual(reviewArtifactSources(f.store, [input]), sources.slice(0, 1));
    f.store.update('artifactRevisions', revision.id, { humanBrief: undefined });
    assert.deepEqual(reviewArtifactSources(f.store, [input]), sources.slice(0, 1));
  } finally { await f.cleanup(); }
});

test('简报一致性准则必须逐份同时引用简报与对应正文，其他准则的引用不能替代', () => {
  const { context, report } = reviewFixture();
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), true);
  for (const sourceId of ['human-brief:spec-revision', 'artifact:spec-revision', 'human-brief:upstream-revision', 'artifact:upstream-revision']) {
    const missing = structuredClone(report);
    missing.checks.find(check => check.criterionId === 'human_brief_consistency')!.evidence = missing.checks.find(check => check.criterionId === 'human_brief_consistency')!.evidence.filter(evidence => evidence.sourceId !== sourceId);
    assert.throws(() => validateReviewReport(context, missing), error => error instanceof DomainError && error.code === 'OUTPUT_INVALID' && /同时引用/.test(error.message));
  }
  const withoutCriterion = structuredClone(context), withoutCheck = structuredClone(report);
  withoutCriterion.criteria = createReviewCriteria(['spec']);
  withoutCheck.checks = withoutCheck.checks.filter(check => check.criterionId !== 'human_brief_consistency');
  assert.throws(() => validateReviewReport(withoutCriterion, withoutCheck), /一致性检查/);
  const orphan = structuredClone(context);
  orphan.sources[2].id = 'human-brief:unrelated-revision';
  const orphanReport = structuredClone(report);
  for (const check of orphanReport.checks) for (const evidence of check.evidence) if (evidence.sourceId === 'human-brief:spec-revision') evidence.sourceId = 'human-brief:unrelated-revision';
  assert.throws(() => validateReviewReport(orphan, orphanReport), /缺少对应的正文/);
});

test('新增协议示例包含逐份正文和简报引用，历史无简报上下文保留原准则', () => {
  const { context } = reviewFixture();
  const instructions = reviewInstructions(context);
  assert.match(instructions, /虚假成功声明/);
  const output = JSON.parse(instructions.slice(instructions.lastIndexOf('\n\n{') + 2));
  assert.equal(reviewPassed(context, validateReviewReport(context, output.review)), false);
  assert.equal(createReviewCriteria(['spec']).length, 4);
  assert.equal(createReviewCriteria(['spec'], true).length, 5);
});

class BriefReviewBackend extends SandboxBackend {
  capturedInputs: FrozenInput[] = [];
  constructor(readonly mode: 'pass' | 'omit' | 'contradiction') { super(); }
  override async start(ref: ExecutionRef, input: FrozenInput) {
    this.capturedInputs.push(structuredClone(input));
    const snapshot = await super.start(ref, input);
    if (!input.review) return snapshot;
    const output = JSON.parse(snapshot.output!) as StageOutput;
    const check = output.review!.checks.find(item => item.criterionId === 'human_brief_consistency')!;
    assert.ok(check);
    if (this.mode === 'omit') check.evidence = check.evidence.filter(evidence => !evidence.sourceId.startsWith('human-brief:'));
    if (this.mode === 'contradiction') {
      check.result = 'fail';
      check.explanation = '简报声称测试全部通过，正文仍声明测试尚未执行。';
      check.counterexample = { scenario: '人类依据简报接纳未经验证的实现。', outcome: 'reproduced', reason: '完整正文与简报的验证状态矛盾。' };
      output.review!.verdict = 'revise';
      output.review!.summary = check.explanation;
    }
    snapshot.output = JSON.stringify(output);
    return snapshot;
  }
}

test('双视角复核收到简报和额外准则，执行产物数组仍只包含严谨正文', async () => {
  const f = await fixture(), backend = new BriefReviewBackend('pass');
  try {
    await runNode(f, 'specify'); await clarifySpec(f);
    f.service.backends.sandbox = backend;
    const node = await runNode(f, 'review-spec');
    assert.equal(node.gate, 'passed', node.error);
    assert.equal(backend.capturedInputs.length, 2);
    for (const input of backend.capturedInputs) {
      const revision = f.store.get('artifactRevisions', input.review!.subjects[0].artifactRevisionId);
      const briefSource = input.review!.sources.find(source => source.id === `human-brief:${revision.id}` && source.kind === 'human_brief');
      assert.ok(briefSource);
      assert.ok(input.review!.criteria.some(criterion => criterion.id === 'human_brief_consistency'));
      assert.ok(input.prompt.includes(JSON.stringify(briefSource.content)));
      assert.deepEqual(input.artifacts, [{ logicalId: 'spec', content: revision.content, contentHash: revision.contentHash }]);
    }
    assert.deepEqual(backend.capturedInputs[0].review!.sources, backend.capturedInputs[1].review!.sources);
  } finally { await f.cleanup(); }
});

test('漏掉简报比较证据或发现与正文矛盾时，当前产物无法获得复核认证', async t => {
  for (const mode of ['omit', 'contradiction'] as const) await t.test(mode, async () => {
    const f = await fixture();
    try {
      await runNode(f, 'specify'); await clarifySpec(f);
      const artifact = f.store.list('artifacts', item => item.logicalId === 'spec')[0];
      if (mode === 'contradiction') {
        const revision = f.store.get('artifactRevisions', artifact.currentRevisionId);
        f.store.update('artifactRevisions', revision.id, { content: revision.content + '\n验证状态：测试尚未执行。\n', contentHash: hash(revision.content + '\n验证状态：测试尚未执行。\n') });
        const current = f.store.get('artifactRevisions', revision.id);
        f.store.update('artifactRevisions', revision.id, { humanBriefSourceHash: current.contentHash, humanBrief: { ...brief, summary: '测试全部通过。' } });
      }
      f.service.backends.sandbox = new BriefReviewBackend(mode);
      const node = await runNode(f, 'review-spec');
      assert.equal(node.gate, 'blocked');
      const current = f.store.get('artifactRevisions', artifact.currentRevisionId);
      assert.equal(current.reviewed, false);
      assert.equal(current.reviewGroupId, undefined);
      if (mode === 'omit') assert.match(node.error!, /同时引用/);
      else assert.ok(f.store.list('findings').some(finding => finding.location === 'human_brief_consistency' && finding.severity === 'blocker'));
      const latest = f.store.get('artifacts', artifact.id);
      await assert.rejects(f.service.acceptArtifact(latest.id, latest.revision), /复核|阻塞/);
    } finally { await f.cleanup(); }
  });
});

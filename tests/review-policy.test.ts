import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../packages/domain/index.ts';
import { createReviewCriteria, reviewInstructions, reviewPassed, validateReviewReport, type ReviewContext, type ReviewReport } from '../packages/review-policy/index.ts';

function fixture(): { context: ReviewContext; report: ReviewReport } {
  const context: ReviewContext = {
    version: 1, groupId: 'spec-review-2', perspective: 'coverage',
    subjects: [{ logicalId: 'spec', artifactRevisionId: 'spec-r2', contentHash: 'spec-current-hash' }],
    sources: [
      { id: 'request', kind: 'requirement', content: '用户必须能够导出完整记录。' },
      { id: 'attachment:export-rules', kind: 'requirement', content: '导出结果必须保留中文名称。' },
      { id: 'artifact:spec-r2', kind: 'artifact', content: '导出完整记录，包含中文名称并保留原始编码。' },
    ],
    criteria: createReviewCriteria(['spec']),
    priorFindings: [{ id: 'missing-chinese-names', targetLogicalId: 'spec', body: '导出未保留中文名称', location: '导出验收条件', severity: 'blocker', targetHash: 'spec-previous-hash' }],
  };
  const evidence = context.sources.map(source => ({ sourceId: source.id, quote: source.content }));
  const report: ReviewReport = {
    version: 1, groupId: context.groupId, perspective: context.perspective, verdict: 'pass', summary: '本次规格明确覆盖完整记录和中文名称导出。',
    checks: context.criteria.map(criterion => ({
      criterionId: criterion.id, result: 'pass', explanation: '由原始导出要求重建验收条件，再对照当前规格检查中文名称是否保留。', evidence,
      counterexample: { scenario: '含中文名称的记录导出后名称被编码替换。', outcome: 'ruled_out', reason: '当前规格明确要求保留中文名称和原始编码，验收条件包含该场景。' },
    })),
    resolutions: [{ findingId: 'missing-chinese-names', result: 'fixed', evidence: [evidence[2]], explanation: '当前规格已明确保留中文名称和原始编码，覆盖原问题的失效场景。' }],
  };
  return { context, report };
}

function assertInvalid(context: ReviewContext, report: unknown) {
  assert.throws(() => validateReviewReport(context, report), error => error instanceof DomainError && error.code === 'OUTPUT_INVALID');
}

test('有效的完整审核报告才可通过；解析不会修改被冻结的报告', () => {
  const { context, report } = fixture();
  const original = structuredClone(report);
  const valid = validateReviewReport(context, report);
  assert.equal(reviewPassed(context, valid), true);
  assert.deepEqual(report, original);
});

test('无法确认的检查可以记录为有效报告，但不会放行', () => {
  const { context, report } = fixture();
  report.verdict = 'inconclusive';
  report.checks[3].result = 'unknown';
  report.checks[3].counterexample.outcome = 'not_checked';
  report.checks[3].counterexample.reason = '尚无实际执行结果可以核对该验收场景。';
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), false);
  report.verdict = 'pass';
  assertInvalid(context, report);
});

test('失败的反例要求修订，不能以通过结论覆盖', () => {
  const { context, report } = fixture();
  report.checks[0].result = 'fail';
  report.checks[0].counterexample.outcome = 'reproduced';
  report.checks[0].counterexample.reason = '原始需求与当前产物的行为不一致。';
  report.verdict = 'revise';
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), false);
  report.verdict = 'pass';
  assertInvalid(context, report);
});

test('伪造、空泛或跨批次的材料不能作为有效证据', () => {
  for (const mutate of [
    (report: ReviewReport) => { report.checks[0].evidence[0].quote = '当前原始需求中不存在的引文。'; },
    (report: ReviewReport) => { report.checks[0].evidence[0].quote = '通过'; },
    (report: ReviewReport) => { report.checks[0].evidence[0].sourceId = 'artifact:spec-r1'; },
    (report: ReviewReport) => { report.groupId = 'old-review'; },
    (report: ReviewReport) => { report.perspective = 'adversarial'; },
  ]) {
    const { context, report } = fixture();
    mutate(report);
    assertInvalid(context, report);
  }
});

test('每份原始需求附件与每个当前审核对象都必须有引用', () => {
  for (const missingSource of ['request', 'attachment:export-rules', 'artifact:spec-r2']) {
    const { context, report } = fixture();
    for (const check of report.checks) check.evidence = check.evidence.filter(evidence => evidence.sourceId !== missingSource);
    // A historical finding resolution cannot replace a missing check of the subject.
    assertInvalid(context, report);
  }
});

test('准则不能遗漏、重复或使用未授权的替代项', () => {
  for (const mutate of [
    (report: ReviewReport) => { report.checks.pop(); },
    (report: ReviewReport) => { report.checks[1].criterionId = report.checks[0].criterionId; },
    (report: ReviewReport) => { report.checks[0].criterionId = 'author_says_done'; },
  ]) {
    const { context, report } = fixture();
    mutate(report);
    assertInvalid(context, report);
  }
});

test('旧阻塞问题不能因换版本、遗漏或声称修复而消失', () => {
  for (const mutate of [
    (report: ReviewReport) => { report.resolutions = []; },
    (report: ReviewReport) => { report.resolutions.push(structuredClone(report.resolutions[0])); },
    (report: ReviewReport) => { report.resolutions[0].findingId = 'invented-finding'; },
    (report: ReviewReport) => { report.resolutions[0].result = 'open'; },
    (report: ReviewReport) => { report.resolutions[0].result = 'unknown'; },
    (report: ReviewReport) => { report.resolutions[0].evidence = []; },
    (report: ReviewReport) => { report.resolutions[0].evidence = [report.checks[0].evidence[0]]; },
  ]) {
    const { context, report } = fixture();
    mutate(report);
    assertInvalid(context, report);
  }
});

test('明确保留的 warning 可以通过，unknown warning 仍须阻塞', () => {
  const { context, report } = fixture();
  context.priorFindings[0].severity = 'warning';
  report.resolutions[0].result = 'open';
  report.resolutions[0].evidence = [];
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), true);
  report.resolutions[0].result = 'unknown';
  assertInvalid(context, report);
  report.verdict = 'inconclusive';
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), false);
});

test('代码审核必须同时引用实际代码、验证材料和修复代码', () => {
  const { context, report } = fixture();
  const code = { id: 'code:patch', kind: 'code' as const, content: '实际补丁在导出记录时保留中文名称和原始编码。' };
  const verification = { id: 'verification:export-tests', kind: 'verification' as const, content: '中文名称导出测试已执行，退出码为零。' };
  context.sources.push(code, verification);
  assertInvalid(context, report);
  report.checks[0].evidence.push({ sourceId: code.id, quote: code.content });
  assertInvalid(context, report);
  report.checks[0].evidence.push({ sourceId: verification.id, quote: verification.content });
  assertInvalid(context, report);
  report.resolutions[0].evidence.push({ sourceId: code.id, quote: code.content });
  assert.equal(reviewPassed(context, validateReviewReport(context, report)), true);
});

test('提示词要求独立重建预期，并提供显式 findings 的 StageOutput JSON', () => {
  const { context } = fixture();
  const instructions = reviewInstructions(context);
  assert.match(instructions, /全新会话/);
  assert.match(instructions, /不读取另一审核视角的结论/);
  assert.match(instructions, /原始需求正文与每份附件/);
  const output = JSON.parse(instructions.slice(instructions.lastIndexOf('\n\n{') + 2));
  assert.deepEqual(output.artifacts, []);
  assert.deepEqual(output.findings, []);
  assert.equal(output.review.groupId, context.groupId);
  assert.equal(output.review.verdict, 'inconclusive');
  assert.equal(reviewPassed(context, validateReviewReport(context, output.review)), false);
  context.perspective = 'adversarial';
  assert.match(reviewInstructions(context), /主动尝试推翻产物结论/);
});

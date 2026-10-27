import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { evaluateTrials, parseEvaluationDataset, type EvaluationDataset } from '../packages/specflow-core/evaluation.ts';
import { execute } from '../packages/verification-runner/index.ts';

const fixturePath = resolve('tests/fixtures/agent-eval.json');
async function data(): Promise<EvaluationDataset> { return JSON.parse(await readFile(fixturePath, 'utf8')); }

test('evaluation requires an independent oracle for the exact result, not internal review success', async () => {
  const report = evaluateTrials(await data());
  assert.equal(report.total.trials, 6); assert.equal(report.total.successes, 1); assert.equal(report.total.successRate, 1 / 6);
  assert.equal(report.total.statusCounts.timeout, 1); assert.equal(report.total.statusCounts.unknown, 1);
  assert.equal(report.cohorts.find(cohort => cohort.baseline)!.successRate, 1 / 3);
  assert.equal(report.trials.find(trial => trial.trialId === 'fixture-baseline-fail')!.success, false, 'review pass does not override held-out failure');
  assert.equal(report.trials.find(trial => trial.trialId === 'fixture-policy-model-only')!.oracleQualified, false);
  assert.equal(report.trials.find(trial => trial.trialId === 'fixture-policy-wrong-hash')!.success, false);
  assert.equal(report.sourceKind, 'fixture'); assert.match(report.measurementNotice, /not measured/);
});

test('unknown cost and tokens stay missing while known portions and all trial durations remain visible', async () => {
  const report = evaluateTrials(await data()), baseline = report.cohorts.find(cohort => cohort.baseline)!;
  assert.equal(baseline.usage.costUsd.total, null); assert.ok(Math.abs(baseline.usage.costUsd.knownTotal - 0.3) < 1e-12);
  assert.equal(baseline.usage.costUsd.reportedTrials, 2); assert.equal(baseline.usage.costUsd.missingTrials, 1);
  assert.equal(report.total.usage.costUsd.missingTrials, 4);
  assert.equal(report.total.usage.inputTokens.knownTotal, 60); assert.equal(report.total.usage.inputTokens.missingTrials, 2);
  assert.equal(baseline.durationMs.allTrials.total, 1300); assert.equal(baseline.durationMs.successfulTrials.total, 100);
  assert.equal(report.total.durationMs.allTrials.missingTrials, 1);
});

test('changes to model, harness, version or policy form distinct cohorts and task versions stay separate', async () => {
  const input = await data();
  input.trials[1].provenance.model.id = 'another-model';
  input.trials[2].taskVersion = 'another-task-revision';
  const report = evaluateTrials(input);
  assert.equal(report.cohorts.length, 3);
  const baseline = report.cohorts.find(cohort => cohort.baseline && cohort.provenance.model.id === 'no-real-model')!;
  assert.equal(baseline.tasks.length, 2);
  assert.equal(report.statistics, 'descriptive-only'); assert.match(report.comparisonNotice, /no causal improvement/);
});

test('independence, evidence and completed execution are all necessary for a successful trial', async () => {
  for (const patch of [
    (trial: EvaluationDataset['trials'][number]) => { trial.oracle.independent = false; },
    (trial: EvaluationDataset['trials'][number]) => { trial.oracle.evidenceRefs = []; },
    (trial: EvaluationDataset['trials'][number]) => { trial.oracle.taskVersion = 'older-task-version'; },
    (trial: EvaluationDataset['trials'][number]) => { trial.status = 'failed'; },
  ]) {
    const input = await data(); patch(input.trials[0]);
    assert.equal(evaluateTrials(input).total.successes, 0);
  }
});

test('invalid or duplicate records reject the dataset rather than shrinking the denominator', async () => {
  const input = await data(); input.trials.push(structuredClone(input.trials[0]));
  assert.throws(() => parseEvaluationDataset(input), /duplicate trial ID/);
  const malformed = await data(); malformed.trials[1].usage.modelCalls = 1.5;
  assert.throws(() => parseEvaluationDataset(malformed), /modelCalls/);
  const baseline = await data(); baseline.baselineVariant = 'missing';
  assert.throws(() => parseEvaluationDataset(baseline), /baseline has no trials/);
});

test('evaluation CLI writes a fixture-labelled report and refuses to overwrite the original records', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'specflow-eval-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, 'report.json'), original = await readFile(fixturePath, 'utf8');
  const result = await execute('node', ['scripts/agent-eval.mjs', '--input', fixturePath, '--output', output], resolve('.'));
  assert.equal(result.exitCode, 0, result.stderr);
  const report = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(report.sourceKind, 'fixture'); assert.equal(report.total.trials, 6); assert.equal(report.total.successes, 1);
  const blocked = await execute('node', ['scripts/agent-eval.mjs', '--input', fixturePath, '--output', fixturePath], resolve('.'));
  assert.notEqual(blocked.exitCode, 0); assert.match(blocked.stderr, /must not overwrite/);
  assert.equal(await readFile(fixturePath, 'utf8'), original);
});

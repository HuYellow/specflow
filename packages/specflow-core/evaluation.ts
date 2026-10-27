/** Offline evaluation of recorded trials. This module does not execute or grade a model. */
export type TrialStatus = 'completed' | 'failed' | 'timeout' | 'cancelled' | 'unknown';
export interface EvaluationTrial {
  trialId: string;
  taskId: string;
  taskVersion: string;
  variant: string;
  provenance: {
    specflowVersion: string;
    harness: { id: string; version: string };
    model: { provider: string; id: string };
    policyHash: string;
  };
  status: TrialStatus;
  resultHash: string | null;
  oracle: {
    taskVersion: string;
    kind: 'deterministic' | 'human' | 'model';
    independent: boolean;
    verdict: 'pass' | 'fail' | 'unassessed';
    resultHash: string | null;
    evidenceRefs: string[];
  };
  reviewVerdict?: 'pass' | 'fail' | 'unassessed';
  durationMs: number | null;
  usage: { modelCalls: number | null; inputTokens: number | null; outputTokens: number | null; costUsd: number | null };
  humanInterventions: number | null;
}
export interface EvaluationDataset {
  schemaVersion: 1;
  sourceKind: 'fixture' | 'recorded';
  baselineVariant: string;
  trials: EvaluationTrial[];
}
const statuses = ['completed', 'failed', 'timeout', 'cancelled', 'unknown'] as const;
const verdicts = ['pass', 'fail', 'unassessed'] as const;
function check(condition: unknown, path: string, message: string): asserts condition {
  if (!condition) throw new Error(`EVAL_INPUT_INVALID ${path}: ${message}`);
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function text(value: unknown, path: string) { check(typeof value === 'string' && value.trim().length > 0, path, 'expected a non-empty string'); }
function optionalHash(value: unknown, path: string) { check(value === null || (typeof value === 'string' && value.trim().length > 0), path, 'expected a result hash or null'); }
function metric(value: unknown, path: string, integer = false) { check(value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && (!integer || Number.isSafeInteger(value))), path, 'expected a non-negative number or null'); }

/** Invalid records reject the dataset; they are never silently removed from the denominator. */
export function parseEvaluationDataset(value: unknown): EvaluationDataset {
  check(object(value), 'dataset', 'expected an object');
  check(value.schemaVersion === 1, 'schemaVersion', 'unsupported dataset version');
  check(value.sourceKind === 'fixture' || value.sourceKind === 'recorded', 'sourceKind', 'declare fixture or recorded');
  text(value.baselineVariant, 'baselineVariant');
  check(Array.isArray(value.trials) && value.trials.length > 0, 'trials', 'expected at least one trial');
  const ids = new Set<string>();
  for (const [index, trial] of value.trials.entries()) {
    const path = `trials[${index}]`;
    check(object(trial), path, 'expected an object');
    for (const key of ['trialId', 'taskId', 'taskVersion', 'variant']) text(trial[key], `${path}.${key}`);
    check(!ids.has(trial.trialId as string), `${path}.trialId`, 'duplicate trial ID'); ids.add(trial.trialId as string);
    check(object(trial.provenance), `${path}.provenance`, 'expected version, harness, model and policy identity');
    text(trial.provenance.specflowVersion, `${path}.provenance.specflowVersion`); text(trial.provenance.policyHash, `${path}.provenance.policyHash`);
    check(object(trial.provenance.harness), `${path}.provenance.harness`, 'expected harness identity');
    text(trial.provenance.harness.id, `${path}.provenance.harness.id`); text(trial.provenance.harness.version, `${path}.provenance.harness.version`);
    check(object(trial.provenance.model), `${path}.provenance.model`, 'expected model identity');
    text(trial.provenance.model.provider, `${path}.provenance.model.provider`); text(trial.provenance.model.id, `${path}.provenance.model.id`);
    check(statuses.includes(trial.status as TrialStatus), `${path}.status`, 'unsupported execution outcome');
    optionalHash(trial.resultHash, `${path}.resultHash`);
    check(object(trial.oracle), `${path}.oracle`, 'expected an independently recorded assessment');
    text(trial.oracle.taskVersion, `${path}.oracle.taskVersion`);
    check(['deterministic', 'human', 'model'].includes(trial.oracle.kind as string), `${path}.oracle.kind`, 'unsupported oracle kind');
    check(typeof trial.oracle.independent === 'boolean', `${path}.oracle.independent`, 'expected a boolean');
    check(verdicts.includes(trial.oracle.verdict as typeof verdicts[number]), `${path}.oracle.verdict`, 'unsupported verdict');
    optionalHash(trial.oracle.resultHash, `${path}.oracle.resultHash`);
    check(Array.isArray(trial.oracle.evidenceRefs), `${path}.oracle.evidenceRefs`, 'expected evidence references');
    for (const [i, reference] of trial.oracle.evidenceRefs.entries()) text(reference, `${path}.oracle.evidenceRefs[${i}]`);
    if (trial.reviewVerdict !== undefined) check(verdicts.includes(trial.reviewVerdict as typeof verdicts[number]), `${path}.reviewVerdict`, 'unsupported verdict');
    metric(trial.durationMs, `${path}.durationMs`); metric(trial.humanInterventions, `${path}.humanInterventions`, true);
    check(object(trial.usage), `${path}.usage`, 'expected explicit known or unknown counters');
    for (const key of ['modelCalls', 'inputTokens', 'outputTokens', 'costUsd']) metric(trial.usage[key], `${path}.usage.${key}`, key !== 'costUsd');
  }
  check(value.trials.some(trial => trial.variant === value.baselineVariant), 'baselineVariant', 'the named baseline has no trials');
  return value as unknown as EvaluationDataset;
}

function qualifiedOracle(trial: EvaluationTrial) {
  return trial.oracle.kind !== 'model' && trial.oracle.independent && trial.oracle.evidenceRefs.length > 0 && trial.oracle.taskVersion === trial.taskVersion && trial.resultHash !== null && trial.oracle.resultHash === trial.resultHash;
}
function success(trial: EvaluationTrial) { return trial.status === 'completed' && qualifiedOracle(trial) && trial.oracle.verdict === 'pass'; }
function summarizeMetric(values: (number | null)[]) {
  const known = values.filter((value): value is number => value !== null), knownTotal = known.reduce((total, value) => total + value, 0);
  check(Number.isFinite(knownTotal), 'metrics', 'aggregate exceeds finite numeric range');
  return { total: known.length === values.length && values.length ? knownTotal : null, knownTotal, reportedTrials: known.length, missingTrials: values.length - known.length, meanOfReported: known.length ? knownTotal / known.length : null };
}
function distribution(values: (number | null)[]) {
  const sorted = values.filter((value): value is number => value !== null).sort((a, b) => a - b);
  const percentile = (fraction: number) => sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] : null;
  return { ...summarizeMetric(values), p50: percentile(0.5), p95: percentile(0.95) };
}
function summarize(trials: EvaluationTrial[]) {
  const successful = trials.filter(success);
  return {
    trials: trials.length,
    successes: successful.length,
    nonSuccesses: trials.length - successful.length,
    successRate: trials.length ? successful.length / trials.length : null,
    statusCounts: Object.fromEntries(statuses.map(status => [status, trials.filter(trial => trial.status === status).length])) as Record<TrialStatus, number>,
    oracle: { qualifiedPasses: trials.filter(trial => qualifiedOracle(trial) && trial.oracle.verdict === 'pass').length, qualifiedFailures: trials.filter(trial => qualifiedOracle(trial) && trial.oracle.verdict === 'fail').length, unassessedOrUnqualified: trials.filter(trial => !qualifiedOracle(trial) || trial.oracle.verdict === 'unassessed').length },
    durationMs: { allTrials: distribution(trials.map(trial => trial.durationMs)), successfulTrials: distribution(successful.map(trial => trial.durationMs)) },
    usage: {
      modelCalls: summarizeMetric(trials.map(trial => trial.usage.modelCalls)),
      inputTokens: summarizeMetric(trials.map(trial => trial.usage.inputTokens)),
      outputTokens: summarizeMetric(trials.map(trial => trial.usage.outputTokens)),
      costUsd: summarizeMetric(trials.map(trial => trial.usage.costUsd)),
    },
    humanInterventions: summarizeMetric(trials.map(trial => trial.humanInterventions)),
  };
}

export function evaluateTrials(input: unknown) {
  const dataset = parseEvaluationDataset(input);
  const groups = new Map<string, EvaluationTrial[]>();
  for (const trial of dataset.trials) {
    const p = trial.provenance;
    const key = JSON.stringify([trial.variant, p.specflowVersion, p.harness.id, p.harness.version, p.model.provider, p.model.id, p.policyHash]);
    groups.set(key, [...(groups.get(key) || []), trial]);
  }
  return {
    schemaVersion: 1,
    sourceKind: dataset.sourceKind,
    baselineVariant: dataset.baselineVariant,
    statistics: 'descriptive-only',
    evidenceValidation: 'references-and-hash-binding-only',
    measurementNotice: dataset.sourceKind === 'fixture' ? 'Synthetic fixture records; this is not measured model performance.' : 'Summarizes supplied trial records; evidence content and grading correctness require independent verification.',
    comparisonNotice: 'Cohorts with different versions, harnesses, models or policies remain separate. Compare only matched task versions and budgets; no causal improvement is inferred.',
    total: summarize(dataset.trials),
    cohorts: [...groups.values()].map(trials => {
      const taskGroups = new Map<string, EvaluationTrial[]>();
      for (const trial of trials) { const key = JSON.stringify([trial.taskId, trial.taskVersion]); taskGroups.set(key, [...(taskGroups.get(key) || []), trial]); }
      return { variant: trials[0].variant, baseline: trials[0].variant === dataset.baselineVariant, provenance: trials[0].provenance, ...summarize(trials), tasks: [...taskGroups.values()].map(taskTrials => ({ taskId: taskTrials[0].taskId, taskVersion: taskTrials[0].taskVersion, ...summarize(taskTrials) })) };
    }),
    trials: dataset.trials.map(trial => ({ trialId: trial.trialId, taskId: trial.taskId, taskVersion: trial.taskVersion, variant: trial.variant, provenance: trial.provenance, status: trial.status, success: success(trial), oracleQualified: qualifiedOracle(trial), oracle: trial.oracle, resultHash: trial.resultHash })),
  };
}

import { DomainError, hash, type ExecutionCapabilitiesSnapshot, type ExecutionPolicy, type ExecutionPolicyOptions } from '../domain/index.ts';

export const defaultExecutionLimits = Object.freeze({ maxSteps: 40, timeoutMs: 300_000, maxDispatches: 128, maxRunDispatches: 1024 });

export function normalizeCapabilities(capabilities: ExecutionCapabilitiesSnapshot): ExecutionCapabilitiesSnapshot {
  return structuredClone(capabilities);
}

/** Validation is shared by workflow compilation and the actual dispatch boundary. */
export function validatePolicyOptions(options: ExecutionPolicyOptions): string[] {
  const errors: string[] = [];
  for (const key of ['maxSteps', 'timeoutMs', 'maxDispatches', 'maxReservedSteps', 'maxRunDispatches', 'maxRunReservedSteps'] as const) {
    const value = options[key];
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) errors.push(`${key} 必须为正安全整数`);
  }
  if (options.maxCostUsd !== undefined && (!Number.isFinite(options.maxCostUsd) || options.maxCostUsd <= 0)) errors.push('maxCostUsd 必须为有限正数');
  if (options.strictCostLimit !== undefined && typeof options.strictCostLimit !== 'boolean') errors.push('strictCostLimit 必须为布尔值');
  if (options.strictCostLimit && options.maxCostUsd === undefined) errors.push('严格费用限制必须提供 maxCostUsd');
  return errors;
}

export function createPolicy(options: ExecutionPolicyOptions = {}, capabilities?: ExecutionCapabilitiesSnapshot): ExecutionPolicy {
  const errors = validatePolicyOptions(options);
  if (errors.length) throw new DomainError('POLICY_INVALID', errors.join('；'), 400);
  // None of the current adapter contracts can reserve a monetary ceiling before a model call.
  if (options.strictCostLimit) throw new DomainError('COST_LIMIT_UNSUPPORTED', '当前执行底座不支持严格费用上限；不能将其静默改成观测阈值', 409);
  const limits: ExecutionPolicy['limits'] = { ...defaultExecutionLimits };
  for (const key of ['maxSteps', 'timeoutMs', 'maxDispatches', 'maxReservedSteps', 'maxRunDispatches', 'maxRunReservedSteps', 'maxCostUsd'] as const) {
    if (options[key] !== undefined) limits[key] = options[key];
  }
  const snapshot: Omit<ExecutionPolicy, 'policyHash'> = {
    version: 1, limits,
    ...(capabilities ? { capabilities: normalizeCapabilities(capabilities) } : {}),
    costEnforcement: options.maxCostUsd === undefined ? 'unsupported' : 'observed',
  };
  return { ...snapshot, policyHash: hash(JSON.stringify(snapshot)) };
}

export const freezePolicy = createPolicy;

export function remainingExecutionMs(deadlineAt: string | undefined, at = Date.now()): number | undefined {
  if (!deadlineAt) return undefined;
  const deadline = Date.parse(deadlineAt);
  if (!Number.isFinite(deadline)) throw new DomainError('POLICY_INVALID', '执行截止时间无效');
  return Math.max(0, deadline - at);
}

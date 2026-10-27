import type { ExecutionRef } from '../domain/index.ts';
import type { UsageMeasurement, UsageValues } from '../domain/execution.ts';

/** The meter identifies a single dispatched input, independently of polling and bindings. */
export function turnUsage(ref: ExecutionRef, values: UsageValues, eventId?: string, sequence?: number): UsageMeasurement {
  const known = Object.values(values).filter(value => value !== null).length;
  return { meterId: JSON.stringify([ref.backend, ref.rootId, ref.sessionId, ref.turnId]), scope: 'turn', mode: 'cumulative', ...(eventId ? { eventId } : {}), ...(sequence !== undefined ? { sequence } : {}), ...values, completeness: known === 3 ? 'complete' : known ? 'partial' : 'unknown' };
}

export function unknownTurnUsage(ref: ExecutionRef, eventId?: string): UsageMeasurement {
  return turnUsage(ref, { inputTokens: null, outputTokens: null, costUsd: null }, eventId);
}

/** Missing, malformed and negative counters remain unknown rather than becoming zero. */
export function reportedSum(values: unknown[], integer = false): number | null {
  if (!values.length || values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value)))) return null;
  const total = (values as number[]).reduce((sum, value) => sum + value, 0);
  return Number.isFinite(total) && (!integer || Number.isSafeInteger(total)) ? total : null;
}

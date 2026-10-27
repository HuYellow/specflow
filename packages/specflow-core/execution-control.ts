import { assert, type Attempt } from '../domain/index.ts';
import { Store } from './store.ts';

/** Timers are a projection of persisted deadlines; they never extend an attempt. */
export class ExecutionControl {
  readonly controllers = new Map<string, AbortController>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  constructor(private store: Store) {}

  remaining(attempt: Attempt) {
    if (!attempt.deadlineAt) return Infinity;
    const deadline = Date.parse(attempt.deadlineAt);
    assert(Number.isFinite(deadline), 'POLICY_INVALID', '执行截止时间无效');
    return Math.max(0, deadline - Date.now());
  }

  assertCanContinue(attemptId: string) {
    const attempt = this.store.get('attempts', attemptId);
    assert(!attempt.stopRequestedAt, 'EXECUTION_STOP_REQUESTED', '执行已请求停止，不能派发后续操作');
    assert(this.remaining(attempt) > 0, 'EXECUTION_TIMEOUT', '阶段时间上限已到，不能派发后续操作');
    return attempt;
  }

  async run<T>(attemptId: string, onDeadline: () => Promise<unknown>, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const existing = this.controllers.get(attemptId);
    if (existing) return operation(existing.signal);
    const controller = new AbortController();
    this.controllers.set(attemptId, controller);
    const attempt = this.store.get('attempts', attemptId), remaining = this.remaining(attempt);
    const expire = () => {
      const remaining = this.remaining(this.store.get('attempts', attemptId));
      if (remaining > 0) {
        const timer = setTimeout(expire, Math.min(remaining, 2_147_483_647)); timer.unref(); this.timers.set(attemptId, timer);
      } else void onDeadline().catch(error => this.store.emit(attemptId, 'execution.stop-error', { message: String(error) }));
    };
    if (attempt.stopRequestedAt) controller.abort();
    if (remaining <= 0) await onDeadline();
    else if (Number.isFinite(remaining)) {
      const timer = setTimeout(expire, Math.min(remaining, 2_147_483_647));
      timer.unref(); this.timers.set(attemptId, timer);
    }
    try { return await operation(controller.signal); }
    finally {
      const timer = this.timers.get(attemptId); if (timer) clearTimeout(timer);
      this.timers.delete(attemptId); this.controllers.delete(attemptId);
    }
  }

  abort(attemptId: string) { this.controllers.get(attemptId)?.abort(); }
  close() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    for (const controller of this.controllers.values()) controller.abort();
  }
}

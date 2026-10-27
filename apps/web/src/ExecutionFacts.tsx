import type { Attempt, ExecutionStopReason } from '../../../packages/domain/index.ts';
import { localizedDate, t } from './i18n.ts';

export function executionReason(reason?: ExecutionStopReason): string {
  const labels: Record<ExecutionStopReason, string> = {
    natural_completion: '执行自然结束', step_limit: '步数上限', attempt_limit: '派发次数上限', deadline: '执行时限已到',
    user_cancelled: '用户请求停止', permission_denied: '授权被拒绝', provider_error: '供应商执行错误', input_stale: '输入已变化', no_progress: '连续无进展', unknown: '原因未知',
  };
  return reason ? t(labels[reason]) : '—';
}

export function usageValue(attempt: Attempt, meter: 'inputTokens' | 'outputTokens' | 'costUsd'): string {
  const summary = attempt.usageSummary;
  const value = summary ? summary[meter] : attempt.usage?.[meter];
  if (value == null) return t('未知');
  const formatted = meter === 'costUsd' ? `$${value}` : String(value);
  return summary?.unknownCounts[meter] ? t('{value} + {count} 项未知', { value: formatted, count: summary.unknownCounts[meter] }) : formatted;
}

/** Shared facts for desktop and DSH; execution completion remains separate from engineering acceptance. */
export function ExecutionFacts({ attempt, compact = false }: { attempt: Attempt; compact?: boolean }) {
  const factClass = compact ? 'sf-run-facts' : 'execution-facts';
  const detailsClass = compact ? 'sf-details' : 'context-details';
  const policy = attempt.policy;
  const enforcement = policy?.capabilities?.details?.stepLimit.enforcement || policy?.capabilities?.stepLimit;
  return <>
    <dl className={factClass} aria-label={t('执行控制与用量')}>
      <div><dt>{t('输入 Token')}</dt><dd>{usageValue(attempt, 'inputTokens')}</dd></div>
      <div><dt>{t('输出 Token')}</dt><dd>{usageValue(attempt, 'outputTokens')}</dd></div>
      <div><dt>{t('实际费用')}</dt><dd>{attempt.target.backend === 'sandbox' ? t('不调用 API') : usageValue(attempt, 'costUsd')}</dd></div>
      <div><dt>{t('执行截止时间')}</dt><dd>{attempt.deadlineAt ? localizedDate(attempt.deadlineAt) : t('历史记录未提供')}</dd></div>
      <div><dt>{t('停止原因')}</dt><dd>{executionReason(attempt.stopReason)}</dd></div>
      <div><dt>{t('停止确认')}</dt><dd>{attempt.stopRequestedAt ? attempt.terminalConfirmedAt ? t('已确认终态') : t('正在请求停止') : attempt.terminalConfirmedAt ? t('已确认终态') : '—'}</dd></div>
      {policy && <><div><dt>{t('单次执行步数')}</dt><dd>{policy.limits.maxSteps} · {enforcement === 'native' ? t('原生上限') : enforcement === 'observed' ? t('观测保护') : t('能力未知')}</dd></div><div><dt>{t('累计派发上限')}</dt><dd>{t('本尝试 {attempt} · 本流程 {run}', { attempt: policy.limits.maxDispatches, run: policy.limits.maxRunDispatches })}</dd></div></>}
    </dl>
    {attempt.usageSummary?.completeness !== 'complete' && <p className={compact ? 'sf-hint' : 'run-control-note'}>{t('用量可能不完整，未知项没有按零计算。')}</p>}
    {enforcement === 'observed' && <p className={compact ? 'sf-hint' : 'run-control-note'}>{t('观测保护会请求停止，不能保证运行恰好停在指定步数。')}</p>}
    {attempt.stopRequestedAt && !attempt.terminalConfirmedAt && <p role="status" className={compact ? 'sf-hint' : 'run-control-note'}>{t('停止请求尚未确认；请核对原执行，不能据此开始新的写入。')}</p>}
    {attempt.contextManifest && <details className={detailsClass}><summary>{t('本次上下文清单')}</summary><div><p>{t('完整提示词 {bytes} 字节', { bytes: attempt.contextManifest.promptBytes ?? t('未知') })}</p><ul>{attempt.contextManifest.entries.map(entry => <li key={entry.sourceId}><strong>{entry.sourceId}</strong> · {t('{bytes} 字节', { bytes: entry.bytes })} · {entry.required ? t('必需材料') : t('辅助材料')}<br /><code style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{entry.contentHash}</code></li>)}</ul></div></details>}
  </>;
}

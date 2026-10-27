import { useId, useState } from 'react';
import type { AutomationRun, NodeRun, RepairCycle, WorkflowNode, WorkflowRun } from '../../../packages/domain/index.ts';
import { t } from './i18n.ts';

export type AutomationCommand = 'startRepair' | 'stopRepair' | 'startAutomation' | 'stopAutomation';
export function automationReason(reason?: string): string {
  const labels: Record<string, string> = { completed: '检查已通过', workflow_finished: '检查已通过', round_limit: '修订轮数已用完', no_progress: '连续无进展', input_stale: '输入已变化', candidate_drift: '候选代码已变化', permission_denied: '授权被拒绝', execution_unknown: '原执行仍待核对', budget_exhausted: '执行预算已用完', user_cancelled: '用户请求停止', unrepairable: '需要人工处理', waiting_for_input: '正在等待澄清或授权', human_action_required: '等待人工接纳', artifact_acceptance_required: '等待人工接纳', explicit_retry_required: '需要明确重试', gate_blocked: '工程检查未通过', gate_unchecked: '工程条件待确认', readiness_unknown: '工程条件待确认', workflow_inactive: '流程尚未激活', automation_inactive: '已暂停', node_missing: '需要人工处理', workflow_invalid: '需要人工处理' };
  return reason ? t(labels[reason] || reason) : '';
}
export function AutomationControls({ workflowRun, node, definition, repairs = [], automations = [], disabled, startBlocked, compact = false, onCommand }: {
  workflowRun: WorkflowRun; node?: NodeRun; definition?: WorkflowNode; repairs?: RepairCycle[]; automations?: AutomationRun[];
  disabled?: boolean; startBlocked?: boolean; compact?: boolean;
  onCommand(command: AutomationCommand, id: string, input?: unknown): void;
}) {
  const id = useId(), [autoRepair, setAutoRepair] = useState(false), [maxRounds, setMaxRounds] = useState(2);
  const repair = repairs.filter(repair => repair.workflowRunId === workflowRun.id).at(-1);
  const automation = automations.filter(automation => automation.workflowRunId === workflowRun.id).at(-1);
  const repairActive = repair?.state === 'active', automationActive = automation?.state === 'active';
  const nodeActive = !!node && ['starting', 'running', 'waiting_interaction', 'reconciling'].includes(node.execution);
  const canRepair = !!node && ['agent', 'review', 'verify'].includes(node.type) && node.gate === 'blocked' && node.freshness === 'fresh' && !nodeActive && !repairActive && !automationActive;
  const blocked = disabled || startBlocked || workflowRun.state !== 'active';
  const buttonClass = compact ? '' : 'outline-button';
  return <details className={compact ? 'sf-details' : 'context-details automation-controls'} open={repairActive || automationActive || undefined}>
    <summary>{t('自动推进与有限修订')}</summary>
    <div>
      <p className={compact ? 'sf-hint' : 'run-control-note'}>{t('自动推进运行到需要你接纳、澄清或授权的位置。自动修订只处理当前目标，保留人工接纳。')}</p>
      <label className={compact ? 'sf-checkbox' : 'automation-option'}><input type="checkbox" checked={autoRepair} disabled={blocked || automationActive || repairActive} onChange={event => setAutoRepair(event.target.checked)} /> {t('推进时允许有限自动修订')}</label>
      <label className={compact ? 'sf-field' : 'automation-option'} htmlFor={id}>{t('最多修订轮数')} <select id={id} value={maxRounds} disabled={blocked || automationActive || repairActive} onChange={event => setMaxRounds(Number(event.target.value))}><option value={1}>1</option><option value={2}>2</option></select></label>
      <div className={compact ? 'sf-actions' : 'run-actions'}>
        {automationActive ? <button type="button" className={buttonClass} disabled={disabled} onClick={() => onCommand('stopAutomation', automation.id)}>{t('停止自动推进')}</button> : <button type="button" className={buttonClass} disabled={blocked || nodeActive || repairActive} onClick={() => onCommand('startAutomation', workflowRun.id, { expectedRevision: workflowRun.revision, autoAdvance: true, autoRepair, maxRepairRounds: maxRounds })}>{t('运行到下一处待处理')}</button>}
        {repairActive ? <button type="button" className={buttonClass} disabled={disabled} onClick={() => onCommand('stopRepair', repair.id)}>{t('停止自动修订')}</button> : <button type="button" className={buttonClass} disabled={blocked || !canRepair} onClick={() => { if (node) onCommand('startRepair', node.id, { expectedRevision: node.revision, maxRounds }); }}>{t('自动修订当前产物')}</button>}
      </div>
      {repair && <p role="status">{t('修订进度 {round} / {max}', { round: repair.rounds.length, max: repair.maxRounds })} · {repairActive ? t('正在自动修订') : automationReason(repair.stopReason) || t('已暂停')}</p>}
      {automation && <p role="status">{automationActive ? t('正在自动推进') : automationReason(automation.pauseReason) || (automation.state === 'completed' ? t('检查已通过') : t('已暂停'))}</p>}
    </div>
  </details>;
}

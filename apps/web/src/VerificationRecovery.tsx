import { t } from './i18n.ts';

/** A persisted unresolved process cannot be cleared by refreshing or by a model response. */
export function VerificationRecovery({ disabled, compact = false, onConfirm }: { disabled?: boolean; compact?: boolean; onConfirm(reason: string): void }) {
  const confirm = () => {
    const reason = t('我已确认本机验证命令及其子进程已全部结束。');
    if (window.confirm(t('只有确认本机验证命令及其子进程全部结束后，才可解除此阻塞。是否确认？'))) onConfirm(reason);
  };
  return <div className={compact ? 'sf-inline-error' : 'verification-recovery'}>
    <p>{t('验证进程的终态尚未确认。请先检查本机进程；确认前不会开始新的写入或接纳。')}</p>
    <button type="button" className={compact ? '' : 'outline-button'} disabled={disabled} onClick={confirm}>{t('确认验证进程已全部结束')}</button>
  </div>;
}

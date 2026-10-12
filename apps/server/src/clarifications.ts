import { z } from 'zod';
import { assert, type ClarificationSession } from '../../../packages/domain/index.ts';
import { Store } from './store.ts';
import { guidanceFresh } from './guidance.ts';
import { requirementFresh } from './requirements.ts';

export const clarificationOutput = z.object({
  status: z.enum(['needs_answers', 'complete']),
  questions: z.array(z.object({ id: z.string().regex(/^Q\d{1,3}$/), question: z.string().min(1).max(1000), reason: z.string().min(1).max(2000), options: z.array(z.string().min(1).max(500)).max(5).default([]) })).max(5).default([]),
});

export function clarificationFresh(store: Store, session: ClarificationSession) {
  if (session.state === 'stale' || !requirementFresh(store, session.requirementRevisionId) || !guidanceFresh(store, session.workItemId, session.guidanceHash)) return false;
  const artifact = store.list('artifacts', a => a.workItemId === session.workItemId && a.logicalId === 'spec')[0];
  return artifact?.currentRevisionId === (session.state === 'completed' ? session.resultSpecRevisionId : session.sourceSpecRevisionId);
}
export function assertClarifiedSpec(store: Store, workItemId: string) {
  const artifact = store.list('artifacts', a => a.workItemId === workItemId && a.logicalId === 'spec')[0];
  assert(artifact, 'CLARIFICATION_REQUIRED', '请先生成需求规格，再完成需求澄清');
  const revision = store.get('artifactRevisions', artifact.currentRevisionId);
  const session = revision.clarificationSessionId ? store.get('clarifications', revision.clarificationSessionId) : undefined;
  assert(session && session.state === 'completed' && clarificationFresh(store, session), 'CLARIFICATION_REQUIRED', '当前规格尚未完成需求澄清，请先运行澄清并提交必要答复');
}
export function clarificationContext(session: ClarificationSession) {
  return `## 已记录的澄清问答\n${JSON.stringify(session.questions)}\n已使用 ${session.questions.length} / 5 个问题。不得重复已问的问题 ID。所有必要问题得到明确答复后，返回完整的修订规格。`;
}
export function appendClarificationRecord(content: string, session: ClarificationSession) {
  const records = session.questions.length ? session.questions.map(q => `- 问题 ${q.id}：${q.question}\n  - 答复：${q.answer}`).join('\n') : '- 已检查规格中的功能边界、异常场景、数据约束与验收标准，本轮无需额外提问。';
  return `${content.trim()}\n\n## 澄清记录\n\n会话：${session.id}\n\n${records}\n`;
}

import { sandboxReviewInstruction, sandboxText } from './sandbox-copy.ts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hash, type ExecutionRef, type HumanBrief, type ModelTarget } from '../domain/index.ts';
import type { BackendCapabilities, ExecutionBackend, ExecutionSnapshot, ExecutionUpdate, FrozenInput, StageOutput } from '../execution-contract/index.ts';
import type { ReviewReport } from '../review-policy/index.ts';

export const sandboxTargets: ModelTarget[] = ['analyst', 'developer', 'reviewer'].map(role => ({ backend: 'sandbox', connectionId: 'local-contract-fixture', connectionSlug: '本地验收后端', model: role }));
const csvImplementation = `export function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(field); field = ''; }
    else if ((ch === '\\n' || ch === '\\r') && !quoted) {
      if (ch === '\\r' && text[i + 1] === '\\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (quoted) throw new Error('Unclosed quoted field');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.length));
}
`;

const documentBriefs: Record<string, HumanBrief> = {
  spec: { title: 'CSV 导入需求规格', summary: '将 CSV 转为二维记录，支持逗号、引号与换行。', sections: [{ title: '功能范围', items: ['FR01：普通逗号分隔记录正确解析。', 'FR02：保留引号中的逗号和换行。', 'FR03：转义引号解析为一个引号。'] }, { title: '错误验收', items: ['FR04：未闭合引号抛出明确错误。'] }] },
  plan: { title: 'CSV 导入工程设计', summary: '在 csv.js 实现字符状态机。', sections: [{ title: '实现方式', items: ['维护当前字段、行和引号状态。', '处理 CRLF 与双引号转义。'] }, { title: '验证方式', items: ['使用 Node.js 测试验证 FR01–FR04。'] }] },
  tasks: { title: 'CSV 导入实现任务', summary: 'T001 实现 parseCsv 字符状态机。', sections: [{ title: '任务范围', items: ['T001：实现 parseCsv 字符状态机。'] }, { title: '验收条件', items: ['普通字段、引号、CRLF 和错误输入测试通过。'] }] },
  implementation: { title: 'CSV 导入实现说明', summary: 'T001 已产出候选补丁，支持 FR01–FR04。', sections: [{ title: '实现范围', items: ['T001 的候选补丁支持 FR01–FR04。'] }, { title: '下一步', items: ['等待独立测试与代码复核。'] }] },
  convergence: { title: '需求与实现对齐', summary: 'FR01–FR04 对应 parseCsv 状态机与 csv.test.js 测试。', sections: [{ title: '追溯关系', items: ['FR01–FR04 对应 csv.js 中 parseCsv 状态机与 csv.test.js 测试。', 'T001 的候选改动已生成。'] }, { title: '接纳条件', items: ['最终接纳必须检查对应代码哈希的验证证据。'] }] },
};

/** Explicitly a deterministic contract fixture. It never calls a model. */
export class SandboxBackend implements ExecutionBackend {
  private results = new Map<string, ExecutionSnapshot>();
  private inputs = new Map<string, FrozenInput>();
  private cancelled = new Set<string>();
  async inspect(): Promise<BackendCapabilities> { return { available: true, version: 'fixture-v1', rootId: 'local-contract-fixture', canResume: true, canInteract: false, readOnlyReview: true, reason: '确定性验收后端，不调用模型；仅允许用于示例仓库和契约测试' }; }
  async listTargets() { return sandboxTargets; }
  async prepare(input: FrozenInput): Promise<ExecutionRef> { this.inputs.set(input.attemptId, input); return { backend: 'sandbox', rootId: 'local-contract-fixture', sessionId: input.attemptId, turnId: `turn-${input.attemptId}`, runId: `run-${input.attemptId}` }; }
  async start(ref: ExecutionRef, input: FrozenInput) {
    const text = (source: string, values?: Record<string, string | number | undefined>) => sandboxText(source, input.locale, values);
    this.results.set(ref.sessionId, { state: 'running', ref });
    await new Promise(done => setTimeout(done, 350));
    if (this.cancelled.has(ref.sessionId)) return this.results.get(ref.sessionId)!;
    const artifacts: StageOutput['artifacts'] = [];
    const content = input.artifacts.map(x => x.content).join('\n');
    let findings: StageOutput['findings'] = [];
    if (input.node.type === 'clarify') {
      const questions = input.clarification?.questions || [];
      const output: StageOutput = questions.length ? { summary: text('本地契约澄清完成，答复会写入规格。'), clarification: { status: 'complete', questions: [] }, artifacts: [{ logicalId: 'spec', type: 'spec', content: text("{value1}\n## 已确认决策\n{value2}\n", { value1: input.artifacts.find(a => a.logicalId === 'spec')!.content, value2: questions.map(q => `- ${q.id} ${q.question}${input.locale === 'en' ? ': ' : '：'}${q.answer}`).join('\n') }), humanBrief: { title: text('CSV 需求澄清结果'), summary: text('CSV 错误输入的处理方式已记录到规格。'), sections: [{ title: text('规格范围'), items: [text('保留原规格的 CSV 功能与验收条目。')] }, { title: text('已确认决策'), items: questions.map(q => text("{value1} 的答复已写入已确认决策。", { value1: q.id })).slice(0, 6) }] } }] } : { summary: text('需要确认 CSV 错误输入的处理方式。'), clarification: { status: 'needs_answers', questions: [{ id: 'Q001', question: text('CSV 引号未闭合时应如何处理？'), reason: text('这决定错误处理接口与验收测试的预期结果。'), options: [text('抛出明确错误'), text('返回空数组并记录错误')] }] }, artifacts: [] };
      const snapshot: ExecutionSnapshot = { state: 'completed', ref, terminalEventId: hash(JSON.stringify(output)), output: JSON.stringify(output), usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
      this.results.set(ref.sessionId, snapshot); return snapshot;
    }
    if (input.node.type === 'review') {
      if (content.includes('[NEEDS CLARIFICATION]') || content.includes('TODO')) findings = [{ severity: 'blocker', location: text('文档内容'), body: text('仍有未解决问题或占位符，请修订后重新复核'), targetLogicalId: input.artifacts[0]?.logicalId }];
    } else for (const logicalId of input.node.outputs) {
      let output = '';
      if (logicalId === 'spec') output = text('# CSV 导入需求规格\n\n## 目标\n将 CSV 转为二维记录，支持逗号、引号与换行。\n\n## 验收标准\n- FR01：普通逗号分隔记录正确解析。\n- FR02：引号中的逗号和换行保留。\n- FR03：转义引号解析为一个引号。\n- FR04：未闭合引号抛出明确错误。\n');
      else if (logicalId === 'plan') output = text('# CSV 导入工程设计\n\n在 csv.js 实现字符状态机。维护当前字段、行和引号状态。处理 CRLF 与双引号转义。使用 Node.js 测试验证需求 FR01–FR04。\n');
      else if (logicalId === 'tasks') output = text('# 实现任务\n\n- [ ] T001 实现 parseCsv 字符状态机；验收：普通字段、引号、CRLF 和错误输入测试通过。\n');
      else if (logicalId === 'implementation') { await writeFile(join(input.workspace, 'csv.js'), csvImplementation); output = text('# 实现说明\n\nT001 已产出候选补丁。支持 FR01–FR04，等待独立测试与代码复核。\n'); }
      else if (logicalId === 'convergence') output = text('# 需求与实现对齐\n\nFR01–FR04 对应 csv.js 中 parseCsv 状态机与 csv.test.js 测试。T001 的候选改动已生成；最终接纳必须检查对应代码哈希的验证证据。\n');
      else output = text("# {value1}\n\n这是本地验收产物，输入哈希 {value2}。\n", { value1: input.node.name, value2: input.inputHash });
      artifacts.push({ logicalId, type: logicalId, content: output, humanBrief: documentBriefs[logicalId] ? { title: text(documentBriefs[logicalId].title), summary: text(documentBriefs[logicalId].summary), sections: documentBriefs[logicalId].sections.map(section => ({ title: text(section.title), items: section.items.map(item => text(item)) })) } : undefined });
    }
    let review: ReviewReport | undefined;
    if (input.review) {
      const context = input.review;
      const evidence = context.sources.filter(s => s.content.trim()).map(s => ({ sourceId: s.id, quote: s.content.trim().slice(0, 200) }));
      review = { version: 1, groupId: context.groupId, perspective: context.perspective, verdict: findings.some(f => f.severity === 'blocker') ? 'revise' : 'pass', summary: text('仅验证双视角协议与证据绑定；不代表真实模型审核质量。'), checks: context.criteria.map(c => ({ criterionId: c.id, result: findings.some(f => f.severity === 'blocker') ? 'fail' : 'pass', explanation: text("确定性契约检查：{value1}", { value1: sandboxReviewInstruction(c.id, c.instruction, input.locale) }), evidence, counterexample: { scenario: text('契约夹具检查未解决的 TODO 或需求占位符；真实反例由接入模型独立构造。'), outcome: findings.some(f => f.severity === 'blocker') ? 'reproduced' : 'ruled_out', reason: text('仅扫描当前冻结材料中的未决占位符；不声称完成语义审核。') } })), resolutions: context.priorFindings.map(f => ({ findingId: f.id, result: 'fixed', evidence, explanation: text('确定性夹具模拟修复复验，仅用于测试工程协议。') })) };
    }
    const output: StageOutput = { summary: input.node.type === 'review' ? text('本地契约复核完成；真实模型复核尚未执行。') : text('验收后端产出候选，等待工程规则检查。'), artifacts, findings, review };
    const snapshot: ExecutionSnapshot = { state: 'completed', ref, terminalEventId: hash(JSON.stringify(output)), output: JSON.stringify(output), usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
    this.results.set(ref.sessionId, snapshot); return snapshot;
  }
  async query(ref: ExecutionRef): Promise<ExecutionSnapshot> { return this.results.get(ref.sessionId) || { state: 'unknown', ref, error: '验收后端进程重启；请创建新的确定性尝试' }; }
  async *observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate> { yield { kind: 'terminal', snapshot: await this.query(ref) }; }
  async answer() { throw new Error('验收后端不提供模型交互'); }
  async stop(ref: ExecutionRef) { this.cancelled.add(ref.sessionId); this.results.set(ref.sessionId, { state: 'cancelled', ref }); }
  async planResume(ref: ExecutionRef) { return { possible: this.inputs.has(ref.sessionId), reason: this.inputs.has(ref.sessionId) ? undefined : '重启后请创建新尝试' }; }
  async resume(ref: ExecutionRef) { const input = this.inputs.get(ref.sessionId); if (!input) throw new Error('无法恢复验收尝试'); this.cancelled.delete(ref.sessionId); const next = { ...ref, turnId: `${ref.turnId}-resume`, runId: `${ref.runId}-resume` }; await this.start(next, input); return next; }
  async readResult(ref: ExecutionRef) { return this.query(ref); }
}

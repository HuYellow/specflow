import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hash, type ExecutionRef, type ModelTarget } from '../../../packages/domain/index.ts';
import type { BackendCapabilities, ExecutionBackend, ExecutionSnapshot, ExecutionUpdate, FrozenInput, StageOutput } from '../../../packages/execution-contract/index.ts';

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

/** Explicitly a deterministic contract fixture. It never calls a model. */
export class SandboxBackend implements ExecutionBackend {
  private results = new Map<string, ExecutionSnapshot>();
  private inputs = new Map<string, FrozenInput>();
  private cancelled = new Set<string>();
  async inspect(): Promise<BackendCapabilities> { return { available: true, version: 'fixture-v1', rootId: 'local-contract-fixture', canResume: true, canInteract: false, readOnlyReview: true, reason: '确定性验收后端，不调用模型；仅允许用于示例仓库和契约测试' }; }
  async listTargets() { return sandboxTargets; }
  async prepare(input: FrozenInput): Promise<ExecutionRef> { this.inputs.set(input.attemptId, input); return { backend: 'sandbox', rootId: 'local-contract-fixture', sessionId: input.attemptId, turnId: `turn-${input.attemptId}`, runId: `run-${input.attemptId}` }; }
  async start(ref: ExecutionRef, input: FrozenInput) {
    this.results.set(ref.sessionId, { state: 'running', ref });
    await new Promise(done => setTimeout(done, 350));
    if (this.cancelled.has(ref.sessionId)) return this.results.get(ref.sessionId)!;
    const artifacts: StageOutput['artifacts'] = [];
    const content = input.artifacts.map(x => x.content).join('\n');
    let findings: StageOutput['findings'] = [];
    if (input.node.type === 'clarify') {
      const questions = input.clarification?.questions || [];
      const output: StageOutput = questions.length ? { summary: '本地契约澄清完成，答复会写入规格。', clarification: { status: 'complete', questions: [] }, artifacts: [{ logicalId: 'spec', type: 'spec', content: `${input.artifacts.find(a => a.logicalId === 'spec')!.content}\n## 已确认决策\n${questions.map(q => `- ${q.question}：${q.answer}`).join('\n')}\n` }] } : { summary: '需要确认 CSV 错误输入的处理方式。', clarification: { status: 'needs_answers', questions: [{ id: 'Q001', question: 'CSV 引号未闭合时应如何处理？', reason: '这决定错误处理接口与验收测试的预期结果。', options: ['抛出明确错误', '返回空数组并记录错误'] }] }, artifacts: [] };
      const snapshot: ExecutionSnapshot = { state: 'completed', ref, terminalEventId: hash(JSON.stringify(output)), output: JSON.stringify(output), usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
      this.results.set(ref.sessionId, snapshot); return snapshot;
    }
    if (input.node.type === 'review') {
      if (content.includes('[NEEDS CLARIFICATION]') || content.includes('TODO')) findings = [{ severity: 'blocker', location: '文档内容', body: '仍有未解决问题或占位符，请修订后重新复核', targetLogicalId: input.artifacts[0]?.logicalId }];
    } else for (const logicalId of input.node.outputs) {
      let output = '';
      if (logicalId === 'spec') output = '# CSV 导入需求规格\n\n## 目标\n将 CSV 转为二维记录，支持逗号、引号与换行。\n\n## 验收标准\n- FR01：普通逗号分隔记录正确解析。\n- FR02：引号中的逗号和换行保留。\n- FR03：转义引号解析为一个引号。\n- FR04：未闭合引号抛出明确错误。\n';
      else if (logicalId === 'plan') output = '# CSV 导入工程设计\n\n在 csv.js 实现字符状态机。维护当前字段、行和引号状态。处理 CRLF 与双引号转义。使用 Node.js 测试验证需求 FR01–FR04。\n';
      else if (logicalId === 'tasks') output = '# 实现任务\n\n- [ ] T001 实现 parseCsv 字符状态机；验收：普通字段、引号、CRLF 和错误输入测试通过。\n';
      else if (logicalId === 'implementation') { await writeFile(join(input.workspace, 'csv.js'), csvImplementation); output = '# 实现说明\n\nT001 已产出候选补丁。支持 FR01–FR04，等待独立测试与代码复核。\n'; }
      else if (logicalId === 'convergence') output = '# 需求与实现对齐\n\nFR01–FR04 对应 csv.js 中 parseCsv 状态机与 csv.test.js 测试。T001 的候选改动已生成；最终接纳必须检查对应代码哈希的验证证据。\n';
      else output = `# ${input.node.name}\n\n这是本地验收产物，输入哈希 ${input.inputHash}。\n`;
      artifacts.push({ logicalId, type: logicalId, content: output });
    }
    const output: StageOutput = { summary: input.node.type === 'review' ? '本地契约复核完成；真实模型复核尚未执行。' : '验收后端产出候选，等待工程规则检查。', artifacts, findings };
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

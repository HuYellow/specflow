import { messages as defaults } from '../../../packages/i18n/defaults.ts';
import { englishMessages } from '../../../packages/i18n/index.ts';
import { getLocale } from './i18n.ts';

// Only built-in workflow labels and instructions are presentation copy. Other saved text is user material.
const workflowSources = [
  '规格驱动开发',
  '需求规格',
  '需求澄清',
  '规格复核',
  '工程设计',
  '设计复核',
  '任务拆解',
  '任务复核',
  '代码实现',
  '测试与检查',
  '代码复核',
  '收敛与对齐',
  '收敛复核',
  '接纳代码',
  '分析需求和仓库，产出具有验收标准的需求规格。存在未知信息时提出明确问题。',
  '检查规格的功能边界、异常场景、数据约束和验收标准。仅询问影响设计和验证的关键问题，整个澄清会话最多 5 个问题。读取已有答复，保留需求 ID，把已确认的决策写回完整需求规格。',
  '独立检查规格的完整性、歧义和可验证性。',
  '依据已接纳规格分析现有代码，产出模块、接口、设计决策和风险。',
  '独立检查工程设计是否满足需求，定位具体问题。',
  '拆解实现任务。每项任务包含唯一 ID、依赖和验收条件。',
  '检查任务覆盖、依赖和验收条件。',
  '按已接纳任务改动代码，运行相关测试并记录实现说明。',
  '独立检查补丁与规格、任务、测试覆盖是否一致。',
  '核对需求、任务、代码与验证证据，产出对齐报告。',
  '复核对齐报告，确认没有遗漏需求和证据。',
];

const canonicalSources = new Map<string, string>();
for (const source of workflowSources) {
  canonicalSources.set(source, source);
  if (defaults[source]) canonicalSources.set(defaults[source], source);
  // defaultWorkflow('en') uses the merged catalog, whose later entries can override defaults.ts.
  if (englishMessages[source]) canonicalSources.set(englishMessages[source], source);
}

/** Display fixed workflow copy in the current UI language without changing its persisted value. */
export function workflowText(text: string): string {
  const source = canonicalSources.get(text);
  if (!source) return text;
  return getLocale() === 'en' ? englishMessages[source] || defaults[source] || text : source;
}

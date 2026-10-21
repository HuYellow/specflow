import type { Locale } from '../i18n/index.ts';

const reviewCriteria: Record<string, string> = {
  requirement_coverage: 'reconstruct requirements from the original request and attachments, then check coverage and unsupported additions.',
  assumptions_boundaries: 'check unconfirmed assumptions, input constraints, failure paths, permissions, state changes, and boundaries.',
  upstream_consistency: 'compare interfaces, dependencies, data, and acceptance criteria against the frozen upstream inputs and original requirements.',
  verification_sufficiency: 'check whether verification evidence supports the acceptance criteria for the current code version.',
  human_brief_consistency: 'compare each human brief against its full artifact revision for unsupported claims, contradictions, omitted risks, and misleading success statements.',
};

export function sandboxReviewInstruction(id: string, instruction: string, locale?: Locale): string {
  return locale === 'en' ? reviewCriteria[id] || instruction : instruction;
}

/** Copy owned by the deterministic demo. User answers and quoted evidence remain verbatim. */
const englishMessages: Record<string, string> = {
  "本地验收后端": "Local acceptance backend",
  "CSV 导入需求规格": "CSV import requirements specification",
  "将 CSV 转为二维记录，支持逗号、引号与换行。": "Convert CSV into rows of records, supporting commas, quotes, and newlines.",
  "功能范围": "Functional scope",
  "FR01：普通逗号分隔记录正确解析。": "FR01: Parse ordinary comma-separated records correctly.",
  "FR02：保留引号中的逗号和换行。": "FR02: Preserve commas and newlines inside quoted fields.",
  "FR03：转义引号解析为一个引号。": "FR03: Parse escaped quotes as a single quote.",
  "错误验收": "Error handling acceptance",
  "FR04：未闭合引号抛出明确错误。": "FR04: Throw a clear error for an unclosed quoted field.",
  "CSV 导入工程设计": "CSV import technical design",
  "在 csv.js 实现字符状态机。": "Implement a character state machine in csv.js.",
  "实现方式": "Implementation approach",
  "维护当前字段、行和引号状态。": "Track the current field, row, and quote state.",
  "处理 CRLF 与双引号转义。": "Handle CRLF and escaped double quotes.",
  "验证方式": "Verification approach",
  "使用 Node.js 测试验证 FR01–FR04。": "Use Node.js tests to verify FR01–FR04.",
  "CSV 导入实现任务": "CSV import implementation tasks",
  "T001 实现 parseCsv 字符状态机。": "T001 implements the parseCsv character state machine.",
  "任务范围": "Task scope",
  "T001：实现 parseCsv 字符状态机。": "T001: Implement the parseCsv character state machine.",
  "验收条件": "Acceptance criteria",
  "普通字段、引号、CRLF 和错误输入测试通过。": "Tests for ordinary fields, quotes, CRLF, and invalid input pass.",
  "CSV 导入实现说明": "CSV import implementation notes",
  "T001 已产出候选补丁，支持 FR01–FR04。": "T001 produced a candidate patch supporting FR01–FR04.",
  "实现范围": "Implementation scope",
  "T001 的候选补丁支持 FR01–FR04。": "The candidate patch for T001 supports FR01–FR04.",
  "下一步": "Next step",
  "等待独立测试与代码复核。": "Awaiting independent tests and code review.",
  "需求与实现对齐": "Requirements and implementation alignment",
  "FR01–FR04 对应 parseCsv 状态机与 csv.test.js 测试。": "FR01–FR04 map to the parseCsv state machine and csv.test.js tests.",
  "追溯关系": "Traceability",
  "FR01–FR04 对应 csv.js 中 parseCsv 状态机与 csv.test.js 测试。": "FR01–FR04 map to the parseCsv state machine in csv.js and the tests in csv.test.js.",
  "T001 的候选改动已生成。": "The candidate changes for T001 have been generated.",
  "接纳条件": "Acceptance conditions",
  "最终接纳必须检查对应代码哈希的验证证据。": "Final acceptance must check verification evidence for the matching code hash.",
  "确定性验收后端，不调用模型；仅允许用于示例仓库和契约测试": "A deterministic acceptance backend that makes no model calls; available only for demo repositories and contract tests.",
  "本地契约澄清完成，答复会写入规格。": "Local contract clarification complete. Answers are recorded in the specification.",
  "{value1}\n## 已确认决策\n{value2}\n": "{value1}\n## Confirmed decisions\n{value2}\n",
  "CSV 需求澄清结果": "CSV requirements clarification results",
  "CSV 错误输入的处理方式已记录到规格。": "The handling of invalid CSV input is recorded in the specification.",
  "规格范围": "Specification scope",
  "保留原规格的 CSV 功能与验收条目。": "Retain the CSV features and acceptance criteria from the original specification.",
  "已确认决策": "Confirmed decisions",
  "{value1} 的答复已写入已确认决策。": "The answer to {value1} is recorded under confirmed decisions.",
  "需要确认 CSV 错误输入的处理方式。": "Confirm how invalid CSV input should be handled.",
  "CSV 引号未闭合时应如何处理？": "How should an unclosed quoted CSV field be handled?",
  "这决定错误处理接口与验收测试的预期结果。": "This determines the error handling interface and the expected acceptance test result.",
  "抛出明确错误": "Throw a clear error",
  "返回空数组并记录错误": "Return an empty array and log the error",
  "文档内容": "Document content",
  "仍有未解决问题或占位符，请修订后重新复核": "Unresolved questions or placeholders remain. Revise and review again.",
  "# CSV 导入需求规格\n\n## 目标\n将 CSV 转为二维记录，支持逗号、引号与换行。\n\n## 验收标准\n- FR01：普通逗号分隔记录正确解析。\n- FR02：引号中的逗号和换行保留。\n- FR03：转义引号解析为一个引号。\n- FR04：未闭合引号抛出明确错误。\n": "# CSV import requirements specification\n\n## Goal\nConvert CSV into rows of records, supporting commas, quotes, and newlines.\n\n## Acceptance criteria\n- FR01: Parse ordinary comma-separated records correctly.\n- FR02: Preserve commas and newlines inside quoted fields.\n- FR03: Parse escaped quotes as a single quote.\n- FR04: Throw a clear error for an unclosed quoted field.\n",
  "# CSV 导入工程设计\n\n在 csv.js 实现字符状态机。维护当前字段、行和引号状态。处理 CRLF 与双引号转义。使用 Node.js 测试验证需求 FR01–FR04。\n": "# CSV import technical design\n\nImplement a character state machine in csv.js. Track the current field, row, and quote state. Handle CRLF and escaped double quotes. Use Node.js tests to verify FR01–FR04.\n",
  "# 实现任务\n\n- [ ] T001 实现 parseCsv 字符状态机；验收：普通字段、引号、CRLF 和错误输入测试通过。\n": "# Implementation tasks\n\n- [ ] T001 Implement the parseCsv character state machine; acceptance: tests for ordinary fields, quotes, CRLF, and invalid input pass.\n",
  "# 实现说明\n\nT001 已产出候选补丁。支持 FR01–FR04，等待独立测试与代码复核。\n": "# Implementation notes\n\nT001 produced a candidate patch. It supports FR01–FR04 and awaits independent tests and code review.\n",
  "# 需求与实现对齐\n\nFR01–FR04 对应 csv.js 中 parseCsv 状态机与 csv.test.js 测试。T001 的候选改动已生成；最终接纳必须检查对应代码哈希的验证证据。\n": "# Requirements and implementation alignment\n\nFR01–FR04 map to the parseCsv state machine in csv.js and the tests in csv.test.js. The candidate changes for T001 have been generated. Final acceptance must check verification evidence for the matching code hash.\n",
  "# {value1}\n\n这是本地验收产物，输入哈希 {value2}。\n": "# {value1}\n\nThis is a local acceptance artifact. Input hash: {value2}.\n",
  "仅验证双视角协议与证据绑定；不代表真实模型审核质量。": "Validates only the review protocol from both perspectives and evidence binding. It does not represent actual model review quality.",
  "确定性契约检查：{value1}": "Deterministic contract check: {value1}",
  "契约夹具检查未解决的 TODO 或需求占位符；真实反例由接入模型独立构造。": "The contract fixture checks for unresolved TODOs or requirements placeholders. Connected models construct independent counterexamples.",
  "仅扫描当前冻结材料中的未决占位符；不声称完成语义审核。": "Scans only for unresolved placeholders in the frozen materials. This does not claim to perform a semantic review.",
  "确定性夹具模拟修复复验，仅用于测试工程协议。": "The deterministic fixture simulates a fix recheck solely to test the engineering protocol.",
  "本地契约复核完成；真实模型复核尚未执行。": "Local contract review complete. No real model review has been performed.",
  "验收后端产出候选，等待工程规则检查。": "The acceptance backend produced a candidate awaiting engineering checks.",
  "验收后端进程重启；请创建新的确定性尝试": "The acceptance backend restarted. Create a new deterministic attempt.",
  "验收后端不提供模型交互": "The acceptance backend does not provide model interactions.",
  "重启后请创建新尝试": "Create a new attempt after a restart.",
  "无法恢复验收尝试": "Unable to resume the acceptance attempt."
};

export function sandboxText(source: string, locale?: Locale, values: Record<string, string | number | undefined> = {}): string {
  const message = locale === 'en' ? englishMessages[source] || source : source;
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => Object.hasOwn(values, key) ? String(values[key] ?? '') : match);
}

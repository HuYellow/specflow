import type { NodeRun, WorkflowNode } from '../../../packages/domain/index.ts';
import { getStepStatus } from './flowSelectors.ts';

export function StepFacts({ node, definition, compact = false }: { node: NodeRun; definition?: WorkflowNode; compact?: boolean }) {
  const facts = getStepStatus(node, definition);
  return <dl className={`step-facts${compact ? ' compact' : ''}`} aria-label="步骤的四项工程事实">{(['execution', 'gate', 'freshness', 'acceptance'] as const).map(key => {
    const fact = facts[key];
    return <div key={key} className={`fact-${fact.tone}`} title={`${fact.label} · 服务端原值 ${fact.raw}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>;
  })}</dl>;
}

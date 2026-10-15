import test from 'node:test';
import assert from 'node:assert/strict';
import { compileWorkflow, defaultWorkflow, parseTasks } from '../packages/domain/index.ts';
test('默认流程通过校验；删除复核或重排依赖会被拒绝', () => {
  const flow = defaultWorkflow(); assert.equal(compileWorkflow(flow).valid, true);
  assert.equal(flow.nodes.length, 13);
  assert.equal(compileWorkflow({ ...flow, nodes: flow.nodes.filter(n => n.type !== 'clarify') }).valid, false);
  const lateClarify = { ...flow, nodes: [...flow.nodes.filter(n => n.type !== 'clarify'), flow.nodes.find(n => n.type === 'clarify')!] };
  assert.equal(compileWorkflow(lateClarify).valid, false);
  assert.equal(compileWorkflow({ ...flow, nodes: flow.nodes.filter(n => n.id !== 'review-spec') }).valid, false);
  const moved = [...flow.nodes]; [moved[0], moved[2]] = [moved[2], moved[0]];
  assert.equal(compileWorkflow({ ...flow, nodes: moved }).valid, false);
  assert.equal(compileWorkflow({ ...flow, nodes: flow.nodes.filter(n => n.type !== 'verify') }).valid, false);
});
test('任务 ID、缺失依赖和环受到校验', () => {
  assert.equal(parseTasks('- [ ] T001 实现函数并通过测试\n- [ ] T002 依赖 T001，补充错误处理').length, 2);
  assert.throws(() => parseTasks('- [ ] T001 依赖 T002\n- [ ] T002 依赖 T001'));
  assert.throws(() => parseTasks('- [ ] T001 实现\n- [ ] T001 重复'));
});
test('仅将已接纳产物作为参考材料的审核不能替代该产物的首次审核', () => {
  const flow = defaultWorkflow();
  const sourceOnly = {
    ...flow, requireClarification: false, requiredVerification: [],
    nodes: [flow.nodes.find(node => node.id === 'specify')!, {
      ...flow.nodes.find(node => node.id === 'review-spec')!, inputs: ['spec@accepted'],
    }],
  };
  const result = compileWorkflow(sourceOnly);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.nodeId === 'specify' && error.code === 'REVIEW_MISSING'));
  assert.ok(result.errors.some(error => error.nodeId === 'review-spec' && error.code === 'REVIEW_SUBJECT_MISSING'));
});

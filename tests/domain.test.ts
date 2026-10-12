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

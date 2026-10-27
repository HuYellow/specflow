import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, parseTasks } from '../packages/domain/index.ts';
import { buildContextManifest } from '../packages/specflow-core/context.ts';
import { assertTaskScope, selectTaskVerification } from '../packages/specflow-core/task-spec.ts';

test('context manifest checks the full UTF-8 prompt and keeps source and visible hashes distinct', () => {
  const content = '中文需求';
  const manifest = buildContextManifest([{ sourceId: 'req', content, visibleContent: '摘要', purpose: 'requirement' }], { prompt: '前缀' + content, maxBytes: 18 });
  assert.equal(manifest.promptBytes, 18);
  assert.equal(manifest.entries[0].bytes, 6);
  assert.equal(manifest.entries[0].contentHash, hash(content));
  assert.notEqual(manifest.entries[0].visibleContentHash, hash(content));
  assert.throws(() => buildContextManifest([{ sourceId: 'req', content }], { prompt: '前缀' + content, maxBytes: 17 }), /完整阶段输入超过/);
  assert.throws(() => buildContextManifest([{ sourceId: 'req', content }], { maxBytes: 50 }), /完整提示词/);
  assert.throws(() => buildContextManifest([{ sourceId: 'req', content, contentHash: 'wrong' }]), /哈希不匹配/);
});

test('manifest deduplication never hides conflicting versions or changes actual prompt byte accounting', () => {
  const source = { sourceId: 'one', content: 'same' };
  const result = buildContextManifest([source, source, { ...source, sourceId: 'two' }], { prompt: 'same same same' });
  assert.equal(result.entries.length, 2); assert.equal(result.uniqueBytes, 4);
  assert.equal(result.totalBytes, 8); assert.equal(result.promptBytes, 14);
  assert.throws(() => buildContextManifest([source, { ...source, content: 'changed' }]), /冲突版本/);
});

test('legacy task mentions are not dependency edges, while explicit Chinese and English clauses retain their meaning', () => {
  const tasks = parseTasks('- [ ] T001 对照 T002 的描述补充日志\n- [ ] T002 依赖 T001，补充测试\n- [ ] T003 depends on: T001, T002; check edge cases');
  assert.deepEqual(tasks[0].dependsOn, []);
  assert.deepEqual(tasks[1].dependsOn, ['T001']);
  assert.deepEqual(tasks[2].dependsOn, ['T001', 'T002']);
  for (const clause of ['依赖 T001 和 T002', 'depends on T001 and T002', '依赖 T001 T002']) {
    assert.deepEqual(parseTasks(`- [ ] T001 implement\n- [ ] T002 validate\n- [ ] T003 ${clause}`)[2].dependsOn, ['T001', 'T002']);
  }
  assert.equal(parseTasks('- [ ] T001 更新依赖注入接口')[0].sourceFormat, 'markdown');
  assert.throws(() => parseTasks('- [ ] T001 依赖上一任务，验证'), /明确任务 ID/);
  assert.throws(() => parseTasks('- [ ] T001 依赖 T999，验证'), /不存在的任务/);
});

test('structured tasks validate graph and acceptance, and only select registered verification commands', () => {
  const document = { schemaVersion: 1, tasks: [
    { taskId: 'T001', objective: 'handle empty input', dependsOn: [], acceptanceCriteria: ['empty input returns an empty list'], requirementIds: ['FR1'], allowedPaths: ['src/**'], verificationCommandIds: ['unit'] },
    { taskId: 'T002', objective: 'wire parsing', dependsOn: ['T001'], acceptanceCriteria: ['parser checks pass'] },
  ] };
  const tasks = parseTasks(JSON.stringify(document));
  assert.equal(tasks[0].condition, 'empty input returns an empty list');
  assert.deepEqual(selectTaskVerification(tasks[0], ['unit', 'integration'], ['integration']), ['unit']);
  assert.deepEqual(selectTaskVerification(tasks[1], ['unit', 'integration']), ['unit', 'integration']);
  assert.throws(() => selectTaskVerification(tasks[0], ['integration']), /未在工程配置/);
  assert.throws(() => parseTasks(JSON.stringify({ ...document, tasks: [{ ...document.tasks[0], acceptanceCriteria: [] }] })), /验收条件/);
  assert.throws(() => parseTasks(JSON.stringify({ ...document, tasks: [{ ...document.tasks[0], allowedPaths: ['../outside'] }] })), /越出工作区/);
  assert.throws(() => parseTasks(JSON.stringify({ ...document, tasks: document.tasks.map(task => ({ ...task, dependsOn: task.taskId === 'T001' ? ['T002'] : ['T001'] })) })), /形成环/);
});

test('approved path scopes match exact files, directories and globs without prefix confusion', () => {
  assert.doesNotThrow(() => assertTaskScope(['src/**', 'test/csv.test.ts'], ['src/parse.ts', 'src/nested/read.ts', 'test/csv.test.ts']));
  assert.doesNotThrow(() => assertTaskScope(['src/'], ['src/nested/read.ts']));
  assert.throws(() => assertTaskScope(['src/'], ['src-other/read.ts']), /超出已批准路径/);
  assert.throws(() => assertTaskScope(['src/**'], ['package.json']), /超出已批准路径/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultWorkflow, type WorkflowDefinition } from '../packages/domain/index.ts';
import { messages as defaults } from '../packages/i18n/defaults.ts';
import { englishMessages, translate } from '../packages/i18n/index.ts';
import { getLocale, setLocale, type Locale } from '../apps/web/src/i18n.ts';
import { workflowText } from '../apps/web/src/workflowCopy.ts';

function copy(definition: WorkflowDefinition): string[] {
  return [definition.name, ...definition.nodes.flatMap(node => [node.name, node.prompt])];
}

async function inLocale(locale: Locale, check: () => void) {
  const original = getLocale();
  try { await setLocale(locale); check(); }
  finally { await setLocale(original); }
}

test('persisted English default workflows display Chinese after switching language and retain their original execution copy', async () => {
  const saved = defaultWorkflow('en'), original = structuredClone(saved);
  const chinese = copy(defaultWorkflow('zh-CN')), english = copy(saved);
  for (const locale of ['en', 'zh-CN', 'en', 'zh-CN'] as const) {
    await inLocale(locale, () => assert.deepEqual(english.map(workflowText), locale === 'en' ? english : chinese));
  }
  assert.deepEqual(saved, original);
});

test('persisted Chinese default names and stage goals display the same English copy as newly created English workflows', async () => {
  const saved = defaultWorkflow('zh-CN'), original = structuredClone(saved);
  const chinese = copy(saved), english = copy(defaultWorkflow('en'));
  await inLocale('en', () => assert.deepEqual(chinese.map(workflowText), english));
  await inLocale('zh-CN', () => assert.deepEqual(chinese.map(workflowText), chinese));
  assert.deepEqual(saved, original);
});

test('workflow copy recognizes both defaults.ts translations and the final merged translations used at creation', async () => {
  const chinese = copy(defaultWorkflow('zh-CN')).filter(Boolean);
  await inLocale('zh-CN', () => {
    for (const source of chinese) {
      assert.equal(workflowText(defaults[source]), source);
      assert.equal(workflowText(englishMessages[source]), source);
    }
  });
  await inLocale('en', () => {
    for (const source of chinese) {
      assert.equal(workflowText(source), englishMessages[source]);
      assert.equal(workflowText(defaults[source]), englishMessages[source]);
    }
  });
  const plan = defaultWorkflow('en').nodes.find(node => node.id === 'plan')!;
  assert.equal(plan.name, englishMessages['工程设计']);
});

test('custom names, edited goals, other default material, and template characters remain verbatim in both languages', async () => {
  const custom = [
    '我的自定义工作流 {value0} ${value1}',
    'Custom workflow `name` <tag>',
    '需求规格 · 自定义',
    'Requirements specification (custom)',
    '  工程设计  ',
    `${defaultWorkflow().nodes[0].prompt}\n用户增加的目标 {value0}`,
    `Custom prefix: ${defaultWorkflow('en').nodes[0].prompt}`,
    '工程设置', // Known interface copy outside the workflow whitelist remains user text here.
    'CSV 导入验收项目',
    defaults['CSV 导入验收项目'],
    '实现说明',
    defaults['实现说明'],
    '',
  ];
  for (const locale of ['en', 'zh-CN'] as const) await inLocale(locale, () => assert.deepEqual(custom.map(workflowText), custom));
});

test('finding severity has a distinct Blocker label without changing the workflow Blocked status', () => {
  assert.equal(translate('阻塞问题', 'en'), 'Blocker');
  assert.equal(translate('阻塞', 'en'), 'Blocked');
  assert.equal(translate('阻塞问题', 'zh-CN'), '阻塞问题');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import ts from 'typescript';
import { englishMessages, formatDate, normalizeLocale, translate } from '../packages/i18n/index.ts';
import { defaultWorkflow } from '../packages/domain/index.ts';
import { getLocale, localizedLabels, setLocale, t } from '../apps/web/src/i18n.ts';
import { fixture, runNode } from './helpers.ts';

test('language negotiation respects supported language order and HTTP quality values', () => {
  assert.equal(normalizeLocale('en-US,en;q=0.9,zh-CN;q=0.5'), 'en');
  assert.equal(normalizeLocale('en;q=0,zh-CN;q=0.9'), 'zh-CN');
  assert.equal(normalizeLocale('zh-TW,en;q=0.9'), 'zh-CN');
  assert.equal(normalizeLocale(['fr-FR', 'en-GB']), 'en');
  assert.equal(normalizeLocale('fr-FR'), 'zh-CN');
  assert.equal(normalizeLocale('zh-CN;q=0.4,en;q=0.8'), 'en');
});

test('messages interpolate values once and preserve unknown user text and template characters', () => {
  assert.equal(translate('缺少 spec', 'en'), 'Missing spec');
  assert.equal(translate('待处理 {0} 项', 'en', { 0: 3 }), '3 pending items');
  assert.equal(translate('待处理 {0} 项', 'zh-CN', { 0: 3 }), '待处理 3 项');
  assert.equal(translate('待处理 {0} 项', 'en', { 0: '$& {another} 中文' }), '$& {another} 中文 pending items');
  assert.equal(translate('用户编写的任意需求 {id}', 'en'), '用户编写的任意需求 {id}');
  assert.equal(translate('待处理 {0} 项', 'en', { 0: undefined }), ' pending items');
  assert.equal(formatDate(undefined, 'en'), '—');
  assert.equal(formatDate('invalid', 'en'), '—');
  assert.ok(!/\p{Script=Han}/u.test(formatDate('2026-10-21T12:34:00Z', 'en')));
});

test('OpenCode composite capability descriptions and the official Maka release notice are translated in full', async () => {
  const { messages } = await import('../packages/i18n/server.ts');
  const notices = ['OpenCode HTTP API 没有原运行的安全恢复协议；可以重新核对原会话状态，继续执行需创建新尝试。', 'OpenCode 步数采用会话轮询监测和工具授权预算，非原生硬上限；自动允许的读取及两次轮询之间可能继续执行。', '只读执行依赖可信的用户级 OpenCode 工具与插件配置；HTTP API 无法辨认同名工具覆盖，用户级插件仍可能越过工具权限。工作区本地配置与扩展在激活前拒绝；工程阶段另有工作树变化检查阻塞异常写入。'];
  assert.equal(translate(notices.join(' '), 'en'), notices.map(notice => messages[notice]).join(' '));
  const release = JSON.parse(await readFile(new URL('../config/maka-release.json', import.meta.url), 'utf8'));
  assert.ok(!/\p{Script=Han}/u.test(translate(release.reason, 'en')));
  assert.equal(release.packageVersion, '0.2.0');
});

test('switching language updates module-level labels without replacing their keys', async () => {
  const before = getLocale(), labels = localizedLabels({ pending: '待执行' });
  try {
    await setLocale('en');
    assert.equal(labels.pending, 'Pending');
    assert.equal(t('开发流程'), 'Workflow');
    assert.deepEqual(Object.keys(labels), ['pending']);
    await setLocale('zh-CN');
    assert.equal(labels.pending, '待执行');
  } finally { await setLocale(before); }
});

test('all renderer message literals have English translations and no untranslated JSX', async () => {
  const directory = new URL('../apps/web/src/', import.meta.url), missing: string[] = [];
  for (const name of await readdir(directory)) {
    if (!/\.tsx?$/.test(name)) continue;
    const source = ts.createSourceFile(name, await readFile(new URL(name, directory), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const key = node.arguments[0].text;
        if (/\p{Script=Han}/u.test(key) && !Object.hasOwn(englishMessages, key)) missing.push(`${name}: ${key}`);
      }
      const languageOption = ts.isJsxText(node) && ts.isJsxElement(node.parent) && node.parent.openingElement.tagName.getText(source) === 'option' && node.text === '中文';
      if (ts.isJsxText(node) && /\p{Script=Han}/u.test(node.text) && !languageOption) missing.push(`${name}: untranslated JSX ${node.text}`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(missing, []);
  assert.deepEqual(Object.entries(englishMessages).filter(([, value]) => /\p{Script=Han}/u.test(value)), []);
});

test('English workflows preserve execution identity and language across later UI changes and both reviews', async () => {
  const f = await fixture();
  try {
    const item = await f.service.createWorkItem(f.item.projectId, 'English feature', 'Support CSV import.', 'feature', [], 'en');
    const run = f.store.list('runs', value => value.workItemId === item.id).at(-1)!;
    assert.equal(run.definition.locale, 'en');
    assert.ok(run.definition.nodes.every(node => !/\p{Script=Han}/u.test(node.name + node.prompt)));
    assert.deepEqual(run.definition.nodes.map(node => node.id), defaultWorkflow().nodes.map(node => node.id));
    const specification = await runNode(f, 'specify');
    assert.equal(specification.execution, 'completed');
    const attempt = f.store.get('attempts', specification.currentAttemptId!);
    assert.match(attempt.prompt, /Write generated summaries, documents, human briefs, findings, and clarification questions in English/);
    assert.match(f.store.list('artifactRevisions').at(-1)!.content, /CSV/);
    await setLocale('zh-CN');
    assert.equal(f.store.get('attempts', attempt.id).prompt, attempt.prompt);
    assert.equal(f.store.get('runs', run.id).definition.locale, 'en');
    const clarificationNode = await runNode(f, 'clarify');
    assert.equal(clarificationNode.execution, 'waiting_interaction');
    const session = f.store.list('clarifications').at(-1)!;
    await f.service.answerClarification(session.id, session.revision, session.questions.filter(question => !question.answer).map(question => ({ questionId: question.id, answer: question.options[0] })));
    await f.service.waitForIdle();
    const clarified = f.store.list('artifactRevisions').at(-1)!;
    assert.match(clarified.content, /## Clarification record/);
    assert.ok(!/\p{Script=Han}/u.test(clarified.content), 'English specifications must not gain Chinese application framing');
    const review = await runNode(f, 'review-spec');
    assert.equal(review.gate, 'passed');
    const reviews = f.store.list('attempts', value => value.nodeRunId === review.id);
    assert.equal(reviews.length, 2);
    assert.ok(reviews.every(value => value.prompt.includes('Write review summaries') && value.target.backend === 'sandbox'));
    assert.deepEqual(reviews.map(value => value.review?.perspective), ['coverage', 'adversarial']);
    const revision = f.store.list('artifactRevisions').at(-1)!;
    assert.match(f.service.artifacts.readingHtml(revision.id), /<html lang="en">/);
  } finally { await f.cleanup(); }
});

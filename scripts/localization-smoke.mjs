import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { createEngineeringRuntime } from '../packages/specflow-core/index.ts';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import { createApp } from '../apps/server/src/app.ts';

// Run after `npm run build` with Node 24+: node --import tsx scripts/localization-smoke.mjs.
// Set SPECFLOW_CHROMIUM to use an existing browser instead of Playwright's managed browser.
const root = resolve(import.meta.dirname, '..');
const output = join(root, '.tools/localization-qa');
const dataDir = await mkdtemp(join(tmpdir(), 'specflow-localization-smoke-'));
const report = { testedAt: new Date().toISOString(), dataDir, checks: [], surfaces: [], errors: [] };
await mkdir(output, { recursive: true });
const runtime = await createEngineeringRuntime({ dataDir, backends: { sandbox: new SandboxBackend() }, defaultBackend: 'sandbox' });
let app, browser;
try {
  const { service, store } = runtime;
  await service.seedDemo('en');
  const item = store.list('workItems')[0], project = store.get('projects', item.projectId);
  async function run(nodeId) {
    const node = store.list('nodes', node => node.nodeId === nodeId).at(-1);
    await service.startNode(node.id, node.revision);
    await service.waitForIdle();
    const finished = store.get('nodes', node.id);
    assert.notEqual(finished.execution, 'failed', finished.error);
    return finished;
  }
  async function accept(logicalId) {
    const artifact = store.list('artifacts', artifact => artifact.logicalId === logicalId)[0];
    await service.acceptArtifact(artifact.id, artifact.revision);
  }
  await run('specify');
  await run('clarify');
  const session = store.list('clarifications').at(-1);
  await service.answerClarification(session.id, session.revision, session.questions.map(question => ({ questionId: question.id, answer: question.options[0] })));
  await service.waitForIdle();
  for (const [reviewId, logicalId, nextId] of [['review-spec', 'spec', 'plan'], ['review-plan', 'plan', 'tasks'], ['review-tasks', 'tasks', 'implement']]) {
    await run(reviewId); await accept(logicalId); await run(nextId);
  }
  await run('verify');
  report.checks.push('English demo produces accepted specifications, design and tasks, candidate code, and real verification evidence.');
  app = await createApp(service, { staticRoot: resolve(root, 'dist/web') });
  const origin = await app.listen({ host: '127.0.0.1', port: 0 });
  const browserPath = process.env.SPECFLOW_CHROMIUM || chromium.executablePath();
  assert.ok(existsSync(browserPath), `Chromium was not found at ${browserPath}. Install it with npx playwright install chromium, or set SPECFLOW_CHROMIUM to an existing Chromium executable.`);
  browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', acceptDownloads: true });
  // Deliberately use a Chinese browser locale to prove the selected app preference wins.
  await context.addInitScript(() => { if (!localStorage.getItem('specflow-locale')) localStorage.setItem('specflow-locale', 'en'); });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.setDefaultTimeout(15000);
  const location = view => `${origin}/?${new URLSearchParams({ project: project.id, item: item.id, view })}`;
  async function ready() {
    await expect(page.locator('.workitem-heading h1')).toHaveText(item.name);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.sync-bar')).toHaveCount(0);
  }
  async function audit(name, screenshot = true) {
    const result = await page.evaluate(() => {
      const chinese = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,pre,code,textarea,input,option,[lang="zh-CN"]') || !parent.checkVisibility()) continue;
        const text = node.textContent.trim();
        if (/\p{Script=Han}/u.test(text)) chinese.push(text);
      }
      const attrs = [];
      for (const element of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
        if (!element.checkVisibility() || element.closest('pre,code,option')) continue;
        for (const attribute of ['aria-label', 'title', 'placeholder']) {
          const value = element.getAttribute(attribute);
          if (value && /\p{Script=Han}/u.test(value)) attrs.push({ tag: element.tagName, attribute, value });
        }
      }
      return { chinese, attrs, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].filter(element => element.checkVisibility() && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent.slice(0, 100) })) };
    });
    report.surfaces.push({ name, ...result });
    if (screenshot) await page.screenshot({ path: join(output, `${name}.png`), fullPage: !/modal|drawer/.test(name) });
    assert.deepEqual(result.chinese, [], `${name}: visible app-owned Chinese text`);
    assert.deepEqual(result.attrs, [], `${name}: Chinese accessibility/title/placeholder copy`);
    assert.ok(result.scrollWidth <= result.width + 1, `${name}: horizontal overflow ${result.scrollWidth} > ${result.width}`);
  }
  const tabs = ['flow', 'requirements', 'artifacts', 'code', 'runs'];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const view of tabs) {
      await page.goto(location(view)); await ready();
      if (view === 'artifacts') await expect(page.locator('.reading-paper')).toBeVisible();
      if (view === 'code') await expect(page.locator('.candidate-info')).toBeVisible();
      if (view === 'runs') await expect(page.locator('.attempt-detail .identity-list').first()).toBeVisible();
      await audit(`${width}-${view}`);
      if (view === 'artifacts') {
        await page.getByRole('button', { name: 'AI execution document', exact: true }).click();
        await expect(page.locator('.markdown-document')).toBeVisible();
        await audit(`${width}-artifacts-execution`);
        await page.getByRole('button', { name: 'Compare', exact: true }).click();
        await expect(page.locator('.document-compare')).toBeVisible();
        await audit(`${width}-artifacts-compare`);
      }
    }
  }
  report.checks.push('All five tabs render in English at 1440×1000 and 390×1000 without visible app-owned Chinese text or horizontal body overflow.');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(location('flow')); await ready();
  const dialogs = [
    ['settings', () => page.locator('.top-actions').getByRole('button', { name: 'Project settings', exact: true }).click()],
    ['project', () => page.getByRole('button', { name: 'Open Git repository', exact: true }).click()],
    ['item', () => page.getByRole('button', { name: 'New work item', exact: true }).click()],
    ['workflow', () => page.getByRole('button', { name: 'Edit workflow', exact: true }).click()],
    ['import', async () => { await page.locator('#tab-artifacts').click(); await page.getByRole('button', { name: 'Import documents', exact: true }).click(); }],
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, open] of dialogs) {
      await page.goto(location('flow')); await ready();
      if (width === 390 && ['project', 'item'].includes(name)) await page.getByRole('button', { name: 'Open workspace navigation', exact: true }).click();
      await open(); await expect(page.locator('.modal')).toBeVisible();
      await audit(`${width}-modal-${name}`);
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    }
  }
  report.checks.push('Project settings, project registration, new work item, workflow editor, and import modals render in English at both viewport sizes.');

  await page.locator('#tab-requirements').click();
  const draft = 'Unsaved QA draft — 用户正文 is preserved verbatim.';
  await page.getByRole('textbox', { name: 'Requirements', exact: true }).fill(draft);
  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  assert.equal(await page.getByRole('textbox', { name: '需求正文', exact: true }).inputValue(), draft);
  await page.getByRole('combobox', { name: '界面语言', exact: true }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  assert.equal(await page.getByRole('textbox', { name: 'Requirements', exact: true }).inputValue(), draft);
  await page.reload(); await ready();
  assert.equal(await page.getByRole('textbox', { name: 'Requirements', exact: true }).inputValue(), draft);
  assert.equal(await page.evaluate(() => localStorage.getItem('specflow-locale')), 'en');
  report.checks.push('English → Chinese → English keeps the unsaved requirements draft; reload restores English and the exact draft.');

  await page.locator('#tab-artifacts').click(); await expect(page.locator('.reading-paper')).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'HTML reading page', exact: true }).click();
  const download = await downloadEvent;
  const htmlPath = join(output, 'english-reading-download.html'); await download.saveAs(htmlPath);
  const html = await readFile(htmlPath, 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.doesNotMatch(html, /阅读简报|来源版本/);
  report.checks.push('HTML download honors English even when browser Accept-Language is Chinese.');

  const implementation = store.list('nodes', node => node.nodeId === 'implement').at(-1);
  const drawerLocation = `${location('flow')}&node=${implementation.id}&mode=pinned`;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(drawerLocation); await ready();
    if (!await page.locator('.attempt-link').isVisible()) await page.locator('.flow-layout-controls button').click();
    await page.locator('.attempt-link').click();
    await expect(page.locator('.detail-drawer .identity-list').first()).toBeVisible();
    await audit(`${width}-run-drawer`);
    await page.getByRole('button', { name: 'Close details', exact: true }).click();
  }
  report.checks.push('Run details drawer renders frozen execution identity and controls in English on desktop and mobile.');
  assert.deepEqual(report.errors, [], 'Browser errors');
  report.success = true;
  console.log(`Localization smoke passed: ${report.surfaces.length} surfaces. Report: ${join(output, 'localization-smoke.json')}`);
} catch (error) {
  report.success = false; report.failure = error.stack || String(error);
  const page = browser?.contexts()[0]?.pages()[0];
  if (page && !page.isClosed()) await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {});
  console.error(report.failure); process.exitCode = 1;
} finally {
  await writeFile(join(output, 'localization-smoke.json'), JSON.stringify(report, null, 2));
  await browser?.close(); await app?.close(); await runtime.close();
  const safeTemp = resolve(dataDir);
  assert.ok(safeTemp.startsWith(resolve(tmpdir())) && basename(safeTemp).startsWith('specflow-localization-smoke-'));
  await rm(safeTemp, { recursive: true, force: true });
}

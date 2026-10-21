import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readDesktopLocale, saveDesktopLocale } from '../apps/desktop/locale.ts';
import { translate } from '../packages/i18n/index.ts';

test('desktop language follows the system until an explicit preference is persisted', () => {
  const directory = mkdtempSync(join(tmpdir(), 'specflow-locale-')), path = join(directory, 'locale.json');
  try {
    assert.equal(readDesktopLocale(path, 'en-US'), 'en');
    assert.equal(readDesktopLocale(path, 'zh-TW'), 'zh-CN');
    saveDesktopLocale(path, 'en');
    assert.equal(readDesktopLocale(path, 'zh-CN'), 'en');
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { locale: 'en' });
    assert.throws(() => saveDesktopLocale(path, 'invalid'));
    assert.equal(readDesktopLocale(path, 'zh-CN'), 'en');
    writeFileSync(path, '{invalid');
    assert.equal(readDesktopLocale(path, 'en-GB'), 'en');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('native failures and update statuses interpolate values in the selected language', () => {
  assert.equal(translate('工程服务启动失败（{0}）。诊断日志：{1}', 'en', { 0: 7, 1: 'C:\\诊断\\app.log' }), 'The engineering service failed to start (7). Diagnostic log: C:\\诊断\\app.log');
  assert.equal(translate('正在下载 {0}（{1}%）', 'en', { 0: '0.2.0', 1: 42 }), 'Downloading 0.2.0 (42%)');
  assert.equal(translate('下载与发行说明', 'en'), 'Downloads and Release Notes');
  assert.equal(translate('下载与发行说明', 'zh-CN'), '下载与发行说明');
});

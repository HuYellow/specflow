import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { renderDesktopChangelog } = await import(pathToFileURL(resolve('scripts/desktop-changelog.mjs')).href);
const sha = (digit: string) => digit.repeat(40);
const evidence = { version: '1.2.3', tag: 'desktop-v1.2.3', repository: 'HuYellow/specflow', sourceSha: sha('a'), previousTag: 'desktop-v1.2.1', commits: [] };

test('a reader can find every meaningful commit under its category, including direct commits without PRs', () => {
  const subjects = ['feat(ui): 新增工程列表', 'fix: 修复安装路径', 'perf: 减少启动等待', 'refactor(api): 拆分请求', 'docs: 更新指南', 'test: 添加回归', 'ci: 自动发布', 'build: 固定工具', 'chore: 更新配置', '修复中文输入', 'feat: merge branch 功能仍需保留'];
  const commits = subjects.map((subject, index) => ({ sha: index.toString(16).repeat(40), subject }));
  const notes = renderDesktopChangelog({ ...evidence, commits: [...commits, { sha: sha('b'), subject: 'Merge pull request #18 from feature' }, { sha: sha('c'), subject: "Merge branch 'main'" }] });
  for (const category of ['新功能', '问题修复', '性能', '改进', '文档', '工程维护', '其他变更']) assert.ok(notes.includes(`### ${category}\n`));
  for (const subject of ['新增工程列表', '修复安装路径', '减少启动等待', '拆分请求', '更新指南', '添加回归', '自动发布', '固定工具', '更新配置', '修复中文输入', '功能仍需保留']) assert.ok(notes.includes(subject), subject);
  assert.ok(!notes.includes('Merge pull request'));
  assert.ok(!notes.includes("Merge branch"));
  assert.ok(notes.includes('desktop-v1.2.1...desktop-v1.2.3'));
  assert.ok(!notes.includes('desktop-v1.2.2'), 'only the supplied published baseline is used');
});

test('breaking commit markers receive a separate warning while retaining their normal classification', () => {
  const notes = renderDesktopChangelog({ ...evidence, commits: [{ sha: sha('b'), subject: 'feat(api)!: 重置配置结构' }, { sha: sha('c'), subject: 'BREAKING CHANGE: 移除旧连接' }] });
  assert.match(notes, /### 不兼容变更提醒/);
  assert.match(notes, /升级前备份工程数据/);
  assert.equal(notes.match(/重置配置结构/g)?.length, 2);
  assert.match(notes, /### 新功能/);
  assert.match(notes, /移除旧连接/);
});

test('a breaking-change footer warns about an ordinary feature commit and retains the migration evidence', () => {
  const notes = renderDesktopChangelog({ ...evidence, commits: [{ sha: sha('b'), subject: 'feat(api): 更新连接配置', body: '实现统一结构。\n\nBREAKING CHANGE: 旧连接需迁移，参见 @maintainer <guide>。\n迁移的其他细节。' }] });
  assert.match(notes, /### 不兼容变更提醒/);
  assert.match(notes, /### 新功能/);
  assert.equal(notes.match(/更新连接配置/g)?.length, 2);
  assert.ok(notes.includes('旧连接需迁移'));
  assert.ok(notes.includes('&#64;maintainer &lt;guide&gt;'));
  assert.ok(notes.includes(`/commit/${sha('b')}`));
  const ordinary = renderDesktopChangelog({ ...evidence, commits: [{ sha: sha('c'), subject: 'feat: 支持迁移说明', body: '文档举例说明 BREAKING CHANGE: 的使用。' }] });
  assert.ok(!ordinary.includes('不兼容变更提醒'), 'a body mention is not a footer');
});

test('commit titles and supplementary PR text remain literal Unicode text without HTML, Markdown or mentions', () => {
  const notes = renderDesktopChangelog({ ...evidence, commits: [{ sha: sha('b'), subject: 'fix: 中文 🚀 <img src=x onerror=alert(1)> [click](javascript:alert(1)) @team **bold** `code`\n## forged' }], releaseNotes: '# PR @owner\n<script>alert(1)</script>' });
  assert.ok(notes.includes('中文 🚀'));
  assert.ok(notes.includes('&lt;img'));
  assert.ok(notes.includes('&#64;team'));
  assert.ok(notes.includes('\\[click\\]'));
  assert.ok(notes.includes('\\*\\*bold\\*\\*'));
  assert.ok(!notes.includes('<img'));
  assert.ok(!notes.includes('<script>'));
  assert.ok(!notes.includes('@team'));
  assert.ok(!notes.includes('@owner'));
  assert.ok(!notes.includes('\n## forged'));
  assert.match(notes, /## GitHub 补充说明/);
});

test('first and empty releases are explicit and do not manufacture change or validation claims', () => {
  const first = renderDesktopChangelog({ ...evidence, previousTag: undefined });
  assert.match(first, /首次正式发布/);
  assert.match(first, /未提供可列出的提交记录/);
  assert.ok(!first.includes('/compare/'));
  assert.match(first, /本次发行签名状态/);
  assert.ok(!first.includes('已签名'));
  assert.ok(!first.includes('未签名'));
  assert.ok(!first.includes('全部通过'));
  assert.match(first, /以本次 Actions 记录为准/);
  assert.match(first, /Apache Maka 0\.2\.0/);
  assert.match(first, /需要本机 Git/);
  const empty = renderDesktopChangelog(evidence);
  assert.match(empty, /没有可列出的新提交/);
});

test('download links cover every native architecture and expose only evidence-backed signing states', () => {
  const notes = renderDesktopChangelog({ ...evidence, capabilities: { winSigned: true, macSigned: false, macNotarized: false } });
  for (const name of ['SpecFlow-1.2.3-win-x64.exe', 'SpecFlow-1.2.3-mac-arm64.dmg', 'SpecFlow-1.2.3-mac-x64.dmg', 'SpecFlow-1.2.3-mac-arm64.zip', 'SpecFlow-1.2.3-mac-x64.zip', 'SHA256SUMS.txt']) assert.ok(notes.includes(`/desktop-v1.2.3/${name}`), name);
  assert.match(notes, /Windows Authenticode：已签名/);
  assert.match(notes, /macOS Developer ID：未签名/);
  assert.match(notes, /Apple 公证：未公证/);
  assert.ok(notes.includes(`/commit/${sha('a')}`));
});

test('GitHub URL components are encoded and invalid repository or commit inputs cannot inject targets', () => {
  const notes = renderDesktopChangelog({ ...evidence, tag: 'desktop/版本 #3', previousTag: 'desktop/版本 #1' });
  assert.ok(notes.includes('/compare/desktop%2F%E7%89%88%E6%9C%AC%20%231...desktop%2F%E7%89%88%E6%9C%AC%20%233'));
  assert.ok(notes.includes('/download/desktop%2F%E7%89%88%E6%9C%AC%20%233/'));
  const delimiterTag = renderDesktopChangelog({ ...evidence, tag: "tag')# forged", previousTag: 'tag(old)' });
  assert.ok(delimiterTag.includes('/download/tag%27%29%23%20forged/'));
  assert.ok(delimiterTag.includes('/compare/tag%28old%29...tag%27%29%23%20forged'));
  for (const repository of ['https://evil.example/x', 'owner/repo/extra', 'owner/repo?redirect=bad', 'owner/@team', 'owner/repo\n# forged', 'owner/repo\n']) assert.throws(() => renderDesktopChangelog({ ...evidence, repository }), /repository/);
  assert.throws(() => renderDesktopChangelog({ ...evidence, sourceSha: '../bad' }), /SHA/);
  assert.throws(() => renderDesktopChangelog({ ...evidence, commits: [{ sha: 'bad)', subject: 'fix: injected' }] }), /commit/);
  assert.throws(() => renderDesktopChangelog({ ...evidence, previousTag: 'tag\nforged' }), /tag/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownView } from '../apps/web/src/MarkdownView.tsx';
import { countChanges, diffText, findTextAnchors, parseUnifiedDiff, safeMarkdownHref } from '../apps/web/src/review-model.ts';

test('patch keeps source line numbers and excludes headers from statistics', () => {
  const patch = 'diff --git a/old.ts b/new.ts\nsimilarity index 70%\nrename from old.ts\nrename to new.ts\n--- a/old.ts\n+++ b/new.ts\n@@ -8,3 +12,3 @@ function demo\n context\n--- actual removed text\n+++ actual added text\n end\n\\ No newline at end of file\n';
  const [file] = parseUnifiedDiff(patch);
  assert.equal(file.path, 'new.ts'); assert.equal(file.previousPath, 'old.ts'); assert.equal(file.status, 'renamed');
  const lines = file.hunks[0].lines;
  assert.deepEqual(countChanges(lines), { added: 1, removed: 1 });
  assert.deepEqual(lines.map(line => [line.oldLine, line.newLine]), [[8, 12], [9, undefined], [undefined, 13], [10, 14], [undefined, undefined]]);
  assert.equal(lines[1].text, '-- actual removed text');
});

test('patch recognizes new, deleted, binary, multiple files and omitted hunk counts', () => {
  const files = parseUnifiedDiff('diff --git a/new b/new\nnew file mode 100644\n--- /dev/null\n+++ b/new\n@@ -0,0 +1 @@\n+created\ndiff --git a/old b/old\ndeleted file mode 100644\n--- a/old\n+++ /dev/null\n@@ -1 +0,0 @@\n-removed\ndiff --git a/photo b/photo\nBinary files a/photo and b/photo differ\n');
  assert.deepEqual(files.map(file => [file.path, file.status, file.binary]), [['new', 'added', false], ['old', 'deleted', false], ['photo', 'modified', true]]);
  assert.deepEqual(countChanges(files.flatMap(file => file.hunks.flatMap(hunk => hunk.lines))), { added: 1, removed: 1 });
  assert.deepEqual(parseUnifiedDiff(''), []);
});

test('document difference reconstructs both revisions and preserves unchanged alignment', () => {
  const before = '# Heading\nunchanged\nold paragraph\nlast', after = '# Heading\nunchanged\nnew paragraph\nadditional\nlast';
  const lines = diffText(before, after);
  assert.equal(lines.filter(line => line.kind !== 'added').map(line => line.text).join('\n'), before);
  assert.equal(lines.filter(line => line.kind !== 'removed').map(line => line.text).join('\n'), after);
  assert.deepEqual(countChanges(lines), { added: 2, removed: 1 });
  assert.deepEqual(lines.at(-1), { kind: 'context', text: 'last', oldLine: 4, newLine: 5 });
  assert.deepEqual(countChanges(diffText('', 'first\nsecond')), { added: 2, removed: 0 });
  assert.deepEqual(diffText('', ''), []);
});

test('large unrelated revisions remain bounded and reconstructable', () => {
  const before = Array.from({ length: 1600 }, (_, index) => `old ${index}`).join('\n');
  const after = Array.from({ length: 1600 }, (_, index) => `new ${index}`).join('\n');
  const result = diffText(before, after);
  assert.deepEqual(countChanges(result), { added: 1600, removed: 1600 });
  assert.equal(result.filter(line => line.kind !== 'added').map(line => line.text).join('\n'), before);
  assert.equal(result.filter(line => line.kind !== 'removed').map(line => line.text).join('\n'), after);
});

test('long document revisions preserve unchanged paragraphs between distant edits', () => {
  const before = Array.from({ length: 3000 }, (_, index) => `paragraph ${index}`);
  const after = [...before]; after[1] = 'changed first'; after[2998] = 'changed last';
  const result = diffText(before.join('\n'), after.join('\n'));
  assert.deepEqual(countChanges(result), { added: 2, removed: 2 });
  assert.equal(result.filter(line => line.kind === 'context').length, 2998);
});

test('text anchors expose ambiguity and Markdown links reject executable schemes', () => {
  assert.deepEqual(findTextAnchors('相同段落\n第二段\n相同段落', '相同段落'), [0, 9]);
  assert.deepEqual(findTextAnchors('aaa', 'aa'), [0, 1]);
  assert.deepEqual(findTextAnchors('text', ''), []);
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///C:/test', '//example.com', 'java\nscript:alert(1)', 'https://safe.test\nunsafe']) assert.equal(safeMarkdownHref(value), undefined);
  assert.equal(safeMarkdownHref('https://example.com/docs'), 'https://example.com/docs');
  assert.equal(safeMarkdownHref('#heading'), '#heading');
});

test('Markdown preview escapes raw HTML and keeps unsafe links inert', () => {
  const result = renderToStaticMarkup(createElement(MarkdownView, { content: '# 目标\n<script>alert(1)</script>\n\n[危险](javascript:alert) [文档](https://example.com)\n\n```html\n<img src=x onerror=alert(1)>\n```', idPrefix: 'test' }));
  assert.match(result, /aria-label="文档目录"/);
  assert.match(result, /id="test-heading-0"/);
  assert.match(result, /&lt;script&gt;/);
  assert.doesNotMatch(result, /<script|<img|href="javascript:/);
  assert.match(result, /href="https:\/\/example.com"/);
});

test('deterministic review sample covers 50 files and 10,000 content lines', context => {
  const patch = Array.from({ length: 50 }, (_, index) => `diff --git a/file-${index}.ts b/file-${index}.ts\n--- a/file-${index}.ts\n+++ b/file-${index}.ts\n@@ -301,100 +401,100 @@\n${Array.from({ length: 100 }, (_, line) => `-old-${index}-${line}\n+new-${index}-${line}`).join('\n')}\n`).join('');
  const start = performance.now(), files = parseUnifiedDiff(patch);
  const lines = files.flatMap(file => file.hunks.flatMap(hunk => hunk.lines));
  assert.equal(files.length, 50); assert.equal(lines.length, 10_000);
  assert.deepEqual(countChanges(lines), { added: 5000, removed: 5000 });
  assert.equal(files[49].hunks[0].lines.at(-1)?.newLine, 500);
  context.diagnostic(`50 files / 10,000 content lines parsed and checked in ${(performance.now() - start).toFixed(1)} ms`);
});

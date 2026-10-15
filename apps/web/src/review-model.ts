export type ReviewLine = { kind: 'context' | 'added' | 'removed' | 'note'; text: string; oldLine?: number; newLine?: number };
export type ReviewHunk = { header: string; oldStart: number; newStart: number; lines: ReviewLine[] };
export type ReviewFile = { path: string; previousPath?: string; status: string; binary: boolean; hunks: ReviewHunk[]; metadata: string[] };

/** File headers never enter content statistics; line numbers come only from hunk ranges. */
export function parseUnifiedDiff(patch: string): ReviewFile[] {
  const files: ReviewFile[] = [];
  let file: ReviewFile | undefined, hunk: ReviewHunk | undefined, oldLine = 0, newLine = 0;
  const ensureFile = () => file || (file = { path: '补丁', status: 'modified', binary: false, hunks: [], metadata: [] }, files.push(file), file);
  for (const line of patch.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('diff --git ')) {
      const paths = line.slice(11).match(/"(?:\\.|[^"])*"|\S+/g) || [];
      const decode = (value: string) => { try { return value.startsWith('"') ? JSON.parse(value) as string : value; } catch { return value; } };
      file = { path: decode(paths[1] || paths[0] || '补丁').replace(/^b\//, ''), previousPath: decode(paths[0] || '').replace(/^a\//, ''), status: 'modified', binary: false, hunks: [], metadata: [] };
      files.push(file); hunk = undefined; continue;
    }
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (match) {
      oldLine = Number(match[1]); newLine = Number(match[3]);
      hunk = { header: line, oldStart: oldLine, newStart: newLine, lines: [] }; ensureFile().hunks.push(hunk); continue;
    }
    if (hunk && line.startsWith('\\')) { hunk.lines.push({ kind: 'note', text: line }); continue; }
    if (hunk && line.startsWith('+')) { hunk.lines.push({ kind: 'added', text: line.slice(1), newLine: newLine++ }); continue; }
    if (hunk && line.startsWith('-')) { hunk.lines.push({ kind: 'removed', text: line.slice(1), oldLine: oldLine++ }); continue; }
    if (hunk && line.startsWith(' ')) { hunk.lines.push({ kind: 'context', text: line.slice(1), oldLine: oldLine++, newLine: newLine++ }); continue; }
    if (!line) continue;
    const current = ensureFile(); hunk = undefined; current.metadata.push(line);
    if (line.startsWith('new file mode ')) current.status = 'added';
    if (line.startsWith('deleted file mode ')) current.status = 'deleted';
    if (line.startsWith('rename from ')) { current.status = 'renamed'; current.previousPath = line.slice(12); }
    if (line.startsWith('rename to ')) current.path = line.slice(10);
    if (line.startsWith('Binary files ') || line === 'GIT binary patch') current.binary = true;
    if (line.startsWith('+++ ') && line !== '+++ /dev/null') current.path = line.slice(4).replace(/^b\//, '');
    if (line.startsWith('--- ') && line !== '--- /dev/null') current.previousPath = line.slice(4).replace(/^a\//, '');
  }
  return files;
}

/** Exact line alignment with bounded work. Very large unrelated blocks remain an explicit replacement. */
export function diffText(before: string, after: string): ReviewLine[] {
  const lines = (text: string) => text === '' ? [] : text.replace(/\r\n/g, '\n').split('\n');
  const left = lines(before), right = lines(after), edits: Omit<ReviewLine, 'oldLine' | 'newLine'>[] = [];
  let prefix = 0, suffix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++;
  while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix++;
  const emit = (kind: ReviewLine['kind'], text: string) => edits.push({ kind, text });
  left.slice(0, prefix).forEach(text => emit('context', text));
  function align(a: string[], b: string[], depth = 0) {
  if (!a.length) { b.forEach(text => emit('added', text)); return; }
  if (!b.length) { a.forEach(text => emit('removed', text)); return; }
  if (a.length * b.length <= 2_000_000) {
    const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { emit('context', a[i++]); j++; }
      else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) emit('removed', a[i++]);
      else emit('added', b[j++]);
    }
  } else {
    // Patience anchors preserve unchanged paragraphs without a quadratic table for long revisions.
    const unique = (values: string[]) => { const map = new Map<string, number>(); values.forEach((text, index) => map.set(text, map.has(text) ? -1 : index)); return map; };
    const first = unique(a), second = unique(b);
    const pairs = [...first].flatMap(([text, index]) => index >= 0 && (second.get(text) ?? -1) >= 0 ? [{ a: index, b: second.get(text)! }] : []);
    const tails: number[] = [], previous = new Int32Array(pairs.length).fill(-1);
    for (let i = 0; i < pairs.length; i++) {
      let low = 0, high = tails.length;
      while (low < high) { const middle = (low + high) >>> 1; if (pairs[tails[middle]].b < pairs[i].b) low = middle + 1; else high = middle; }
      if (low) previous[i] = tails[low - 1]; tails[low] = i;
    }
    const anchors: typeof pairs = []; let cursor = tails.at(-1) ?? -1;
    while (cursor >= 0) { anchors.push(pairs[cursor]); cursor = previous[cursor]; } anchors.reverse();
    if (!anchors.length || depth > 64) { a.forEach(text => emit('removed', text)); b.forEach(text => emit('added', text)); }
    else {
      let aOffset = 0, bOffset = 0;
      for (const anchor of anchors) { align(a.slice(aOffset, anchor.a), b.slice(bOffset, anchor.b), depth + 1); emit('context', a[anchor.a]); aOffset = anchor.a + 1; bOffset = anchor.b + 1; }
      align(a.slice(aOffset), b.slice(bOffset), depth + 1);
    }
  }
  }
  align(left.slice(prefix, left.length - suffix), right.slice(prefix, right.length - suffix));
  left.slice(left.length - suffix).forEach(text => emit('context', text));
  let oldLine = 1, newLine = 1;
  return edits.map(line => ({ ...line, oldLine: line.kind !== 'added' ? oldLine++ : undefined, newLine: line.kind !== 'removed' ? newLine++ : undefined }));
}

export function countChanges(lines: ReviewLine[]) {
  return { added: lines.filter(line => line.kind === 'added').length, removed: lines.filter(line => line.kind === 'removed').length };
}

export function findTextAnchors(content: string, anchor: string): number[] {
  if (!anchor) return [];
  const matches: number[] = [];
  let offset = 0, found: number;
  while ((found = content.indexOf(anchor, offset)) !== -1) { matches.push(found); offset = found + 1; }
  return matches;
}

export function safeMarkdownHref(href: string): string | undefined {
  const value = href.trim();
  if (/^(?:https?:\/\/|mailto:|#)/i.test(value) && !/[\u0000-\u0020\u007f]/.test(value)) return value;
  return undefined;
}

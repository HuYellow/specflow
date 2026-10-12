import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { MAKA_VERSION, verifyMakaRelease } from './release-policy.ts';
export { MAKA_VERSION } from './release-policy.ts';
const digest = (content: string) => createHash('sha256').update(content).digest('hex');
export async function applyWindowsCompatibility(packageRoot: string) {
  await verifyMakaRelease(packageRoot);
  if (process.platform !== 'win32') return { applied: false, reason: 'non-windows' };
  const patchSpecs = [
    {
      file: 'plugin-package-store.js',
      expectedHash: '3933ad2335b9f61aea4bbcc4f4207ca94c6ef506ba51c50ed19e20ba6fe63cb6',
      anchor: "async function syncDirectory(directory) {\n",
      insertion: "    // SpecFlow compatibility: Node cannot fsync directory handles on Windows.\n    // Payload files and operation journals remain fsynced; directory metadata has no Node flush API.\n    if (process.platform === 'win32') return;\n",
    },
    {
      file: 'plugin-composition-store.js',
      expectedHash: 'f833da06a01141f924a59754b690d523fe43ae1b87a6460a9e10908fec5cb68c',
      anchor: '            published = true;\n',
      insertion: "            // SpecFlow compatibility: file contents are flushed; Windows has no Node directory flush.\n            if (process.platform === 'win32') return;\n",
    },
  ];
  const report = [];
  for (const patch of patchSpecs) {
    const path = join(packageRoot, 'node_modules', '@maka', 'runtime-host', 'dist', 'server', patch.file);
    const content = await readFile(path, 'utf8');
    const original = content.replace(patch.insertion, '');
    if (digest(original) !== patch.expectedHash || !original.includes(patch.anchor)) throw new Error(`Maka ${patch.file} 与固定版本不匹配，拒绝自动修改`);
    const patched = original.replace(patch.anchor, patch.anchor + patch.insertion);
    if (content !== patched) await writeFile(path, patched);
    report.push({ file: patch.file, originalHash: digest(original), patchedHash: digest(patched) });
  }
  // Desktop resources can be read-only. Packaging applies this patch in advance.
  const reportPath = join(packageRoot, 'specflow-compatibility.json');
  const reportContent = JSON.stringify({ version: MAKA_VERSION, files: report, platform: 'win32', limitation: 'Directory metadata flush is unavailable; regular files and journals remain fsynced.' }, null, 2);
  if (await readFile(reportPath, 'utf8').catch(() => '') !== reportContent) await writeFile(reportPath, reportContent);
  return { applied: true, reason: 'windows-directory-fsync', report };
}

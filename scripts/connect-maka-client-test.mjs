import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const macaRoot = join(process.env.APPDATA, 'Maka-SpecFlow-0.2.0/workspaces/default');
const marker = JSON.parse(await readFile(join(macaRoot, '.maka-storage-root.json'), 'utf8'));
const repo = join(root, '.specflow-data/maka-live-test-repo'); await mkdir(repo, { recursive: true });
if (!existsSync(join(repo, '.git'))) {
  await writeFile(join(repo, 'README.md'), '# Maka real-model integration test\n\nExtend the CSV parser to support quoted commas, escaped double quotes, CRLF, and invalid input. Add deterministic tests.\n');
  await writeFile(join(repo, 'package.json'), JSON.stringify({ name: 'maka-live-csv-test', private: true, type: 'module', scripts: { test: 'node --test' } }, null, 2));
  await writeFile(join(repo, 'csv.js'), 'export function parseCsv(text) { return text.trim().split("\\n").map(line => line.split(",")); }\n');
  await writeFile(join(repo, 'csv.test.js'), 'import test from "node:test"; import assert from "node:assert/strict"; import { parseCsv } from "./csv.js"; test("ordinary fields", () => assert.deepEqual(parseCsv("a,b\\nc,d"), [["a","b"],["c","d"]]));\n');
  for (const args of [['init'], ['add', '--all'], ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit', '-m', 'Prepare isolated real-model acceptance project']]) {
    const r = spawnSync('git', args, { cwd: repo, windowsHide: true, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr);
  }
}
const app = await electron.launch({ executablePath: join(root, 'release/win-unpacked/SpecFlow.exe'), args: [], env: { ...process.env, SPECFLOW_MAKA_ROOT: macaRoot }, timeout: 90000 });
try {
  const page = await app.firstWindow(); await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: '打开 Git 仓库', exact: true }).waitFor({ timeout: 60000 });
  const result = await page.evaluate(async input => {
    const read = async path => { const r = await fetch(`/api${path}`); const body = await r.json(); if (!r.ok) throw new Error(JSON.stringify(body)); return body; };
    const boot = await read('/bootstrap');
    const write = async (path, body) => { const r = await fetch(`/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': boot.token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) throw new Error(JSON.stringify(result)); return result; };
    const backend = await read('/backend/targets');
    const project = boot.projects.find(p => p.rootPath.toLowerCase() === input.repo.toLowerCase()) || await write('/projects', { rootPath: input.repo, name: 'Maka 真实模型联调' });
    const item = boot.workItems.find(w => w.projectId === project.id && w.name === '通过 Maka 完成 CSV 导入') || await write('/work-items', { projectId: project.id, name: '通过 Maka 完成 CSV 导入', request: '通过 Maka 生成需求、设计与任务，然后扩展 CSV 解析器，支持引号内逗号、转义双引号、CRLF 和非法输入，并补齐可运行的验收测试。先配置模型，再运行步骤。' });
    const snapshot = await read(`/work-items/${item.id}`);
    return { maka: backend.maka, targetCount: backend.targets.filter(t => t.backend === 'maka').length, itemId: item.id, projectId: project.id, demo: snapshot.project.demo, defaults: snapshot.project.defaults, attempts: snapshot.attempts.length, repo: snapshot.project.rootPath };
  }, { repo });
  assert.equal(result.maka.available, true, result.maka.reason);
  assert.equal(result.maka.rootId, marker.rootId);
  assert.equal(result.demo, false, 'Real-model test must not fall back to sandbox');
  assert.equal(result.attempts, 0, 'No model execution is authorized by connection setup');
  await page.reload();
  await page.getByRole('button', { name: '通过 Maka 完成 CSV 导入', exact: true }).click();
  await page.getByRole('heading', { name: '通过 Maka 完成 CSV 导入' }).waitFor();
  await page.screenshot({ path: join(root, 'release/maka-specflow-connected.png') });
  await writeFile(join(root, 'release/maka-client-integration.json'), JSON.stringify({ ...result, sharedHost: true, version: '0.2.0', testedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await app.close(); }

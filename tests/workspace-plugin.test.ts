import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import plugin, { resolveWorkspacePath } from '../plugins/specflow-workspace/index.ts';
test('工作区工具拒绝越界、元数据、设备路径和旧文件哈希', async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-plugin-test-')), workspace = join(root, 'workspace'); await mkdir(workspace);
  try {
    await writeFile(join(workspace, 'file.ts'), 'original'); const tools = new Map<string, any>();
    plugin.host.apply({ tools: { register: (tool: any) => tools.set(tool.name, tool) }, userQuestions: {} }, { workspaceRoot: workspace });
    const context = { cwd: workspace, permissionMode: 'ask', operationId: 'test-operation', abortSignal: new AbortController().signal };
    await assert.rejects(resolveWorkspacePath(workspace, workspace, '../outside.txt'));
    await assert.rejects(resolveWorkspacePath(workspace, workspace, '.git/config'));
    await assert.rejects(resolveWorkspacePath(workspace, workspace, '.specflow/project.yaml'));
    await assert.rejects(resolveWorkspacePath(workspace, workspace, '.env'));
    await assert.rejects(resolveWorkspacePath(workspace, workspace, 'NUL'));
    await assert.rejects(tools.get('SpecFlowWrite').impl({ path: 'file.ts', content: 'changed', expectedHash: 'wrong' }, context));
    await assert.rejects(tools.get('SpecFlowWrite').impl({ path: 'file.ts', content: 'changed' }, context));
    await assert.rejects(tools.get('SpecFlowWrite').impl({ path: 'file.ts', content: 'changed' }, { ...context, permissionMode: 'explore' }));
    const contentHash = createHash('sha256').update('original').digest('hex');
    await tools.get('SpecFlowWrite').impl({ path: 'file.ts', content: 'changed', expectedHash: contentHash }, context);
    assert.equal(await readFile(join(workspace, 'file.ts'), 'utf8'), 'changed');
    const outside = join(root, 'outside'); await mkdir(outside); await symlink(outside, join(workspace, 'linked'), 'junction');
    await assert.rejects(resolveWorkspacePath(workspace, workspace, 'linked/file.ts'));
  } finally { if (basename(root).startsWith('specflow-plugin-test-')) await rm(root, { recursive: true, force: true }); }
});

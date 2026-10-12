import { mkdir, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';

type ToolContext = { cwd: string; permissionMode?: string; abortSignal: AbortSignal; operationId?: string };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const within = (root: string, path: string) => { const rel = relative(root, path); return !rel.startsWith('..') && !isAbsolute(rel); };
export async function resolveWorkspacePath(allowedRoot: string, cwd: string, path: string) {
  const allowed = await realpath(allowedRoot), workspace = await realpath(cwd);
  if (!within(allowed, workspace)) throw new Error('SpecFlow 工具只接受应用创建的工作空间');
  const target = resolve(workspace, path), rel = relative(workspace, target);
  if (!within(workspace, target)) throw new Error('文件路径越出当前工作空间');
  if (rel.includes(':') || /(^|[\\/])(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(rel)) throw new Error('不接受设备名称或备用数据流路径');
  if (rel.split(/[\\/]/).some(segment => ['.git', '.specflow', 'node_modules'].includes(segment)) || /(^|[\\/])\.env(?:\.|$)/.test(rel)) throw new Error('该路径属于受保护的元数据或凭据');
  let parent = target;
  while (parent !== workspace) {
    const canonical = await realpath(parent).catch((error: any) => { if (error.code === 'ENOENT') return undefined; throw error; });
    if (canonical && !within(workspace, canonical)) throw new Error('文件路径通过链接越出工作空间');
    parent = dirname(parent);
  }
  return target;
}
export default {
  packageId: 'specflow.workspace',
  host: { apply(ctx: any, config: { workspaceRoot: string }) {
    const root = resolve(config.workspaceRoot);
    ctx.tools.register({ name: 'SpecFlowRead', description: 'Read a UTF-8 source file inside the current SpecFlow workspace. Use this tool instead of native Read on unsupported Windows workers.', categoryHint: 'read', activityKind: 'read',
      parameters: z.object({ path: z.string().min(1), maxChars: z.number().int().positive().max(200000).default(100000) }),
      impl: async (args: { path: string; maxChars: number }, context: ToolContext) => { context.abortSignal.throwIfAborted(); const path = await resolveWorkspacePath(root, context.cwd, args.path); const content = await readFile(path, 'utf8'); return { path: args.path, content: content.slice(0, args.maxChars), contentHash: digest(content), truncated: content.length > args.maxChars }; },
    });
    ctx.tools.register({ name: 'SpecFlowList', description: 'List files in a directory inside the current SpecFlow workspace. Protected metadata is excluded.', categoryHint: 'read', activityKind: 'read',
      parameters: z.object({ path: z.string().default('.') }),
      impl: async (args: { path: string }, context: ToolContext) => { context.abortSignal.throwIfAborted(); const path = await resolveWorkspacePath(root, context.cwd, args.path); return (await readdir(path, { withFileTypes: true })).filter(x => !['.git', '.specflow', 'node_modules'].includes(x.name) && !x.name.startsWith('.env')).map(x => ({ name: x.name, directory: x.isDirectory(), symlink: x.isSymbolicLink() })); },
    });
    ctx.tools.register({ name: 'SpecFlowWrite', description: 'Write a UTF-8 source file inside the current SpecFlow workspace. Cannot change protected metadata or escape the workspace. expectedHash optionally checks the previous content. Use this instead of native Write/Edit. Engineering service runs deterministic tests after the task.', categoryHint: 'file_write', activityKind: 'edit', executionSemantics: 'exclusive_step',
      parameters: z.object({ path: z.string().min(1), content: z.string().max(2_000_000), expectedHash: z.string().optional() }),
      impl: async (args: { path: string; content: string; expectedHash?: string }, context: ToolContext) => {
        if (context.permissionMode === 'explore') throw new Error('只读阶段不允许写入文件');
        context.abortSignal.throwIfAborted(); const path = await resolveWorkspacePath(root, context.cwd, args.path);
        const current = await readFile(path, 'utf8').catch((error: any) => { if (error.code === 'ENOENT') return null; throw error; });
        if (current === args.content) return { path: args.path, contentHash: digest(args.content), unchanged: true };
        if (current !== null && !args.expectedHash) throw new Error('修改现有文件前必须读取内容，并提供 expectedHash');
        if (args.expectedHash && (current === null || digest(current) !== args.expectedHash)) throw new Error('文件内容与预期版本不同');
        await mkdir(dirname(path), { recursive: true });
        await resolveWorkspacePath(root, context.cwd, args.path);
        const temp = `${path}.${digest(context.operationId || args.path).slice(0, 16)}.tmp`;
        context.abortSignal.throwIfAborted(); await writeFile(temp, args.content); context.abortSignal.throwIfAborted(); await rename(temp, path);
        return { path: args.path, contentHash: digest(args.content), bytes: Buffer.byteLength(args.content) };
      },
    });
    ctx.tools.register({ name: 'SpecFlowQuestion', description: 'Ask the user an engineering clarification and wait for an explicit answer.', categoryHint: 'read', activityKind: 'read',
      parameters: z.object({ question: z.string().min(1), options: z.array(z.string()).max(6).default([]) }),
      impl: async (args: { question: string; options: string[] }, context: ToolContext) => { context.abortSignal.throwIfAborted(); return ctx.userQuestions.ask([{ question: args.question, options: args.options.map(label => ({ label })) }]); },
    });
  } },
};

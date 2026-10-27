import { z } from 'zod';
import { matchesGlob } from 'node:path';
import { assert, type TaskSpec } from '../domain/index.ts';

const nonempty = z.string().trim().min(1);
const taskId = z.string().regex(/^T\d+$/i).transform(value => value.toUpperCase());
const structuredTask = z.object({
  taskId, objective: nonempty, name: nonempty.optional(), dependsOn: z.array(taskId),
  acceptanceCriteria: z.array(nonempty).min(1), requirementIds: z.array(nonempty).default([]),
  allowedPaths: z.array(nonempty).default([]), verificationCommandIds: z.array(nonempty).default([]), contextRefs: z.array(nonempty).default([]),
}).strict();
const taskDocument = z.object({ schemaVersion: z.literal(1), tasks: z.array(structuredTask).min(1) }).strict();

function validateTasks(tasks: TaskSpec[]) {
  assert(tasks.length, 'TASKS_INVALID', '任务文档需要结构化 TaskSpec 或 - [ ] T001 形式的任务');
  const ids = new Set(tasks.map(task => task.taskId));
  assert(ids.size === tasks.length, 'TASKS_INVALID', '任务 ID 必须唯一');
  for (const task of tasks) {
    assert(!task.dependsOn.includes(task.taskId), 'TASKS_INVALID', '任务不能依赖自身');
    assert(new Set(task.dependsOn).size === task.dependsOn.length, 'TASKS_INVALID', '任务依赖不能重复');
    assert(task.dependsOn.every(id => ids.has(id)), 'TASKS_INVALID', '任务依赖指向不存在的任务');
    assert(task.allowedPaths.every(path => !/^(?:[a-z]:|[\\/])|(?:^|[\\/])\.\.(?:[\\/]|$)|\0/i.test(path)), 'TASKS_INVALID', '任务允许路径不能越出工作区');
  }
  const visited = new Set<string>();
  while (visited.size < tasks.length) {
    const next = tasks.find(task => !visited.has(task.taskId) && task.dependsOn.every(id => visited.has(id)));
    assert(next, 'TASKS_INVALID', '任务依赖缺失或形成环');
    visited.add(next.taskId);
  }
  return tasks;
}

/** Legacy Markdown keeps its prose, but only explicit dependency clauses create edges. */
export function parseTasks(content: string): TaskSpec[] {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  const raw = fenced?.[1] ?? trimmed;
  if (raw.startsWith('{') || raw.startsWith('[')) {
    let json: unknown;
    try { json = JSON.parse(raw); } catch { assert(false, 'TASKS_INVALID', '结构化任务不是有效 JSON'); }
    const parsed = taskDocument.safeParse(json);
    assert(parsed.success, 'TASKS_INVALID', '结构化任务必须符合 TaskSpec v1，并显式提供依赖及验收条件');
    return validateTasks(parsed.data.tasks.map(task => ({ ...task, name: task.name || task.objective, condition: task.acceptanceCriteria.join('；'), sourceFormat: 'structured' as const })));
  }
  const tasks = content.split('\n').flatMap(line => {
    const match = line.match(/^\s*- \[[ x]\]\s+(T\d+)\s+(.+)$/i);
    if (!match) return [];
    const name = match[2].trim();
    // A bare mention such as "compare T002" is not a dependency declaration.
    const clauses = [...name.matchAll(/(?:依赖(?:于)?|\bdepends?\s+on\b|\bdependencies\b)\s*[:：]?\s*(T\d+(?:(?:\s*[,，、&]\s*|\s*(?:以及|和|及|\band\b)\s*|\s+)T\d+)*)/gi)];
    const dependencies = clauses.flatMap(clause => [...clause[1].matchAll(/T\d+/gi)].map(value => value[0].toUpperCase()));
    const ambiguous = /(?:^(?:依赖(?:于)?|depends?\s+on\b)|(?:^|[;；(（])\s*(?:依赖(?:于)?|dependencies)\s*[:：])/i.test(name) && !clauses.length && !/(?:依赖\s*[:：]?\s*(?:无|不需要)|\bdependencies\s*:\s*none\b)/i.test(name);
    assert(!ambiguous, 'TASKS_INVALID', '任务依赖必须使用明确任务 ID；不能根据自然语言猜测');
    return [{ taskId: match[1].toUpperCase(), name, objective: name, dependsOn: dependencies, condition: name, acceptanceCriteria: [name], requirementIds: [], allowedPaths: [], verificationCommandIds: [], contextRefs: [], sourceFormat: 'markdown' as const }];
  });
  return validateTasks(tasks);
}

export function selectTaskVerification(task: TaskSpec, configuredCommandIds: string[], requiredVerification: string[] = []): string[] {
  const selected = task.verificationCommandIds.length ? task.verificationCommandIds : configuredCommandIds;
  assert(selected.length > 0 && selected.every(id => configuredCommandIds.includes(id)), 'VERIFY_MISSING', '任务指定的验证命令未在工程配置中登记');
  assert(requiredVerification.every(id => configuredCommandIds.includes(id)), 'VERIFY_MISSING', '最终必需验证命令未配置');
  return [...new Set(selected)];
}

/** A post-execution boundary for adapters without per-path write permissions. */
export function assertTaskScope(allowedPaths: string[], changedPaths: string[]) {
  if (!allowedPaths.length) return;
  const scopes = allowedPaths.map(value => value.replaceAll('\\', '/').replace(/\/$/, ''));
  const outside = changedPaths.filter(value => {
    const name = value.replaceAll('\\', '/');
    return !scopes.some(scope => name === scope || name.startsWith(`${scope}/`) || matchesGlob(name, scope));
  });
  assert(!outside.length, 'TASK_SCOPE_VIOLATION', '任务修改超出已批准路径范围，停止后续派发并保留候选', { paths: outside });
}

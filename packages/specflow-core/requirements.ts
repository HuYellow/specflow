import { open } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { assert, hash, id, type RequirementDocument } from '../domain/index.ts';
import { safePath } from '../verification-runner/index.ts';
import { Store } from './store.ts';
import { invalidateClarifications } from './guidance.ts';

const fileLimit = 512 * 1024, totalLimit = 1024 * 1024;
const textExtension = /\.(md|markdown|txt)$/i;

export function requirementFresh(store: Store, revisionId?: string) {
  if (!revisionId) return true; // Pre-upgrade records are assigned their initial source during migration.
  const revision = store.get('requirementRevisions', revisionId);
  return store.get('workItems', revision.workItemId).requirementRevisionId === revisionId;
}

export function requirementText(request: string, documents: RequirementDocument[]) {
  return `## 工作项需求\n${request || '（以附加需求文档为准）'}\n\n${documents.map((d, i) => `## 需求文档 ${i + 1}：${d.name}\n来源：${d.source === 'repository' ? `仓库 ${d.repositoryPath}` : d.source === 'upload' ? '用户上传' : '用户编写'}\n${d.content}`).join('\n\n')}`;
}

export function validateRequirements(request: string, documents: RequirementDocument[]) {
  assert(!request.includes('\0'), 'REQUIREMENTS_INVALID', '需求正文不能包含二进制内容');
  assert(documents.length <= 20 && new Set(documents.map(d => d.id)).size === documents.length, 'REQUIREMENTS_INVALID', '最多添加 20 份文档，文档标识必须唯一', undefined);
  assert(request.trim() || documents.some(d => d.content.trim()), 'REQUIREMENTS_EMPTY', '请填写需求正文或添加需求文档');
  let bytes = Buffer.byteLength(request);
  for (const document of documents) {
    assert(document.id && document.name.trim() && document.name.length <= 200 && textExtension.test(document.name), 'DOCUMENT_INVALID', '文档需要名称，支持 Markdown 和 TXT');
    assert(document.content.trim() && !document.content.includes('\0'), 'DOCUMENT_INVALID', `${document.name} 为空或包含二进制内容`);
    assert(Buffer.byteLength(document.content) <= fileLimit, 'DOCUMENT_TOO_LARGE', '每份需求文档不能超过 512 KiB');
    assert(document.source !== 'repository' || !!document.repositoryPath, 'DOCUMENT_INVALID', '仓库文档缺少相对路径');
    bytes += Buffer.byteLength(document.content);
  }
  assert(bytes <= totalLimit, 'REQUIREMENTS_TOO_LARGE', '需求正文和文档合计不能超过 1 MiB');
}

export class Requirements {
  constructor(readonly store: Store) {}
  current(workItemId: string, initialDocuments: RequirementDocument[] = []) {
    const item = this.store.get('workItems', workItemId);
    if (item.requirementRevisionId) return this.store.get('requirementRevisions', item.requirementRevisionId);
    return this.store.tx(() => {
      const revision = this.store.create('requirementRevisions', { workItemId, number: 1, request: item.request, documents: initialDocuments, contentHash: hash(JSON.stringify({ request: item.request, documents: initialDocuments })) });
      this.store.update('workItems', item.id, { requirementRevisionId: revision.id });
      // Existing attempts and generated documents used the original work-item text.
      const runIds = new Set(this.store.list('runs', r => r.workItemId === item.id).map(r => r.id));
      const nodeIds = new Set(this.store.list('nodes', n => runIds.has(n.workflowRunId)).map(n => n.id));
      for (const attempt of this.store.list('attempts', a => nodeIds.has(a.nodeRunId) && !a.requirementRevisionId)) this.store.update('attempts', attempt.id, { requirementRevisionId: revision.id });
      const artifactIds = new Set(this.store.list('artifacts', a => a.workItemId === item.id).map(a => a.id));
      for (const document of this.store.list('artifactRevisions', r => artifactIds.has(r.artifactId) && !r.requirementRevisionId)) this.store.update('artifactRevisions', document.id, { requirementRevisionId: revision.id });
      return revision;
    });
  }
  save(workItemId: string, expectedRevisionId: string, request: string, documents: RequirementDocument[]) {
    validateRequirements(request, documents);
    return this.store.tx(() => {
      const item = this.store.get('workItems', workItemId), current = this.current(item.id);
      assert(item.status !== 'accepted', 'ITEM_ACCEPTED', '此工作项已接纳，请新建工作项记录后续需求');
      assert(current.id === expectedRevisionId, 'REVISION_CONFLICT', '需求已有新版本，草稿已保留，请比较最新需求后再保存');
      const contentHash = hash(JSON.stringify({ request, documents }));
      if (current.contentHash === contentHash) return current;
      const revision = this.store.create('requirementRevisions', { workItemId, number: current.number + 1, request, documents, contentHash });
      this.store.update('workItems', item.id, { request, requirementRevisionId: revision.id });
      invalidateClarifications(this.store, item.id, '需求输入已更新，请重新生成规格并澄清');
      const runIds = new Set(this.store.list('runs', r => r.workItemId === item.id).map(r => r.id));
      for (const node of this.store.list('nodes', n => runIds.has(n.workflowRunId) && n.execution !== 'pending')) this.store.update('nodes', node.id, { freshness: 'stale', gate: 'stale', acceptance: 'pending', blockers: ['需求输入已变更，请基于新需求重新分析或复核'] });
      return revision;
    });
  }
  async readRepository(workItemId: string, repositoryPath: string): Promise<RequirementDocument> {
    assert(textExtension.test(extname(repositoryPath)), 'DOCUMENT_INVALID', '仓库需求文档仅支持 Markdown 和 TXT');
    const item = this.store.get('workItems', workItemId), project = this.store.get('projects', item.projectId);
    const path = await safePath(project.rootPath, repositoryPath);
    const handle = await open(path, 'r');
    try {
      const stat = await handle.stat();
      assert(stat.isFile(), 'DOCUMENT_INVALID', '请选择一个需求文档文件');
      assert(stat.size <= fileLimit, 'DOCUMENT_TOO_LARGE', '每份需求文档不能超过 512 KiB');
      const buffer = Buffer.alloc(fileLimit + 1);
      let bytesRead = 0;
      while (bytesRead < buffer.length) {
        const part = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
        if (!part.bytesRead) break;
        bytesRead += part.bytesRead;
      }
      assert(bytesRead <= fileLimit, 'DOCUMENT_TOO_LARGE', '每份需求文档不能超过 512 KiB');
      let content: string;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead)); }
      catch { throw new Error('需求文档必须使用 UTF-8 编码'); }
      const document: RequirementDocument = { id: id(), name: basename(repositoryPath), content, source: 'repository', repositoryPath };
      validateRequirements('', [document]);
      return document;
    } finally { await handle.close(); }
  }
}

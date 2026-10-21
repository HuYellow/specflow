import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { assert, hash, id, DomainError, type InputBinding, type ArtifactRevision } from '../domain/index.ts';
import { safePath } from '../verification-runner/index.ts';
import { Store } from './store.ts';
import { requirementFresh } from './requirements.ts';
import { guidanceFresh } from './guidance.ts';
import { openReviewFindings } from './reviews.ts';
import { createReading, humanBriefSchema, renderReadingHtml } from '../document-presentation/index.ts';
import type { Locale } from '../i18n/index.ts';

export class Artifacts {
  private locks = new Set<string>();
  private integrationLocks = new Set<string>();
  constructor(readonly store: Store) {}
  lockWorkItem(workItemId: string) {
    assert(!this.integrationLocks.has(workItemId) && !this.store.list('artifacts', artifact => artifact.workItemId === workItemId).some(artifact => this.locks.has(artifact.id)), 'ARTIFACT_BUSY', '文档正在接纳或集成，请稍后重试');
    this.integrationLocks.add(workItemId);
    return () => { this.integrationLocks.delete(workItemId); };
  }
  create(workItemId: string, logicalId: string, content: string, inputs: InputBinding[] = [], originAttemptId?: string, expectedRevision?: number, provenance: Pick<Partial<ArtifactRevision>, 'supersedesRevisionId' | 'clarificationSessionId' | 'candidateId' | 'codeHash' | 'humanBrief'> = {}) {
    assert(!this.integrationLocks.has(workItemId), 'ARTIFACT_BUSY', '代码正在集成，请完成后再修订文档');
    assert(/^[a-z][a-z0-9_-]{0,63}$/.test(logicalId), 'ARTIFACT_INVALID', '产物名称格式不合法');
    const existing = this.store.list('artifacts', a => a.workItemId === workItemId && a.logicalId === logicalId)[0];
    assert(!existing || !this.locks.has(existing.id), 'ARTIFACT_BUSY', '产物接纳正在执行');
    if (expectedRevision !== undefined) assert(existing?.revision === expectedRevision, 'REVISION_CONFLICT', '产物已变化，请比较最新内容', existing);
    // Editing or re-importing text must not erase its upstream/code obligations.
    if (existing && !originAttemptId) {
      const previous = this.store.get('artifactRevisions', existing.currentRevisionId);
      if (!inputs.length) inputs = previous.inputs;
      provenance = { candidateId: previous.candidateId, codeHash: previous.codeHash, ...provenance };
    }
    return this.store.tx(() => {
      const artifact = existing || this.store.create('artifacts', { workItemId, logicalId, type: logicalId, revisionIds: [], currentRevisionId: '', owner: 'local' });
      const requirementRevisionId = originAttemptId ? this.store.get('attempts', originAttemptId).requirementRevisionId : this.store.get('workItems', workItemId).requirementRevisionId;
      const item = this.store.get('workItems', workItemId);
      const guidanceHash = originAttemptId ? this.store.get('attempts', originAttemptId).guidance?.contentHash : this.store.get('projects', item.projectId).guidance?.contentHash;
      const humanBrief = provenance.humanBrief ? humanBriefSchema.parse(provenance.humanBrief) : undefined;
      const revision = this.store.create('artifactRevisions', { artifactId: artifact.id, content, contentHash: hash(content), inputs, originAttemptId, requirementRevisionId, guidanceHash, ...provenance, humanBrief, humanBriefSourceHash: humanBrief ? hash(content) : undefined, acceptance: 'candidate', reviewed: false });
      this.store.update('artifacts', artifact.id, { revisionIds: [...artifact.revisionIds, revision.id], currentRevisionId: revision.id }, artifact.revision);
      if (logicalId === 'spec') for (const session of this.store.list('clarifications', s => s.workItemId === workItemId && s.state !== 'stale' && s.id !== provenance.clarificationSessionId)) {
        this.store.update('clarifications', session.id, { state: 'stale' });
        const node = this.store.get('nodes', session.nodeRunId), attempt = node.currentAttemptId ? this.store.get('attempts', node.currentAttemptId) : undefined;
        if (node.execution === 'waiting_interaction' && attempt?.execution === 'completed') this.store.update('nodes', node.id, { execution: 'pending', gate: 'stale', freshness: 'stale', blockers: ['规格已更新，请重新澄清'] });
      }
      this.invalidate(workItemId, logicalId, revision.id);
      return revision;
    });
  }
  private readingLocale(revisionId: string): Locale {
    const revision = this.store.get('artifactRevisions', revisionId), artifact = this.store.get('artifacts', revision.artifactId);
    // An exported copy follows its source attempt, even after the interface language changes.
    const attempt = revision.originAttemptId ? this.store.get('attempts', revision.originAttemptId) : undefined;
    if (attempt) return this.store.get('runs', this.store.get('nodes', attempt.nodeRunId).workflowRunId).definition.locale || 'zh-CN';
    return this.store.list('workflows', workflow => workflow.workItemId === artifact.workItemId).at(-1)?.definition.locale || 'zh-CN';
  }
  reading(revisionId: string, locale: Locale = this.readingLocale(revisionId)) {
    const revision = this.store.get('artifactRevisions', revisionId);
    return createReading(revision, this.store.get('artifacts', revision.artifactId).logicalId, locale);
  }
  readingHtml(revisionId: string, locale: Locale = this.readingLocale(revisionId)) {
    const revision = this.store.get('artifactRevisions', revisionId);
    return renderReadingHtml(this.reading(revisionId, locale), this.store.get('artifacts', revision.artifactId).logicalId, locale);
  }
  /** Derived files are rebuildable; the canonical write journal owns acceptance. */
  async exportReading(revisionId: string) {
    const revision = this.store.get('artifactRevisions', revisionId), artifact = this.store.get('artifacts', revision.artifactId);
    const locale = this.readingLocale(revisionId);
    const item = this.store.get('workItems', artifact.workItemId), reading = this.reading(revisionId, locale);
    const path = await safePath(item.workspace, `.specflow/work-items/${item.id}/${artifact.logicalId}.human.html`);
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${id()}.tmp`;
    await writeFile(temporary, renderReadingHtml(reading, artifact.logicalId, locale), 'utf8'); await rename(temporary, path);
  }
  private async exportForAcceptance(revisionId: string) {
    try { await this.exportReading(revisionId); }
    catch (error) {
      this.store.emit(revisionId, 'artifact.reading-export-failed', { message: (error as Error).message });
      throw new DomainError('READING_EXPORT_FAILED', '阅读副本写入失败，完整文档与操作记录已保留；请修复目录或权限后重试接纳');
    }
  }
  resolve(workItemId: string, reference: string): InputBinding {
    const [logicalId, selection] = reference.split('@');
    const artifact = this.store.list('artifacts', x => x.workItemId === workItemId && x.logicalId === logicalId)[0];
    assert(artifact, 'INPUT_MISSING', `缺少 ${logicalId}`);
    const revisionId = selection === 'accepted' ? artifact.acceptedRevisionId : artifact.currentRevisionId;
    assert(revisionId, 'INPUT_NOT_ACCEPTED', `${logicalId} 尚未接纳`);
    if (selection === 'accepted') assert(artifact.currentRevisionId === revisionId, 'INPUT_STALE', `${logicalId} 已编辑，当前版本尚未接纳`);
    const revision = this.store.get('artifactRevisions', revisionId);
    assert(this.revisionFresh(revision) && this.isFresh(revision.inputs), 'INPUT_STALE', `${logicalId} 依赖的需求、章程或上游版本已变化`);
    if (selection === 'accepted') {
      assert(!openReviewFindings(this.store, workItemId, [logicalId]).some(f => f.severity === 'blocker'), 'REVIEW_BLOCKED', `${logicalId} 有未解决的复核发现`);
    }
    return { logicalId, artifactRevisionId: revision.id, contentHash: revision.contentHash };
  }
  isFresh(inputs: InputBinding[], visited = new Set<string>()): boolean {
    for (const binding of inputs) {
      if (visited.has(binding.artifactRevisionId)) return false;
      const revision = this.store.get('artifactRevisions', binding.artifactRevisionId);
      const artifact = this.store.get('artifacts', revision.artifactId);
      if (artifact.currentRevisionId !== revision.id || revision.contentHash !== binding.contentHash || !this.revisionFresh(revision)) return false;
      const path = new Set(visited); path.add(revision.id);
      if (!this.isFresh(revision.inputs, path)) return false;
    }
    return true;
  }
  private revisionFresh(revision: ArtifactRevision) {
    const artifact = this.store.get('artifacts', revision.artifactId);
    return requirementFresh(this.store, revision.requirementRevisionId) && guidanceFresh(this.store, artifact.workItemId, revision.guidanceHash);
  }
  private invalidate(workItemId: string, logicalId: string, currentRevisionId: string) {
    const affected = new Set([logicalId]); let changed = true;
    while (changed) {
      changed = false;
      for (const artifact of this.store.list('artifacts', x => x.workItemId === workItemId)) {
        const revision = this.store.get('artifactRevisions', artifact.currentRevisionId);
        if (revision.inputs.some(x => affected.has(x.logicalId) && x.artifactRevisionId !== currentRevisionId) && !affected.has(artifact.logicalId)) { affected.add(artifact.logicalId); changed = true; }
      }
    }
    for (const run of this.store.list('runs', x => x.workItemId === workItemId)) for (const node of this.store.list('nodes', x => x.workflowRunId === run.id)) {
      const def = run.definition.nodes.find(x => x.id === node.nodeId)!;
      if (def.inputs.some(x => affected.has(x.split('@')[0])) && node.execution !== 'pending') this.store.update('nodes', node.id, { freshness: 'stale', gate: 'stale', blockers: ['上游产物已变更，请创建新尝试或重新检查'] });
    }
  }
  async accept(artifactId: string, expectedRevision: number, actor: string, reason: string, requireReview = true) {
    assert(!this.integrationLocks.has(this.store.get('artifacts', artifactId).workItemId), 'ARTIFACT_BUSY', '代码正在集成，请完成后再接纳文档');
    assert(!this.locks.has(artifactId), 'ARTIFACT_BUSY', '产物正在接纳');
    this.locks.add(artifactId);
    try {
      const artifact = this.store.get('artifacts', artifactId);
      assert(artifact.revision === expectedRevision, 'REVISION_CONFLICT', '产物版本已变化', artifact);
      const revision = this.store.get('artifactRevisions', artifact.currentRevisionId);
      assert(this.revisionFresh(revision) && this.isFresh(revision.inputs), 'INPUT_STALE', '产物依赖的需求、章程或上游已过期');
      assert(revision.content.trim().length >= 20 && !/\[NEEDS CLARIFICATION\]|\bTODO\b/.test(revision.content), 'ARTIFACT_INCOMPLETE', '产物内容不足或仍有未决问题');
      assert(!requireReview || (revision.reviewed && revision.reviewGroupId), 'REVIEW_REQUIRED', '当前版本需要双视角独立复核后才能接纳');
      const blockers = openReviewFindings(this.store, artifact.workItemId, [artifact.logicalId]).filter(f => f.severity === 'blocker');
      assert(!blockers.length, 'REVIEW_BLOCKED', '当前版本仍有阻塞复核发现', blockers);
      const item = this.store.get('workItems', artifact.workItemId);
      const targetPath = await safePath(item.workspace, `.specflow/work-items/${item.id}/${artifact.logicalId}.md`);
      await mkdir(dirname(targetPath), { recursive: true });
      const prior = await readFile(targetPath, 'utf8').catch(() => null);
      const pending = this.store.list('fileOperations', op => op.artifactId === artifactId && op.revisionId === revision.id && op.targetPath === targetPath && (op.state === 'prepared' || op.state === 'written')).at(-1);
      if (pending && prior !== null && hash(prior) === pending.nextHash) {
        await this.exportForAcceptance(revision.id);
        return this.commitOperation(pending.id);
      }
      if (artifact.acceptedRevisionId) {
        const accepted = this.store.get('artifactRevisions', artifact.acceptedRevisionId);
        assert(prior !== null && hash(prior) === accepted.contentHash, 'REVISION_CONFLICT', '工作空间文档在应用外发生变更，请导入并比较后再接纳');
      }
      const op = this.store.create('fileOperations', { artifactId, revisionId: revision.id, targetPath, previousHash: prior === null ? null : hash(prior), nextHash: revision.contentHash, state: 'prepared', actor, reason });
      const latest = await readFile(targetPath, 'utf8').catch(() => null);
      assert(this.revisionFresh(revision) && this.isFresh(revision.inputs), 'INPUT_STALE', '接纳期间需求、章程或上游已变化');
      assert((latest === null ? null : hash(latest)) === op.previousHash, 'REVISION_CONFLICT', '文档在写入前发生变化');
      const temp = `${targetPath}.${op.id}.tmp`; await writeFile(temp, revision.content, 'utf8'); await rename(temp, targetPath);
      this.store.update('fileOperations', op.id, { state: 'written' });
      await this.exportForAcceptance(revision.id);
      return this.commitOperation(op.id);
    } finally { this.locks.delete(artifactId); }
  }
  private commitOperation(operationId: string) {
    return this.store.tx(() => {
      const op = this.store.get('fileOperations', operationId), artifact = this.store.get('artifacts', op.artifactId), revision = this.store.get('artifactRevisions', op.revisionId);
      assert(artifact.currentRevisionId === op.revisionId, 'REVISION_CONFLICT', '接纳目标已变化');
      assert(this.revisionFresh(revision) && this.isFresh(revision.inputs), 'INPUT_STALE', '接纳目标依赖的需求、章程或上游已过期');
      this.store.update('artifactRevisions', revision.id, { acceptance: 'accepted' });
      const updated = this.store.update('artifacts', artifact.id, { acceptedRevisionId: revision.id });
      this.store.create('decisions', { workItemId: artifact.workItemId, targetId: revision.id, targetHash: revision.contentHash, actor: op.actor, kind: 'accept', reason: op.reason });
      this.store.update('fileOperations', op.id, { state: 'committed' });
      return updated;
    });
  }
  async recover() {
    for (const op of this.store.list('fileOperations', x => x.state === 'prepared' || x.state === 'written')) {
      const content = await readFile(op.targetPath, 'utf8').catch(() => null);
      if (content !== null && hash(content) === op.nextHash) {
        const artifact = this.store.get('artifacts', op.artifactId), revision = this.store.get('artifactRevisions', op.revisionId);
        if (artifact.currentRevisionId !== revision.id || !this.revisionFresh(revision) || !this.isFresh(revision.inputs)) { this.store.update('fileOperations', op.id, { state: 'conflict' }); continue; }
        try { await this.exportForAcceptance(op.revisionId); } catch { continue; }
        try { this.commitOperation(op.id); } catch { this.store.update('fileOperations', op.id, { state: 'conflict' }); }
      } else if (op.state === 'written' || (content === null ? null : hash(content)) !== op.previousHash) this.store.update('fileOperations', op.id, { state: 'conflict' });
    }
    // Upgrade previously accepted documents and repair a missing derived export.
    for (const artifact of this.store.list('artifacts', a => !!a.acceptedRevisionId)) {
      try {
        const revision = this.store.get('artifactRevisions', artifact.acceptedRevisionId!);
        const item = this.store.get('workItems', artifact.workItemId);
        const path = await safePath(item.workspace, `.specflow/work-items/${item.id}/${artifact.logicalId}.md`);
        const content = await readFile(path, 'utf8').catch(() => null);
        if (content !== null && hash(content) === revision.contentHash) await this.exportForAcceptance(revision.id);
      } catch (error) {
        if (!(error instanceof DomainError && error.code === 'READING_EXPORT_FAILED')) this.store.emit(artifact.id, 'artifact.reading-export-failed', { message: (error as Error).message });
      }
    }
  }
  async scanExternalChanges(workItemId: string) {
    const item = this.store.get('workItems', workItemId);
    for (const artifact of this.store.list('artifacts', x => x.workItemId === workItemId && !!x.acceptedRevisionId)) {
      const accepted = this.store.get('artifactRevisions', artifact.acceptedRevisionId!);
      const path = await safePath(item.workspace, `.specflow/work-items/${item.id}/${artifact.logicalId}.md`);
      const content = await readFile(path, 'utf8').catch(() => null);
      if (content === null || hash(content) !== accepted.contentHash) {
        const current = this.store.get('artifactRevisions', artifact.currentRevisionId);
        if (hash(content || '') !== current.contentHash) this.create(item.id, artifact.logicalId, content || '', [], undefined, artifact.revision);
      }
    }
  }
}

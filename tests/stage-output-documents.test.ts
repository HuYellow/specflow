import test from 'node:test';
import assert from 'node:assert/strict';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { hash, type ExecutionRef, type HumanBrief } from '../packages/domain/index.ts';
import type { FrozenInput, StageOutput } from '../packages/execution-contract/index.ts';
import { clarifySpec, fixture, runNode } from './helpers.ts';

const brief: HumanBrief = { title: 'CSV 需求', summary: '支持逗号、引号与换行。', sections: [{ title: '范围', items: ['FR01：普通逗号分隔记录正确解析。'] }, { title: '错误', items: ['FR04：未闭合引号抛出明确错误。'] }] };

class BriefOutputBackend extends SandboxBackend {
  brief: unknown = brief;
  override async start(ref: ExecutionRef, input: FrozenInput) {
    const snapshot = await super.start(ref, input);
    if (input.node.id === 'specify') {
      const output = JSON.parse(snapshot.output!) as StageOutput;
      for (const artifact of output.artifacts) {
        if (this.brief === undefined) delete artifact.humanBrief;
        else Object.assign(artifact, { humanBrief: this.brief });
      }
      snapshot.output = JSON.stringify(output);
    }
    return snapshot;
  }
}

test('阶段结果保存每份人类简报；旧后端缺省简报时生成标明来源的摘录', async () => {
  const f = await fixture(), backend = new BriefOutputBackend();
  try {
    f.service.backends.sandbox = backend;
    const first = await runNode(f, 'specify');
    assert.equal(first.execution, 'completed', first.error);
    assert.equal(first.error, undefined);
    const original = f.store.list('artifactRevisions').at(-1)!;
    assert.deepEqual(original.humanBrief, brief);
    assert.equal(original.humanBriefSourceHash, original.contentHash);
    assert.equal(f.service.artifacts.reading(original.id).mode, 'authored');
    backend.brief = undefined;
    const second = await runNode(f, 'specify');
    assert.equal(second.error, undefined);
    const legacy = f.store.list('artifactRevisions').at(-1)!;
    assert.equal(legacy.humanBrief, undefined);
    assert.equal(f.service.artifacts.reading(legacy.id).mode, 'extractive');
    assert.equal(legacy.content, original.content, '是否提供简报不会改变 AI 正文');
    assert.equal(legacy.contentHash, original.contentHash);
    assert.equal(f.service.artifacts.reading(original.id).mode, 'authored', '历史结果保留自己的简报');
  } finally { await f.cleanup(); }
});

test('阶段输出拒绝超限或空白简报，边界长度与技术文本安全保留', async () => {
  const f = await fixture(), backend = new BriefOutputBackend();
  try {
    f.service.backends.sandbox = backend;
    const invalid: unknown[] = [
      { ...brief, title: 'x'.repeat(121) },
      { ...brief, title: '  ' },
      { ...brief, summary: 'x'.repeat(601) },
      { ...brief, sections: [] },
      { ...brief, sections: Array(7).fill(brief.sections[0]) },
      { ...brief, sections: [{ title: '范围', items: [] }] },
      { ...brief, sections: [{ title: '范围', items: Array(7).fill('条目') }] },
      { ...brief, sections: [{ title: '范围', items: ['x'.repeat(301)] }] },
    ];
    for (const malformed of invalid) {
      backend.brief = malformed;
      const node = await runNode(f, 'specify');
      assert.equal(node.gate, 'blocked');
      assert.match(node.error!, /产物契约/);
      assert.equal(f.store.list('artifactRevisions').length, 0, '失败结果不能留下部分产物');
    }
    backend.brief = { title: 'x'.repeat(120), summary: 'x'.repeat(600), sections: Array.from({ length: 6 }, () => ({ title: 'x'.repeat(120), items: Array(6).fill('x'.repeat(300)) })) };
    assert.equal((await runNode(f, 'specify')).error, undefined);
    backend.brief = { ...brief, title: '  CSV 需求  ', sections: [{ title: '技术说明', items: ['<script>alert("brief")</script> 是待说明的代码文本。'] }] };
    assert.equal((await runNode(f, 'specify')).error, undefined);
    const revision = f.store.list('artifactRevisions').at(-1)!;
    assert.equal(revision.humanBrief!.title, 'CSV 需求');
    const html = f.service.artifacts.readingHtml(revision.id);
    assert.ok(html.includes('&lt;script&gt;alert(&quot;brief&quot;)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>'));
  } finally { await f.cleanup(); }
});

test('澄清简报绑定补入问答记录后的完整规格', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify');
    await clarifySpec(f);
    const session = f.store.list('clarifications').at(-1)!;
    const revision = f.store.get('artifactRevisions', session.resultSpecRevisionId!);
    assert.match(revision.content, /澄清记录/);
    assert.match(revision.content, /Q001/);
    assert.ok(revision.humanBrief, '澄清生成的简报应传到最终规格修订');
    assert.equal(revision.humanBriefSourceHash, hash(revision.content));
    const reading = f.service.artifacts.reading(revision.id);
    assert.equal(reading.mode, 'authored');
    assert.equal(reading.sourceContentHash, revision.contentHash);
    assert.match(reading.brief.sections[1].items[0], /Q001/);
  } finally { await f.cleanup(); }
});

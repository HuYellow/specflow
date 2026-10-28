import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';

// Exercise the published lazy factory against the host's React 18 contract.
// The full DSH installation smoke remains a separate integration check.
const root = resolve(import.meta.dirname, '..');
const pluginRoot = join(root, 'plugins', 'deepseek-specflow');
const uiRequire = createRequire(join(pluginRoot, 'package.json'));
for (const name of ['react', 'react-dom']) {
  const version = JSON.parse(await readFile(uiRequire.resolve(`${name}/package.json`), 'utf8')).version;
  assert.equal(version.split('.')[0], '18', `UI smoke requires ${name} 18; install plugin development dependencies.`);
}
const runtime = await build({
  stdin: { contents: `import * as React from ${JSON.stringify(uiRequire.resolve('react'))}; import * as Jsx from ${JSON.stringify(uiRequire.resolve('react/jsx-runtime'))}; import {createRoot} from ${JSON.stringify(uiRequire.resolve('react-dom/client'))}; window.__sfModules={react:React,'react/jsx-runtime':Jsx};window.__sfCreateRoot=createRoot;`, resolveDir: root },
  bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' },
});
const client = await readFile(join(pluginRoot, 'dist', 'client.js'), 'utf8');
const output = join(root, '.tools', 'dsh-client-qa');
await mkdir(output, { recursive: true });

const app = String.raw`
const stamp='2026-10-21T05:00:00.000Z';
const entity=(id,extra)=>({id,revision:1,createdAt:stamp,updatedAt:stamp,...extra});
const target={backend:'dsh',connectionId:'deepseek',connectionSlug:'DeepSeek',model:'deepseek-chat',rootId:'qa-profile'};
const project=entity('project-1',{name:'Specflow 示例工程',rootPath:'C:\\projects\\demo',baseCommit:'abc12345',rules:'必须通过验证和独立复核。',defaults:{},commands:[{id:'test',executable:'npm',args:['test'],timeoutMs:120000}],demo:false,executionBackend:'dsh'});
const item=entity('item-1',{projectId:project.id,name:'为 CSV 导入增加异常处理',request:'支持引号、转义和错误提示。',kind:'feature',baseCommit:'abc12345',acceptedCommit:'abc12345',workspace:'C:\\workspaces\\item-1',branch:'specflow/csv-import',status:'active'});
const defs=[['specify','需求规格','agent'],['clarify','需求澄清','clarify'],['review-spec','规格复核','review'],['plan','工程设计','agent'],['tasks','任务拆解','agent'],['implement','代码实现','agent'],['verify','测试与检查','verify'],['accept','接纳代码','human']].map(([id,name,type])=>({id,name,type,prompt:'',inputs:[],outputs:[],role:type==='human'||type==='verify'?undefined:'analyst'}));
const flow=entity('flow-1',{workItemId:item.id,definition:{schemaVersion:1,id:'spec-driven',name:'规格驱动开发',nodes:defs,roles:{},requiredVerification:['test'],requireReview:true,requireClarification:true}});
const workflowRun=entity('run-1',{workItemId:item.id,workflowId:flow.id,state:'active',definition:flow.definition});
const nodes=defs.map(def=>entity('node-'+def.id,{workflowRunId:workflowRun.id,nodeId:def.id,name:def.name,type:def.type,execution:'pending',gate:'unchecked',freshness:'fresh',acceptance:'pending',blockers:[]}));
const artifact=entity('artifact-1',{workItemId:item.id,logicalId:'spec',type:'document',currentRevisionId:'revision-1',revisionIds:['revision-1'],owner:'local'});
const revision=entity('revision-1',{artifactId:artifact.id,content:'# CSV 导入规格\n\n支持正常字段、引号内逗号和错误输入。\n\n<script>window.__unsafe=true</script>',contentHash:'f'.repeat(64),acceptance:'candidate',reviewed:true,inputs:[]});
const attempt=entity('attempt-1',{nodeRunId:nodes[0].id,number:1,inputHash:'abc',inputs:[],target,prompt:'冻结的工程提示',codeBaseline:'abc12345',execution:'completed',output:'规格文档已经生成。',startedAt:stamp,finishedAt:stamp});
const clarification=entity('clarify-1',{workItemId:item.id,nodeRunId:nodes[1].id,sourceSpecRevisionId:revision.id,guidanceHash:'abc',state:'waiting_answers',questions:[{id:'q1',question:'遇到无效行时，是否继续导入？',reason:'此决策会改变错误处理与验收。',options:['停止并报告行号','跳过无效行']}],attemptIds:[]});
const candidate=entity('candidate-1',{workItemId:item.id,workspace:item.workspace,branch:item.branch,baseCommit:'abc12345',checkpointCommit:'def45678',attemptId:attempt.id,status:'ready'});
const requirementDocuments=[{id:'upload-1',name:'验收附件.md',content:'上传附件：错误必须报告行号。',source:'upload'},{id:'pasted-1',name:'用户补充说明.txt',content:'粘贴资料：支持 UTF-8。',source:'pasted'},{id:'repository-1',name:'existing-spec.md',content:'仓库资料：兼容现有导入调用。',source:'repository',repositoryPath:'docs/existing-spec.md'}];
const snapshot={item,project,requirements:{current:entity('requirements-1',{workItemId:item.id,number:1,request:item.request,documents:requirementDocuments,contentHash:'abc'}),history:[]},clarifications:[clarification],clarificationDrafts:[],workflows:[flow],runs:[workflowRun],nodes,attempts:[attempt],bindings:[],artifacts:[artifact],revisions:[revision],candidates:[candidate],evidence:[],findings:[],tasks:[],comments:[],decisions:[],interactions:[]};
window.fixture={visible:true,failRead:false,commandMode:'normal',rejectOn:'',commands:[],reads:0,types:[],seats:[],snapshot,target,disposers:[],sessionId:'qa-session',projects:[project],workItems:[item],nonGitDirectories:[],delayAssociationPath:undefined};
const copy=value=>JSON.parse(JSON.stringify(value));
let hostState={byId:{'qa-session':{id:'qa-session',cwd:undefined}},projections:{},sessions:{'qa-session':{openState:'open'}}};
const hostListeners=new Set();
const subscribeHost=listener=>{hostListeners.add(listener);return()=>hostListeners.delete(listener)};
const publishHost=()=>{for(const listener of hostListeners)listener()};
let releaseAssociation;
window.releaseAssociation=()=>{releaseAssociation?.();releaseAssociation=undefined};
window.changeRequirements=(request)=>{
  const previous=snapshot.requirements.current;
  const next=entity('requirements-'+(previous.number+1),{workItemId:item.id,number:previous.number+1,request,documents:copy(previous.documents),contentHash:'requirements-hash-'+(previous.number+1)});
  snapshot.requirements.current=next;snapshot.requirements.history.push(copy(previous));item.requirementRevisionId=next.id;item.request=request;item.revision++;return next;
};
window.changeArtifact=(content,reviewed=false)=>{
  const next=entity('revision-'+(artifact.revision+1),{artifactId:artifact.id,content,contentHash:'revision-hash-'+(artifact.revision+1),acceptance:'candidate',reviewed,inputs:[]});
  snapshot.revisions.push(next);artifact.currentRevisionId=next.id;artifact.revisionIds.push(next.id);artifact.revision++;return next;
};
const connection={rpc:{call:async(channel,endpoint,payload,signal)=>{
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  if(endpoint==='specflow/read'){
    fixture.reads++;
    if(fixture.failRead)return {ok:false,error:{code:'gateway/internal',message:'模拟：本地服务暂时不可用',details:{}}};
    let value;
    if(payload.resource==='bootstrap')value={version:'0.1.0',canWrite:true,projects:fixture.projects,workItems:fixture.workItems,catalog:{backends:[{id:'dsh',name:'DeepSeek Harness',capabilities:{available:true,canResume:false,canInteract:false,readOnlyReview:true}}],targets:[target]}};
    if(payload.resource==='snapshot')value=snapshot;
    if(payload.resource==='readiness')value={ready:true,reasons:[]};
    if(payload.resource==='artifact'){const source=snapshot.revisions.find(revision=>revision.id===payload.id);value={schemaVersion:1,sourceRevisionId:source.id,sourceContentHash:source.contentHash,mode:source.id===revision.id?'authored':'extractive',brief:{title:source.id===revision.id?'CSV 导入的行为边界':'修订后的 CSV 导入规格',summary:'让正常数据成功导入，并为异常数据提供可定位的错误。',sections:[{title:'验收标准',items:['支持带引号与转义的字段。','遇到无效数据报告具体行号。']}]}};}
    if(payload.resource==='attempt')value=attempt;
    if(payload.resource==='candidateDiff')value={candidate,diff:'diff --git a/csv.js b/csv.js\n--- a/csv.js\n+++ b/csv.js\n@@ -1 +1 @@\n-return row.split(",");\n+return parseQuotedFields(row);'};
    if(payload.resource==='acceptancePrecheck')value={candidateId:candidate.id,checkedAt:stamp,ready:true,blockers:[],candidateHash:'abc'};
    return {ok:true,value:copy(value)};
  }
  fixture.commands.push(copy(payload));
  if(payload.operation==='associateProject' && payload.input.rootPath===fixture.delayAssociationPath)await new Promise(resolve=>{releaseAssociation=resolve});
  await new Promise(resolve=>setTimeout(resolve,100));
  if(fixture.commandMode==='uncertain')return {ok:false,error:{code:'SPECFLOW_FAILURE',message:'模拟：响应丢失',details:{}}};
  if(fixture.rejectOn===payload.operation){fixture.rejectOn='';if(payload.operation==='saveRequirements')window.changeRequirements('服务端并发保存的新需求');if(payload.operation==='editArtifact')window.changeArtifact('# 服务端并发保存的新文档');return {ok:false,error:{code:'REVISION_CONFLICT',message:'内容已有新修订，请比较最新内容',details:{status:409}}};}
  if(payload.operation==='saveRequirements'){
    if(payload.input.expectedRevisionId!==snapshot.requirements.current.id)return {ok:false,error:{code:'REVISION_CONFLICT',message:'需求已有新版本',details:{status:409}}};
    const next=window.changeRequirements(payload.input.request);next.documents=copy(payload.input.documents);return {ok:true,value:copy(next)};
  }
  if(payload.operation==='editArtifact'){
    if(payload.input.expectedRevision!==artifact.revision)return {ok:false,error:{code:'REVISION_CONFLICT',message:'产物已变化，请比较最新内容',details:{status:409}}};
    return {ok:true,value:copy(window.changeArtifact(payload.input.content))};
  }
  if(payload.operation==='acceptArtifact')artifact.acceptedRevisionId=revision.id;
  if(payload.operation==='acceptCode')candidate.status='accepted';
  if(payload.operation==='saveClarificationDraft')snapshot.clarificationDrafts=[entity('draft-1',{sessionId:clarification.id,answers:payload.input.answers})];
  if(payload.operation==='answerInteraction')snapshot.interactions=snapshot.interactions.filter(interaction=>interaction.id!==payload.id);
  if(payload.operation==='configureProject')Object.assign(project,payload.input,{revision:project.revision+1});
  if(payload.operation==='createWorkItem')return {ok:true,value:item};
  if(payload.operation==='registerProject')return {ok:true,value:project};
  if(payload.operation==='associateProject'){
    const path=payload.input.rootPath;
    if(fixture.nonGitDirectories.includes(path))return {ok:false,error:{code:'GIT_FAILED',message:'模拟：当前目录不是 Git 仓库',details:{status:400}}};
    const workItem=fixture.workItems.find(value=>value.workspace===path);
    let associated=fixture.projects.find(value=>value.rootPath===path || value.id===workItem?.projectId);
    if(!associated){associated=entity('project-'+(fixture.projects.length+1),{...copy(project),id:'project-'+(fixture.projects.length+1),name:path.split(/[\\/]/).filter(Boolean).at(-1),rootPath:path});fixture.projects.push(associated)}
    return {ok:true,value:copy({project:associated,workItemId:workItem?.id})};
  }
  return {ok:true,value:copy(project)};
}}};
const lifetime=new AbortController();
let Body;
const ctx={connection,effect:callback=>{const dispose=callback();fixture.disposers.push(dispose);return dispose},sidebarRightTabs:{register:type=>{fixture.types.push(type);return()=>fixture.types.splice(fixture.types.indexOf(type),1)}},slots:{inject:(name,callback)=>callback(),register:(options,component)=>{fixture.seats.push(options);Body=component;return()=>fixture.seats.splice(fixture.seats.indexOf(options),1)}}};
window.plugin.apply(ctx);
const mount=document.getElementById('mount');
let reactRoot=window.__sfCreateRoot(mount);
const useSessions=selector=>selector(window.__sfModules.react.useSyncExternalStore(subscribeHost,()=>hostState));
const render=()=>{
  const sessionId=fixture.sessionId;
  const useProjection=key=>window.__sfModules.react.useSyncExternalStore(subscribeHost,()=>hostState.projections[sessionId]?.[key]);
  const useSession=selector=>selector(window.__sfModules.react.useSyncExternalStore(subscribeHost,()=>hostState).sessions[sessionId]);
  reactRoot.render(window.__sfModules.react.createElement(Body,{connection,sessionId,useSessions,useSession,useProjection,useTabInfo:()=>({tab:{id:'qa-tab',visible:fixture.visible,signal:lifetime.signal,actions:{bindCommands:()=>()=>{}}}})}));
};
window.setSessionContext=({sessionId=fixture.sessionId,cwd,workingDirectory,openState='open'})=>{
  fixture.sessionId=sessionId;
  hostState={byId:{...hostState.byId,[sessionId]:{id:sessionId,cwd}},projections:{...hostState.projections,[sessionId]:{workingDirectory}},sessions:{...hostState.sessions,[sessionId]:{openState}}};
  publishHost();render();
};
window.setWorkingDirectory=workingDirectory=>{
  hostState={...hostState,projections:{...hostState.projections,[fixture.sessionId]:{workingDirectory}}};
  publishHost();
};
window.setSessionOpenState=openState=>{
  hostState={...hostState,sessions:{...hostState.sessions,[fixture.sessionId]:{openState}}};
  publishHost();
};
window.setVisible=value=>{fixture.visible=value;render()};
window.remountPanel=()=>{reactRoot.unmount();reactRoot=window.__sfCreateRoot(mount);render()};
window.disablePlugin=()=>{reactRoot.unmount();lifetime.abort();for(const dispose of fixture.disposers.reverse())if(typeof dispose==='function')dispose();};
render();
`;
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>html,body{height:100%;margin:0}#mount{height:100%;max-width:460px;border-right:1px solid #dce4d9}</style></head><body><div id="mount"></div><script src="/runtime.js"></script><script>window.__ModuleLoader__={load:({factory})=>{window.plugin=factory(name=>window.__sfModules[name])}};</script><script src="/client.js"></script><script>${app.replaceAll('</script', '<\\/script')}</script></body></html>`;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8');
  response.end(request.url === '/runtime.js' ? runtime.outputFiles[0].text : request.url === '/client.js' ? client : html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const browser = await chromium.launch({ headless: true, channel: process.env.SPECFLOW_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
const page = await browser.newPage({ viewport: { width: 420, height: 1000 }, deviceScaleFactor: 1 });
// Existing assertions exercise Chinese; English and switching have a separate smoke check.
await page.addInitScript(() => localStorage.setItem('specflow-locale', 'zh-CN'));
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const checks = [];
try {
  await page.goto(`http://127.0.0.1:${address.port}`);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  assert.deepEqual(await page.evaluate(() => ({ kind: fixture.types[0].kind, key: fixture.seats[0].key, styles: document.querySelectorAll('style[data-plugin="dsh-plugin-specflow"]').length })), { kind: 'specflow', key: 'dsh-plugin-specflow/workbench', styles: 1 });
  await page.getByRole('button', { name: '启动此步骤', exact: true }).waitFor({ state: 'visible' });
  checks.push('Published factory registers the real keyed tab and renders with shared React 18.');
  for (const width of [420, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No horizontal overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 420, height: 1000 });
  await page.screenshot({ path: join(output, 'flow.png') });

  await page.evaluate(() => { fixture.failRead = true; });
  await page.getByRole('button', { name: '刷新工程状态', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '本地服务暂时不可用' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '启动此步骤', exact: true }).isDisabled(), true);
  assert.equal(await page.evaluate(() => fixture.commands.length), 0);
  await page.evaluate(() => { fixture.failRead = false; });
  await page.getByRole('button', { name: '刷新核对', exact: true }).click();
  await page.getByRole('alert').waitFor({ state: 'hidden' });
  checks.push('Read failures retain the last snapshot and disable dispatch until a successful refresh.');

  const model = page.getByLabel('连接与模型', { exact: true });
  await model.evaluate(select => { const option = document.createElement('option'); option.value = '{"backend":"maka","connectionId":"forged","model":"untrusted"}'; option.textContent = '伪造模型'; select.append(option); select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.getByRole('button', { name: '启动此步骤', exact: true }).evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => fixture.commands.length === 1);
  assert.deepEqual(await page.evaluate(() => fixture.commands[0].input.target), await page.evaluate(() => fixture.target));
  await page.waitForFunction(() => !document.querySelector('[data-specflow-panel]').getAttribute('aria-busy') || document.querySelector('[data-specflow-panel]').getAttribute('aria-busy') === 'false');
  checks.push('A forged option cannot construct a target; two synchronous clicks dispatch one catalog target.');

  await page.evaluate(() => { fixture.commandMode = 'uncertain'; });
  await page.getByRole('button', { name: '启动此步骤', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '写入结果尚未确认' }).waitFor();
  const commandCount = await page.evaluate(() => fixture.commands.length);
  await page.waitForTimeout(2800);
  assert.equal(await page.getByRole('button', { name: '启动此步骤', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: '启动此步骤', exact: true }).evaluate(button => button.click());
  assert.equal(await page.evaluate(() => fixture.commands.length), commandCount);
  await page.evaluate(() => window.remountPanel());
  await page.getByRole('alert').filter({ hasText: '上次写入的结果尚未确认' }).waitFor();
  await page.getByRole('heading', { name: itemName() }).waitFor();
  assert.equal(await page.getByRole('button', { name: '启动此步骤', exact: true }).isDisabled(), true);
  await page.reload();
  await page.getByRole('alert').filter({ hasText: '上次写入的结果尚未确认' }).waitFor();
  await page.getByRole('heading', { name: itemName() }).waitFor();
  assert.equal(await page.getByRole('button', { name: '启动此步骤', exact: true }).isDisabled(), true);
  assert.equal(await page.evaluate(() => fixture.commands.length), 0);
  await page.evaluate(() => { fixture.commandMode = 'normal'; });
  await page.getByRole('button', { name: '刷新核对', exact: true }).click();
  await page.getByRole('alert').waitFor({ state: 'hidden' });
  checks.push('A real SPECFLOW_FAILURE never retries and stays locked through polling, panel remount and page reload until explicit refresh.');

  await page.getByRole('button', { name: '文档', exact: true }).click();
  await page.getByRole('heading', { name: 'CSV 导入的行为边界' }).waitFor();
  await page.screenshot({ path: join(output, 'documents.png') });
  await page.evaluate(() => { document.documentElement.setAttribute('data-ds-theme-source', 'dark'); document.body.setAttribute('data-ds-dark-theme', ''); });
  assert.equal(await page.locator('[data-specflow-panel]').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(29, 38, 33)');
  await page.screenshot({ path: join(output, 'documents-dark.png') });
  await page.evaluate(() => { document.documentElement.setAttribute('data-ds-theme-source', 'light'); document.body.removeAttribute('data-ds-dark-theme'); });
  await page.emulateMedia({ colorScheme: 'dark' });
  assert.equal(await page.locator('[data-specflow-panel]').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(245, 246, 242)');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: '完整执行文档', exact: true }).click();
  await page.getByRole('heading', { name: 'CSV 导入规格', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__unsafe), undefined);
  await page.getByRole('button', { name: '接纳此修订', exact: true }).click();
  await page.waitForFunction(() => fixture.commands.some(command => command.operation === 'acceptArtifact'));
  assert.equal(await page.evaluate(() => Object.hasOwn(fixture.commands.find(command => command.operation === 'acceptArtifact').input, 'actor')), false);
  checks.push('Reading/source views render safely, follow the DSH theme and accept through the strict owner-controlled API.');

  await page.getByRole('button', { name: '代码', exact: true }).click();
  await page.getByText('我已核对代码差异与验证证据，确认将候选整合到工程', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '接纳代码', exact: true }).isDisabled(), true);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '接纳代码', exact: true }).click();
  await page.waitForFunction(() => fixture.commands.some(command => command.operation === 'acceptCode'));
  checks.push('Code acceptance requires loaded diff, a passed precheck and the explicit review checkbox.');

  await page.getByRole('button', { name: /^流程/ }).click();
  await page.getByRole('button', { name: '切换步骤' }).click();
  await page.getByRole('button', { name: /需求澄清/ }).click();
  await page.getByRole('button', { name: '停止并报告行号', exact: true }).click();
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await page.waitForFunction(() => fixture.commands.some(command => command.operation === 'saveClarificationDraft'));
  assert.equal(await page.evaluate(() => fixture.commands.find(command => command.operation === 'saveClarificationDraft').input.answers.q1), '停止并报告行号');
  checks.push('Clarification options are editable and save through the versioned draft API.');

  await page.locator('.sf-requirements > summary').click();
  await page.getByRole('button', { name: '编辑需求', exact: true }).click();
  const requestEditor = page.getByLabel('需求正文', { exact: true });
  const requestDraft = '保留用户正文草稿，并补充异常行与 UTF-8 的验收条件。';
  await requestEditor.fill(requestDraft);
  assert.equal(await page.getByLabel('工程', { exact: true }).isDisabled(), true);
  assert.equal(await page.getByLabel('工作项', { exact: true }).isDisabled(), true);
  await page.waitForTimeout(2800);
  assert.equal(await requestEditor.inputValue(), requestDraft);
  await page.getByRole('button', { name: '文档', exact: true }).click();
  await page.getByRole('button', { name: /^流程/ }).click();
  assert.equal(await requestEditor.inputValue(), requestDraft);
  const firstRequirementId = await page.evaluate(() => fixture.snapshot.requirements.current.id);
  const preservedDocuments = await page.evaluate(() => fixture.snapshot.requirements.current.documents);
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await requestEditor.waitFor({ state: 'hidden' });
  const firstRequirementSave = await page.evaluate(() => fixture.commands.find(command => command.operation === 'saveRequirements'));
  assert.equal(firstRequirementSave.input.expectedRevisionId, firstRequirementId);
  assert.equal(firstRequirementSave.input.request, requestDraft);
  assert.deepEqual(firstRequirementSave.input.documents, preservedDocuments);
  assert.equal(await page.getByLabel('工作项', { exact: true }).isDisabled(), false);

  await page.getByRole('button', { name: '编辑需求', exact: true }).click();
  const conflictingRequirementDraft = '并发保存失败后仍保留的需求草稿';
  await requestEditor.fill(conflictingRequirementDraft);
  const staleRequirementId = await page.evaluate(() => fixture.snapshot.requirements.current.id);
  await page.evaluate(() => { fixture.rejectOn = 'saveRequirements'; });
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await page.locator('.sf-requirements .sf-editor-conflict').waitFor();
  assert.equal(await requestEditor.inputValue(), conflictingRequirementDraft);
  await page.locator('.sf-requirements').getByRole('button', { name: '以最新修订继续编辑', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '保存需求', exact: true }).isDisabled(), true);
  const staleRequirementSave = await page.evaluate(() => fixture.commands.filter(command => command.operation === 'saveRequirements').at(-1));
  assert.equal(staleRequirementSave.input.expectedRevisionId, staleRequirementId);
  await page.locator('.sf-requirements').getByText('查看最新需求', { exact: true }).click();
  await page.getByText('服务端并发保存的新需求', { exact: true }).waitFor();
  await page.locator('.sf-requirements').getByRole('button', { name: '以最新修订继续编辑', exact: true }).click();
  assert.equal(await requestEditor.inputValue(), conflictingRequirementDraft);
  const latestRequirementId = await page.evaluate(() => fixture.snapshot.requirements.current.id);
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await requestEditor.waitFor({ state: 'hidden' });
  const mergedRequirementSave = await page.evaluate(() => fixture.commands.filter(command => command.operation === 'saveRequirements').at(-1));
  assert.equal(mergedRequirementSave.input.expectedRevisionId, latestRequirementId);
  assert.deepEqual(mergedRequirementSave.input.documents, preservedDocuments);
  checks.push('Requirement edits keep uploaded, pasted and repository documents, preserve drafts through polling/tab switches and use frozen revision IDs with explicit conflict resolution.');

  await page.getByRole('button', { name: '文档', exact: true }).click();
  await page.getByRole('button', { name: '编辑文档', exact: true }).click();
  const documentEditor = page.getByLabel('文档 Markdown 正文', { exact: true });
  const manualContent = '# 人工修订后的规格\n\n保留错误行号，并明确无效数据不写入。';
  await documentEditor.fill(manualContent);
  const oldArtifactVersion = await page.evaluate(() => fixture.snapshot.artifacts[0].revision);
  const oldAcceptedRevision = await page.evaluate(() => fixture.snapshot.artifacts[0].acceptedRevisionId);
  await page.waitForTimeout(2800);
  assert.equal(await documentEditor.inputValue(), manualContent);
  await page.getByRole('button', { name: /^流程/ }).click();
  await page.getByRole('button', { name: '文档', exact: true }).click();
  assert.equal(await documentEditor.inputValue(), manualContent);
  await page.evaluate(() => { fixture.rejectOn = 'editArtifact'; });
  await page.getByRole('button', { name: '保存新候选', exact: true }).click();
  await page.locator('.sf-document-editor .sf-editor-conflict').waitFor();
  assert.equal(await documentEditor.inputValue(), manualContent);
  const staleArtifactSave = await page.evaluate(() => fixture.commands.filter(command => command.operation === 'editArtifact').at(-1));
  assert.equal(staleArtifactSave.input.expectedRevision, oldArtifactVersion);
  await page.locator('.sf-document-editor').getByRole('button', { name: '以最新修订继续编辑', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '保存新候选', exact: true }).isDisabled(), true);
  await page.locator('.sf-document-editor').getByText('查看最新文档', { exact: true }).click();
  await page.getByText('# 服务端并发保存的新文档', { exact: true }).waitFor();
  await page.screenshot({ path: join(output, 'document-edit-conflict.png') });
  await page.locator('.sf-document-editor').getByRole('button', { name: '以最新修订继续编辑', exact: true }).click();
  assert.equal(await documentEditor.inputValue(), manualContent);
  const latestArtifactVersion = await page.evaluate(() => fixture.snapshot.artifacts[0].revision);
  await page.getByRole('button', { name: '保存新候选', exact: true }).click();
  await documentEditor.waitFor({ state: 'hidden' });
  await page.getByRole('heading', { name: '人工修订后的规格', exact: true }).waitFor();
  const artifactSave = await page.evaluate(() => fixture.commands.filter(command => command.operation === 'editArtifact').at(-1));
  assert.equal(artifactSave.input.expectedRevision, latestArtifactVersion);
  assert.equal(artifactSave.input.content, manualContent);
  assert.equal(await page.getByRole('button', { name: '接纳此修订', exact: true }).isDisabled(), true);
  await page.getByText('待独立复核', { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => { const artifact = fixture.snapshot.artifacts[0]; const current = fixture.snapshot.revisions.find(revision => revision.id === artifact.currentRevisionId); return { accepted: artifact.acceptedRevisionId, reviewed: current.reviewed, acceptance: current.acceptance }; }), { accepted: oldAcceptedRevision, reviewed: false, acceptance: 'candidate' });
  assert.equal(await page.evaluate(() => fixture.commands.filter(command => command.operation === 'acceptArtifact').length), 1);
  await page.screenshot({ path: join(output, 'document-edited-candidate.png') });
  checks.push('Artifact editing freezes the artifact revision, retains text on 409 conflicts and saves a fresh unreviewed candidate without accepting or reusing approval of the old revision.');

  await page.getByRole('button', { name: '运行', exact: true }).click();
  await page.getByText('规格文档已经生成。', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '尝试恢复原执行', exact: true }).count(), 0);
  await page.evaluate(() => window.setVisible(false));
  const hiddenReads = await page.evaluate(() => fixture.reads);
  await page.waitForTimeout(2800);
  assert.equal(await page.evaluate(() => fixture.reads), hiddenReads);
  await page.evaluate(() => window.setVisible(true));
  await page.waitForFunction(previous => fixture.reads > previous, hiddenReads);
  const hostDocument = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang }));
  await page.getByRole('combobox', { name: '界面语言', exact: true }).selectOption('en');
  await page.waitForFunction(() => document.querySelector('.sf-workbench')?.getAttribute('lang') === 'en');
  await page.getByText('The operation was recorded. Synchronizing project state.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Documents', exact: true }).click();
  await page.getByRole('button', { name: /^Edit document$/i }).click();
  const languageDraft = '# 用户原文与未保存的语言切换草稿';
  await page.getByLabel('Document Markdown Content', { exact: true }).fill(languageDraft);
  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('zh-CN');
  assert.equal(await page.getByLabel('文档 Markdown 正文', { exact: true }).inputValue(), languageDraft);
  await page.getByRole('combobox', { name: '界面语言', exact: true }).selectOption('en');
  assert.equal(await page.getByLabel('Document Markdown Content', { exact: true }).inputValue(), languageDraft);
  assert.deepEqual(await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang })), hostDocument);
  assert.equal(await page.locator('.sf-workbench').evaluate(element => element.scrollWidth > element.clientWidth), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('specflow-locale')), 'en');
  await page.screenshot({ path: join(output, 'english-document-draft.png') });
  await page.getByRole('button', { name: /^Cancel document editing$/i }).click();
  checks.push('English/Chinese switching preserves unsaved document text, persists the selection, leaves the host document unchanged, and fits a 420px panel.');

  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('zh-CN');
  const projectSelect = page.getByLabel('工程', { exact: true });
  const originalRoot = await page.evaluate(() => fixture.projects[0].rootPath);
  const chatRoot = String.raw`C:\projects\current-chat`;
  await page.evaluate(cwd => { window.setSessionContext({ sessionId: 'associated-chat', cwd }); }, originalRoot);
  await page.getByText('已关联当前对话工程', { exact: true }).waitFor();
  assert.equal(await projectSelect.inputValue(), 'project-1');
  assert.equal(await page.getByLabel('工作项', { exact: true }).inputValue(), 'item-1');
  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'new-chat', cwd }), chatRoot);
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, chatRoot);
  await page.getByText('已关联当前对话工程', { exact: true }).waitFor();
  await page.getByRole('heading', { name: '从一个新需求开始', exact: true }).waitFor();
  const chatProjectId = await projectSelect.inputValue();
  assert.notEqual(chatProjectId, 'project-1');
  assert.equal(await page.evaluate(rootPath => fixture.projects.filter(project => project.rootPath === rootPath).length, chatRoot), 1);
  checks.push('A newly opened chat selects its own repository and automatically registers an unseen repository, replacing the previous chat selection.');

  const coldOriginalRoot = String.raw`C:\projects\cold-original`;
  const coldCurrentRoot = String.raw`C:\projects\cold-current`;
  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'cold-opening-chat', cwd, openState: 'loading' }), coldOriginalRoot);
  await page.waitForTimeout(300);
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), coldCurrentRoot);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(roots => fixture.commands.some(command => command.operation === 'associateProject' && roots.includes(command.input.rootPath)), [coldOriginalRoot, coldCurrentRoot]), false);
  await page.evaluate(() => window.setSessionOpenState('open'));
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, coldCurrentRoot);
  assert.equal(await page.evaluate(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), coldOriginalRoot), false);
  checks.push('A cold chat waits for its opening baseline and associates the current working-directory projection without registering its stale original directory.');

  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'new-chat', cwd }), chatRoot);
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, chatRoot);
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), originalRoot);
  await page.waitForFunction(() => document.querySelector('.sf-context > .sf-path')?.textContent === fixture.projects[0].rootPath);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await projectSelect.selectOption(chatProjectId);
  await page.waitForTimeout(2800);
  assert.equal(await projectSelect.inputValue(), chatProjectId);
  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'another-chat', cwd }), originalRoot);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  assert.equal(await projectSelect.inputValue(), 'project-1');
  checks.push('Live working-directory projections update the project; a manual selection survives polling and does not leak into another chat.');

  await page.evaluate(() => window.setVisible(false));
  const hiddenAssociations = await page.evaluate(() => fixture.commands.filter(command => command.operation === 'associateProject').length);
  const hiddenRoot = String.raw`C:\projects\hidden-chat`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), hiddenRoot);
  await page.waitForTimeout(2800);
  assert.equal(await page.evaluate(() => fixture.commands.filter(command => command.operation === 'associateProject').length), hiddenAssociations);
  await page.evaluate(() => window.setVisible(true));
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, hiddenRoot);
  checks.push('Hidden tabs do not associate changed directories; showing the tab associates the latest directory.');

  const nonGitRoot = String.raw`C:\notes\non-git`;
  await page.evaluate(cwd => { fixture.nonGitDirectories.push(cwd); window.setSessionContext({ sessionId: 'notes-chat', cwd }); }, nonGitRoot);
  await page.getByText('无法自动关联当前对话目录，请手动选择工程或打开 Git 仓库。', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '＋ 打开仓库', exact: true }).isEnabled(), true);
  assert.equal(await projectSelect.isEnabled(), true);
  const rejectedAssociations = await page.evaluate(rootPath => fixture.commands.filter(command => command.operation === 'associateProject' && command.input.rootPath === rootPath).length, nonGitRoot);
  await page.waitForTimeout(2800);
  assert.equal(await page.evaluate(rootPath => fixture.commands.filter(command => command.operation === 'associateProject' && command.input.rootPath === rootPath).length, nonGitRoot), rejectedAssociations);
  await projectSelect.selectOption(chatProjectId);
  assert.equal(await projectSelect.inputValue(), chatProjectId);
  checks.push('A non-Git chat directory shows a helpful association hint, remains usable for manual selection and does not retry on every poll.');

  const delayedRoot = String.raw`C:\projects\slow-chat`;
  const newerRoot = String.raw`C:\projects\latest-chat`;
  await page.evaluate(cwd => { fixture.delayAssociationPath = cwd; window.setSessionContext({ sessionId: 'racing-chat', cwd }); }, delayedRoot);
  await page.waitForFunction(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), delayedRoot);
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), newerRoot);
  await page.evaluate(() => {
    fixture.visibleAssociationPaths = [];
    fixture.associationObserver = new MutationObserver(() => { const path = document.querySelector('.sf-context > .sf-path')?.textContent; if (path) fixture.visibleAssociationPaths.push(path); });
    fixture.associationObserver.observe(document.getElementById('mount'), { subtree: true, childList: true, characterData: true });
    window.releaseAssociation();
  });
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, newerRoot);
  assert.equal(await page.locator('.sf-context > .sf-path').textContent(), newerRoot);
  assert.equal(await page.evaluate(rootPath => { fixture.associationObserver.disconnect(); return fixture.visibleAssociationPaths.includes(rootPath); }, delayedRoot), false);
  checks.push('A delayed response for an older directory is never selected after the chat has moved to a newer directory.');

  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'editing-chat', cwd }), originalRoot);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await page.locator('.sf-requirements > summary').click();
  await page.getByRole('button', { name: '编辑需求', exact: true }).click();
  const preservedContextDraft = '当前对话目录改变后仍须保留这份未保存的需求正文。';
  await page.getByLabel('需求正文', { exact: true }).fill(preservedContextDraft);
  const deferredRoot = String.raw`C:\projects\after-editing`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), deferredRoot);
  await page.getByText('当前对话目录已变化，保存或取消编辑后将自动关联。', { exact: true }).waitFor();
  await page.waitForTimeout(2800);
  assert.equal(await page.getByLabel('需求正文', { exact: true }).inputValue(), preservedContextDraft);
  assert.equal(await projectSelect.inputValue(), 'project-1');
  assert.equal(await page.evaluate(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), deferredRoot), false);
  await page.getByRole('button', { name: '取消编辑需求', exact: true }).click();
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, deferredRoot);
  await page.screenshot({ path: join(output, 'chat-project-association.png') });
  checks.push('Unsaved requirement text defers automatic association without losing the draft; cancelling editing applies the pending chat directory.');

  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'clarification-editing-chat', cwd }), originalRoot);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await page.getByRole('button', { name: '切换步骤' }).click();
  await page.getByRole('button', { name: /需求澄清/ }).click();
  const clarificationEditor = page.locator('.sf-question textarea');
  const clarificationAnswer = '先收集所有错误行，再显示行号供用户核对。';
  await clarificationEditor.fill(clarificationAnswer);
  const clarificationRoot = String.raw`C:\projects\after-clarification`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), clarificationRoot);
  await page.getByText('当前对话目录已变化，保存或取消编辑后将自动关联。', { exact: true }).waitFor();
  await page.waitForTimeout(2800);
  assert.equal(await clarificationEditor.inputValue(), clarificationAnswer);
  assert.equal(await projectSelect.inputValue(), 'project-1');
  assert.equal(await page.evaluate(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), clarificationRoot), false);
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, clarificationRoot);
  assert.equal(await page.evaluate(() => fixture.commands.filter(command => command.operation === 'saveClarificationDraft').at(-1).input.answers.q1), clarificationAnswer);
  checks.push('Unsaved clarification answers survive a directory change and polling; saving the answer draft releases the deferred association.');

  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'settings-editing-chat', cwd }), originalRoot);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await page.getByText('工程配置与验证命令', { exact: true }).click();
  const projectRules = page.locator('.sf-settings-form textarea');
  const configurationDraft = '保留尚未保存的工程规则，并核对新的验证命令。';
  await projectRules.fill(configurationDraft);
  await page.getByLabel('验证命令', { exact: true }).fill('node');
  const settingsRoot = String.raw`C:\projects\after-settings`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), settingsRoot);
  await page.getByText('当前对话目录已变化，保存或取消编辑后将自动关联。', { exact: true }).waitFor();
  await page.waitForTimeout(2800);
  assert.equal(await projectRules.inputValue(), configurationDraft);
  assert.equal(await page.getByLabel('验证命令', { exact: true }).inputValue(), 'node');
  assert.equal(await projectSelect.inputValue(), 'project-1');
  assert.equal(await page.evaluate(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), settingsRoot), false);
  await page.getByRole('button', { name: '取消配置修改', exact: true }).click();
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, settingsRoot);
  checks.push('Unsaved project rules and verification commands survive a directory change; cancelling configuration editing applies the deferred association.');

  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'settings-saving-chat', cwd }), originalRoot);
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await page.getByText('工程配置与验证命令', { exact: true }).click();
  const savedRules = '保存工程规则后再关联当前对话目录。';
  await projectRules.fill(savedRules);
  const savedSettingsRoot = String.raw`C:\projects\after-settings-save`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), savedSettingsRoot);
  await page.getByText('当前对话目录已变化，保存或取消编辑后将自动关联。', { exact: true }).waitFor();
  await page.getByRole('button', { name: '保存工程配置', exact: true }).click();
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, savedSettingsRoot);
  assert.equal(await page.evaluate(() => fixture.projects[0].rules), savedRules);
  checks.push('Saving edited project configuration preserves the submitted rules and releases the deferred directory association.');

  await page.evaluate(cwd => { fixture.snapshot.interactions.push({ id: 'interaction-draft', state: 'pending', request: '请选择遇到无效数据时的处理方式。' }); window.setSessionContext({ sessionId: 'interaction-editing-chat', cwd }); }, originalRoot);
  await page.getByRole('heading', { name: '运行正在等待你的回答', exact: true }).waitFor();
  const interactionAnswer = '保留当前数据并报告错误行。';
  await page.getByLabel('回答（文本或 JSON）', { exact: true }).fill(interactionAnswer);
  const interactionRoot = String.raw`C:\projects\after-interaction`;
  await page.evaluate(cwd => window.setWorkingDirectory(cwd), interactionRoot);
  await page.getByText('当前对话目录已变化，保存或取消编辑后将自动关联。', { exact: true }).waitFor();
  await page.waitForTimeout(2800);
  assert.equal(await page.getByLabel('回答（文本或 JSON）', { exact: true }).inputValue(), interactionAnswer);
  assert.equal(await projectSelect.inputValue(), 'project-1');
  assert.equal(await page.evaluate(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), interactionRoot), false);
  await page.getByRole('button', { name: '提交给当前运行', exact: true }).click();
  await page.waitForFunction(rootPath => document.querySelector('.sf-context > .sf-path')?.textContent === rootPath, interactionRoot);
  assert.equal(await page.evaluate(() => fixture.commands.filter(command => command.operation === 'answerInteraction').at(-1).input.answer), interactionAnswer);
  checks.push('An unsent run-interaction answer survives a directory change and polling; submitting it preserves the answer and applies the deferred association.');

  const oldPendingRoot = String.raw`C:\projects\old-pending-chat`;
  const newPendingRoot = String.raw`C:\projects\new-pending-chat`;
  await page.evaluate(cwd => { fixture.delayAssociationPath = cwd; window.setSessionContext({ sessionId: 'pending-write-chat', cwd }); }, oldPendingRoot);
  await page.waitForFunction(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), oldPendingRoot);
  await page.evaluate(() => window.setSessionContext({ sessionId: 'temporary-other-chat' }));
  await page.getByRole('heading', { name: itemName() }).waitFor();
  await page.evaluate(cwd => window.setSessionContext({ sessionId: 'pending-write-chat', cwd }), newPendingRoot);
  await page.getByRole('alert').filter({ hasText: '上次写入的结果尚未确认' }).waitFor();
  await page.evaluate(() => { fixture.commandMode = 'uncertain'; });
  await page.getByRole('button', { name: '刷新核对', exact: true }).click();
  await page.waitForFunction(rootPath => fixture.commands.some(command => command.operation === 'associateProject' && command.input.rootPath === rootPath), newPendingRoot);
  await page.getByRole('alert').filter({ hasText: '写入结果尚未确认' }).waitFor();
  await page.evaluate(() => { fixture.commandMode = 'normal'; window.releaseAssociation(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.remountPanel());
  await page.getByRole('alert').filter({ hasText: '上次写入的结果尚未确认' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '＋ 打开仓库', exact: true }).isDisabled(), true);
  checks.push('An old request completing after the same chat is remounted cannot clear a newer uncertain-write guard; the guard survives another remount.');

  await page.evaluate(() => window.disablePlugin());
  assert.deepEqual(await page.evaluate(() => ({ types: fixture.types.length, seats: fixture.seats.length, styles: document.querySelectorAll('style[data-plugin="dsh-plugin-specflow"]').length })), { types: 0, seats: 0, styles: 0 });
  const unloadedReads = await page.evaluate(() => fixture.reads);
  await page.waitForTimeout(2800);
  assert.equal(await page.evaluate(() => fixture.reads), unloadedReads);
  checks.push('Hidden sessions stop polling; plugin unload removes tab, slot, stylesheet and all timers.');
  assert.deepEqual(errors, []);
  const report = { passed: true, checks, pageErrors: errors, screenshots: ['flow.png', 'documents.png', 'documents-dark.png', 'document-edit-conflict.png', 'document-edited-candidate.png', 'chat-project-association.png'] };
  await writeFile(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await page.screenshot({ path: join(output, 'failure.png') });
  console.error(JSON.stringify({ pageErrors: errors, pageText: (await page.locator('body').innerText()).slice(0, 2000) }, null, 2));
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

function itemName() { return '为 CSV 导入增加异常处理'; }

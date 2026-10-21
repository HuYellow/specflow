import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const runtimeDir = resolve(option('--runtimeDir', join(repo, '.tools', 'dsh-validation')));
const runtimeRequire = createRequire(join(runtimeDir, 'package.json'));
const packageDir = name => dirname(runtimeRequire.resolve(`${name}/package.json`));
const load = async (name, file = 'lib/index.js') => import(pathToFileURL(join(packageDir(name), file)).href);
const profileName = 'specflow-smoke';

if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('DSH smoke requires Node.js 24+');

if (args.includes('--phase')) {
  await runPhase(option('--phase'), resolve(option('--root')));
} else {
  await runSmoke();
}

async function execute(argv, cwd, env, timeoutMs = 120_000) {
  return await new Promise((done, reject) => {
    const child = spawn(process.execPath, argv, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = `${output}${chunk}`.slice(-100_000); });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`DSH smoke child timed out: ${output}`)); }, timeoutMs);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); code === 0 ? done(output) : reject(new Error(`DSH smoke child exited ${code}: ${output}`)); });
  });
}

async function runSmoke() {
  const publicSource = option('--source');
  if (publicSource && !/^https:\/\/github\.com\/HuYellow\/specflow\/releases\/download\//.test(publicSource)
    && !/^git\+https:\/\/github\.com\/HuYellow\/specflow\.git#[0-9a-f]{40}&path:\/plugins\/deepseek-specflow$/.test(publicSource)) {
    throw new Error('Public smoke source must be a Specflow GitHub release asset or commit-pinned distribution package.');
  }
  const artifact = publicSource ?? resolve(option('--package', process.env.SPECFLOW_DSH_PACKAGE ?? join(repo, 'release', 'dsh', 'dsh-plugin-specflow-0.1.0.tgz')));
  if (!publicSource) await access(artifact);
  const root = await mkdtemp(join(tmpdir(), 'specflow-dsh-smoke-'));
  const home = join(root, 'home'), profileDir = join(home, 'profiles', profileName);
  const env = { ...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: '1' };
  try {
    const boot = await load('@deepseek-ai/dsh-app-boot');
    boot.initProfile(profileDir, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']);
    await writeFile(join(profileDir, 'cordis.patch.yml'), [
      '- id: hmr', '  disabled: true',
      '- id: web-runtime', '  config:', '    openBrowser: false', '    printUrl: false', '    surfaceContext: false',
      '',
    ].join('\n'));
    // Exercise the public DSH package installer, which adds the bundle selection
    // and lets the installation supply the one shared copy of its SDK peers.
    await execute([join(packageDir('@deepseek-ai/dsh'), 'lib', 'bin.js'), 'plugin', '--profile', profileName, 'add', artifact, '--ignore-scripts'], root, env);
    const manifest = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'));
    assert.ok(manifest.dsh.profile.bundles.includes('dsh-plugin-specflow'), 'DSH installer must activate the bundle');
    await assertRuntimeCompatibility(profileDir);
    const cli = fileURLToPath(import.meta.url);
    await execute([cli, '--runtimeDir', runtimeDir, '--root', root, '--phase', 'first'], root, env);
    await execute([cli, '--runtimeDir', runtimeDir, '--root', root, '--phase', 'restart'], root, env);
    const first = JSON.parse(await readFile(join(root, 'first.json'), 'utf8'));
    const second = JSON.parse(await readFile(join(root, 'restart.json'), 'utf8'));
    assert.equal(second.instanceId, first.instanceId);
    assert.equal(second.projectId, first.projectId);
    assert.equal(second.workItemId, first.workItemId);
    const report = { runtimeVersion: JSON.parse(await readFile(join(packageDir('@deepseek-ai/dsh'), 'package.json'), 'utf8')).version, package: publicSource ?? basename(artifact), installation: 'dsh plugin add <source> --ignore-scripts', first, restart: second };
    const output = resolve(option('--report', join(repo, '.tools', 'dsh-host-smoke.json')));
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2));
    process.stdout.write(`DSH host smoke passed: native profile install, authenticated RPC, client graph, restart and lock cleanup.\nReport: ${output}\n`);
  } catch (error) {
    process.stderr.write(`DSH smoke fixture retained: ${root}\n`);
    throw error;
  } finally {
    if (!args.includes('--keep') && await exists(join(root, 'restart.json'))) {
      const rel = relative(tmpdir(), root);
      if (isAbsolute(rel) || rel.startsWith('..') || !basename(root).startsWith('specflow-dsh-smoke-')) throw new Error('Refusing smoke cleanup outside its temporary root');
      await rm(root, { recursive: true, force: true });
    }
  }
}

async function runPhase(phase, root) {
  process.chdir(root);
  const home = join(root, 'home');
  assert.equal(process.env.DSH_HOME, home);
  await assertRuntimeCompatibility(join(home, 'profiles', profileName));
  const { runProfile } = await load('@deepseek-ai/dsh', 'lib/profile-boot.js');
  const { createLaunchEnvironmentSnapshot } = await load('@deepseek-ai/dsh-launch-environment');
  const environment = createLaunchEnvironmentSnapshot([{ source: 'process', values: Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined)) }]);
  const { ctx, shutdown } = await runProfile({ environment, profile: profileName, patchFiles: [], args: ['--no-open', '--host', '127.0.0.1', '--port', '0'] });
  try {
    const entry = [...ctx.loader.entries()].find(entry => entry.options.name === 'dsh-plugin-specflow');
    assert.ok(entry?.fiber, 'Specflow host must be mounted by the native profile loader');
    // Cordis 4.0.5 publishes FiberState as an erased const enum: ACTIVE = 2.
    assert.equal(entry.fiber.state, 2, `Specflow host state: ${entry.fiber.state}`);
    const connection = ctx.get('connection'), modules = ctx.get('clientModules'), server = ctx.get('webServer');
    assert.ok(connection && modules && server, 'Web profile must provide its native transport and client graph');
    const graph = modules.graph();
    const client = graph.entries.find(entry => entry.id === 'dsh-plugin-specflow');
    assert.ok(client, 'Installed bundle must contribute its browser face');
    assert.ok(client.inject.includes('@deepseek-ai/dsh-client-connection'));
    const bundle = await modules.fetchBundle(new Request(new URL(client.url, 'http://127.0.0.1/')));
    assert.equal(bundle.status, 200);
    const js = await bundle.text();
    assert.match(js, /__ModuleLoader__/);
    assert.match(js, /sidebar\.right\.pane\.tab/);

    const origin = server.getOrigin();
    const unauthenticated = await fetch(`${origin}/api/specflow/read`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.ok([401, 403].includes(unauthenticated.status), 'HTTP calls must require DSH authentication');
    const login = await fetch(connection.authenticatedUrl(`${origin}/`), { redirect: 'manual' });
    const cookie = login.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ');
    assert.ok(cookie, 'DSH must issue its authenticated browser cookie');
    const rpc = async (endpoint, payload) => {
      const rpcId = crypto.randomUUID();
      const response = await fetch(`${origin}/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin }, body: JSON.stringify({ type: 'client-request', rpcId, method: endpoint, payload }) });
      assert.equal(response.status, 200);
      const envelope = await response.json();
      assert.equal(envelope.rpcId, rpcId);
      assert.equal(envelope.result.ok, true, JSON.stringify(envelope.result));
      return envelope.result.value;
    };
    const read = request => rpc('specflow/read', request);
    const command = (operation, input = {}, id, idempotencyKey = crypto.randomUUID()) => rpc('specflow/command', { operation, input, id, idempotencyKey });
    let bootstrap = await read({ resource: 'bootstrap' });
    assert.equal(bootstrap.canWrite, true);
    if (phase === 'first') {
      assert.equal(bootstrap.projects.length, 0);
      const repository = join(root, 'repository');
      await mkdir(repository);
      await writeFile(join(repository, 'README.md'), '# DSH plugin smoke fixture\n');
      await git(repository, ['init']);
      await git(repository, ['add', '.']);
      await git(repository, ['-c', 'user.name=Specflow Smoke', '-c', 'user.email=smoke@localhost', 'commit', '-m', 'fixture']);
      const project = await command('registerProject', { rootPath: repository, name: 'Native DSH smoke' });
      assert.equal(project.executionBackend, 'dsh');
      const input = { projectId: project.id, name: 'Requirement isolation', request: 'FR01: Keep a durable requirement in an isolated workspace.', kind: 'feature', documents: [] };
      const first = await command('createWorkItem', input, undefined, 'smoke-create-item');
      const repeated = await command('createWorkItem', input, undefined, 'smoke-create-item');
      assert.equal(repeated.id, first.id);
    }
    bootstrap = await read({ resource: 'bootstrap' });
    assert.equal(bootstrap.projects.length, 1);
    assert.equal(bootstrap.workItems.length, 1);
    const project = bootstrap.projects[0], item = bootstrap.workItems[0];
    const snapshot = await read({ resource: 'snapshot', id: item.id });
    assert.equal(snapshot.item.id, item.id);
    assert.ok(snapshot.nodes.length > 0);
    const guest = connection.createPeer({ principal: { kind: 'specflow-smoke-guest' }, interactions: 'none' });
    const guestResponse = await connection.createSharedFetchHandler('/api').fetch(new Request('http://127.0.0.1/api/specflow/read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'guest-read', method: 'specflow/read', payload: { resource: 'bootstrap' } }) }), guest);
    assert.equal(guestResponse.status, 403, 'Connection must reject non-owner Peers before exact route dispatch');
    const profileIdentity = JSON.parse(await readFile(join(home, 'specflow', 'profile.json'), 'utf8'));
    const report = { phase, instanceId: profileIdentity.instanceId, projectId: project.id, workItemId: item.id, hostEntry: 'active', clientEntry: client.id, clientBytes: js.length, anonymousHttpRejected: true, guestRpcRejected: true, nodes: snapshot.nodes.length };
    await shutdown.shutdown(0);
    assert.equal(await exists(join(home, 'specflow', 'host.lock')), false, 'Native shutdown must release profile ownership');
    await writeFile(join(root, `${phase}.json`), JSON.stringify({ ...report, cleanShutdown: true }, null, 2));
  } finally { await shutdown.shutdown(0); }
}

async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function assertRuntimeCompatibility(profileDir) {
  const actual = JSON.parse(await readFile(join(packageDir('@deepseek-ai/dsh'), 'package.json'), 'utf8')).version;
  const installed = JSON.parse(await readFile(join(profileDir, 'node_modules', 'dsh-plugin-specflow', 'package.json'), 'utf8'));
  assert.equal(actual, installed.engines.dsh, 'The release smoke must use the exact DSH release declared by the installed plugin');
}
async function git(cwd, args) {
  return await new Promise((done, reject) => {
    const child = spawn('git', args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject); child.on('exit', code => code === 0 ? done(output) : reject(new Error(`Fixture git exited ${code}: ${output}`)));
  });
}

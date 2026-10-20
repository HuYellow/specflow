import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, parse, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const interactive = process.argv.includes('--interactive');
if (process.platform !== 'win32') throw new Error('Installer directory smoke tests must run on Windows.');
if (process.argv.slice(2).some(argument => argument !== '--interactive')) throw new Error('Supported argument: --interactive.');

// These executables contain no application payload and only write a report here.
const output = join(root, '.tools/installer-directory-test');
const executable = join(output, 'installer-directory-test.exe');
const report = join(output, 'results.log');
const casesFile = join(output, 'cases.nsh');
const fixture = join(root, 'tests/fixtures/installer-directory.nsi');
const include = join(root, 'build/desktop/installer-paths.nsh');
const { nsisTemplatesDir } = require('app-builder-lib/out/targets/nsis/nsisUtil.js');
const { getMakeNsisPath } = require('app-builder-lib/out/toolsets/windows.js');
const { nsisEscapeString } = require('app-builder-lib/out/targets/nsis/nsisScriptGenerator.js');

const cases = [
  ['C drive root', 'C:\\', 'C:\\specflow'],
  ['H drive root', 'H:\\', 'H:\\specflow'],
  ['root with repeated separators', 'H:\\\\', 'H:\\specflow'],
  ['root with forward separator', 'H:/', 'H:\\specflow'],
  ['custom folder', 'H:\\apps', 'H:\\apps'],
  // NSIS itself strips trailing separators when assigning its $INSTDIR variable.
  ['custom folder with trailing separator', 'H:\\apps\\', 'H:\\apps'],
  ['existing specflow folder', 'H:\\specflow', 'H:\\specflow'],
  ['existing mixed case folder', 'H:\\SpecFlow', 'H:\\SpecFlow'],
  ['nested specflow folder', 'H:\\apps\\specflow', 'H:\\apps\\specflow'],
  ['folder below specflow', 'H:\\specflow\\other', 'H:\\specflow\\other'],
  ['unrelated folder', 'H:\\my-workbench', 'H:\\my-workbench'],
  ['app name substring', 'H:\\prefix-specflow-suffix', 'H:\\prefix-specflow-suffix'],
  ['spaces', 'C:\\Program Files\\My Tools', 'C:\\Program Files\\My Tools'],
  ['Chinese', 'H:\\开发工具', 'H:\\开发工具'],
  ['Chinese and spaces', 'H:\\我的 应用\\', 'H:\\我的 应用'],
  ['UNC root', '\\\\server\\share\\', '\\\\server\\share\\specflow'],
  ['UNC folder', '\\\\server\\share\\apps', '\\\\server\\share\\apps'],
];

function run(binary, args, env = {}, show = false, verbatim = false) {
  return new Promise((done, reject) => {
    const child = spawn(binary, args, { cwd: root, env: { ...process.env, ...env }, windowsHide: !show, windowsVerbatimArguments: verbatim, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? done() : reject(new Error(`${binary} failed (${signal ?? code}). See ${report}`)));
  });
}

await mkdir(output, { recursive: true });
const quote = value => `"${nsisEscapeString(value)}"`;
await writeFile(casesFile, cases.map(([name, input, expected]) => `!insertmacro CheckPath ${quote(name)} ${quote(input)} ${quote(expected)}`).join('\n') + '\n', 'utf8');
const makensis = await getMakeNsisPath();
await run(makensis.path, [
  '-V2', '-WX', '-INPUTCHARSET', 'UTF8',
  `-DTEST_EXE=${nsisEscapeString(executable)}`,
  `-DTEST_REPORT=${nsisEscapeString(report)}`,
  `-DTEST_CASES=${nsisEscapeString(casesFile)}`,
  `-DTEST_INCLUDE=${nsisEscapeString(include)}`,
  `-DTEST_ASSISTED=${nsisEscapeString(join(nsisTemplatesDir, 'assistedInstaller.nsh'))}`,
  `-X!addincludedir ${quote(join(nsisTemplatesDir, 'include'))}`,
  fixture,
], makensis.env);

const checks = [];
// NSIS validates /D= before .onInit and ignores drives that do not exist. Use
// mounted roots for executable checks; the in-memory cases above still cover H:.
const systemDriveRoot = parse(resolve(process.env.SystemRoot ?? process.execPath)).root;
const workspaceDriveRoot = parse(root).root;
const commandlineCases = interactive ? [['interactive selection', undefined, undefined]] : [
  ['silent system drive root', systemDriveRoot, join(systemDriveRoot, 'specflow')],
  ['silent workspace drive root', workspaceDriveRoot, join(workspaceDriveRoot, 'specflow')],
  ['silent custom folder', join(workspaceDriveRoot, 'apps'), join(workspaceDriveRoot, 'apps')],
  ['silent existing specflow folder', join(workspaceDriveRoot, 'specflow'), join(workspaceDriveRoot, 'specflow')],
  ['silent Chinese and spaces', `${join(workspaceDriveRoot, '我的 应用')}\\`, join(workspaceDriveRoot, '我的 应用')],
];
for (const [name, input, expected] of commandlineCases) {
  // NSIS requires /D= to be the final parameter without quotes, even for spaces.
  await run(executable, [...(interactive ? [] : ['/S']), ...(input ? [`/D=${input}`] : [])], {}, interactive, true);
  const lines = (await readFile(report, 'utf16le')).replace(/^\uFEFF/, '').trimEnd().split('\r\n');
  const selected = lines.shift();
  if (expected) assert.equal(selected, `SELECTED\t${expected}`, `${name}: customInit must normalize /D before the section runs`);
  assert.deepEqual(lines, cases.map(([caseName, , caseExpected]) => `PASS\t${caseName}\t${caseExpected}`));
  checks.push({ name, ...(input ? { input, expected } : {}), selected: selected?.slice('SELECTED\t'.length), passed: cases.length });
}
const summary = { passed: true, interactive, testedAt: new Date().toISOString(), nsis: makensis.path, source: include, template: join(nsisTemplatesDir, 'assistedInstaller.nsh'), cases: cases.length, checks };
await writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`Installer directory smoke passed: ${cases.length} path cases, preservation of registers, idempotence, and ${checks.length} ${interactive ? 'interactive' : 'silent /D='} run(s).`);
console.log(`Report: ${join(output, 'summary.json')}`);

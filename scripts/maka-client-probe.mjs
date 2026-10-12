import { _electron as electron } from '@playwright/test';
import { join } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
const install = join(process.env.LOCALAPPDATA, 'Programs/Maka-0.2.0-Source');
const app = await electron.launch({ executablePath: join(install, 'electron/Maka.exe'), args: [join(install, 'app')], timeout: 90000, env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined } });
let stdout = '', stderr = '';
app.process().stdout?.on('data', b => { stdout = (stdout + b).slice(-150000); });
app.process().stderr?.on('data', b => { stderr = (stderr + b).slice(-150000); });
try {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => !!window.maka?.runtimeHostProfiles, { timeout: 30000 });
  console.log('Bridge keys', await page.evaluate(() => Object.keys(window).filter(k => /maka|electron|api/i.test(k))));
  await page.waitForTimeout(15000);
  console.log('Body', (await page.locator('body').innerText()).slice(0, 3500));
  console.log('Host snapshot', JSON.stringify(await page.evaluate(() => window.maka.runtimeHostProfiles.getSnapshot()).catch(error => ({ error: String(error) }))));
  console.log(JSON.stringify(await app.evaluate(({ app }) => ({ version: app.getVersion(), name: app.getName(), profile: app.getPath('userData'), packaged: app.isPackaged })), null, 2));
  console.log((await page.locator('body').innerText()).slice(0, 3500));
  await mkdir('release', { recursive: true });
  await page.screenshot({ path: 'release/maka-client.png' });
} catch (error) { console.error(error); console.error(stderr.slice(-6000)); process.exitCode = 1; }
finally {
  await writeFile('release/maka-client-startup.log', `${stdout}\n${stderr}`);
  await app.close().catch(() => {});
}

// 목업을 덧입힌 페이지를 Impeccable 4.8.0 로 검사한다(--cdp: 떠 있는 페이지를 그대로 검사).
// 사용(저장소 루트에서): node docs/qa/2026-11-03-self-check/scripts/detect-cdp.mjs <url> <out.json> [cssFile] [jsFile]
// css·js 를 안 주면 주입 없는 A 대조군이 된다(URL 모드와 CDP 모드 차이를 가르기 위함).
import { createRequire } from 'module';
import fs from 'fs';
import { spawnSync } from 'child_process';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');

const [url, out, cssFile, jsFile] = process.argv.slice(2);
const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
await ctx.addInitScript(() => { try { localStorage.setItem('mhj-theme', 'light'); } catch {} });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
if (cssFile) await page.addStyleTag({ content: fs.readFileSync(cssFile, 'utf8') });
if (jsFile) await page.evaluate(fs.readFileSync(jsFile, 'utf8'));
await page.waitForTimeout(1500);
const r = spawnSync('npx', ['impeccable@4.8.0', 'detect', '--cdp', String(PORT), '--target', new URL(url).pathname === '/' ? 'mhj.nz' : new URL(url).pathname, '--json'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(out, r.stdout);
console.log('exit', r.status, 'findings', (() => { try { return JSON.parse(r.stdout).length; } catch { return 'parse-fail: ' + r.stderr.slice(0, 300); } })());
await browser.close();

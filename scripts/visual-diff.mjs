#!/usr/bin/env node
/**
 * Visual diff between two PNGs using pixelmatch.
 *
 * Usage: node scripts/visual-diff.mjs <a.png> <b.png> [diff.png] [threshold=0.1]
 *   threshold: 0..1 fraction of pixels allowed to differ (default 0.1 = 10%)
 *
 * Exit code: 0 if diff% <= threshold*100, else 1.
 * Side effect: writes diff PNG to <diff.png> (default /tmp/visual-diff.png).
 *
 * Used by Carousel V3 Session 1 gate (and reused by later sessions).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [, , aPath, bPath, diffPathArg, thresholdArg] = process.argv;
if (!aPath || !bPath) {
  console.error('usage: node scripts/visual-diff.mjs <a.png> <b.png> [diff.png] [threshold=0.1]');
  process.exit(2);
}
const diffPath = diffPathArg ?? '/tmp/visual-diff.png';
const threshold = thresholdArg ? Number(thresholdArg) : 0.1;

async function readPng(p) {
  const buf = await fs.readFile(path.resolve(p));
  return PNG.sync.read(buf);
}

const [a, b] = await Promise.all([readPng(aPath), readPng(bPath)]);

if (a.width !== b.width || a.height !== b.height) {
  console.error(`size mismatch: ${aPath} (${a.width}×${a.height}) vs ${bPath} (${b.width}×${b.height})`);
  process.exit(1);
}

const diff = new PNG({ width: a.width, height: a.height });
const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
  threshold: 0.1, // per-pixel color tolerance — pixelmatch internal, not the gate %
});
const totalPixels = a.width * a.height;
const diffPct = (diffPixels / totalPixels) * 100;

await fs.writeFile(path.resolve(diffPath), PNG.sync.write(diff));

const verdict = diffPct <= threshold * 100 ? 'PASS' : 'FAIL';
console.log(
  `diff: ${diffPixels.toLocaleString()} / ${totalPixels.toLocaleString()} pixels = ${diffPct.toFixed(2)}% (gate ${(threshold * 100).toFixed(0)}%) — ${verdict}`,
);
console.log(`diff PNG: ${path.resolve(diffPath)}`);

process.exit(verdict === 'PASS' ? 0 : 1);

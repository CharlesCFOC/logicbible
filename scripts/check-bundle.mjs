import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const manifest = JSON.parse(readFileSync('assets/react/.vite/manifest.json', 'utf8'));
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
visit('src/react/main.jsx');
for (const screen of ['kids-bible', 'prayer', 'church', 'apologetics-debate', 'ai']) {
  const key = `src/react/${screen}.jsx`;
  assert.ok(manifest[key]?.isDynamicEntry, `${screen} must remain a separate chunk`);
  assert.ok(!initial.has(key), `${screen} must not be loaded by the initial static dependency graph`);
}
const bytes = [...initial].reduce((total, key) => total + gzipSync(readFileSync(`assets/react/${manifest[key].file}`)).length, 0);
console.log(`Initial React modules: ${(bytes / 1000).toFixed(1)} kB gzip; heavy screens are loaded on first visit.`);

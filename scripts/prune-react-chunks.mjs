import { readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Game sessions last eight hours. Keep old hashed modules for a full day so
// tabs opened before a rebuild can still load their exact dependency graph.
export function pruneReactChunks(directory, now = Date.now()) {
  const manifest = JSON.parse(readFileSync(join(directory, '.vite/manifest.json'), 'utf8'));
  const current = new Set(Object.values(manifest).flatMap(entry => [entry.file, ...(entry.css || []), ...(entry.assets || [])]));
  let removed = 0;
  for (const filename of readdirSync(directory)) {
    if (!/-[\w-]{8,}\.js$/.test(filename) || current.has(filename)) continue;
    const path = join(directory, filename);
    if (!statSync(path).isFile() || now - statSync(path).mtimeMs <= 86_400_000) continue;
    unlinkSync(path);
    removed++;
  }
  return removed;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const directory = fileURLToPath(new URL('../assets/react/', import.meta.url));
  console.log(`React chunks: kept current and recent builds; removed ${pruneReactChunks(directory)} expired files.`);
}

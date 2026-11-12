import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pruneReactChunks } from './prune-react-chunks.mjs';

test('keeps the current graph and recent lazy chunks, pruning only expired historical modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'church-react-chunks-'));
  const now = Date.now();
  try {
    mkdirSync(join(root, '.vite'));
    writeFileSync(join(root, '.vite/manifest.json'), JSON.stringify({ main: { file: 'navigation.js' }, lazy: { file: 'pilot-ai-current1.js' } }));
    for (const [file, age] of [['navigation.js', 3], ['pilot-ai-current1.js', 3], ['pilot-ai-recent11.js', .5], ['pilot-ai-expired1.js', 2], ['unrelated.js', 3]]) {
      const path = join(root, file); writeFileSync(path, 'export {};');
      const date = new Date(now - age * 86_400_000); utimesSync(path, date, date);
    }
    assert.equal(pruneReactChunks(root, now), 1);
    assert.ok(!existsSync(join(root, 'pilot-ai-expired1.js')));
    for (const file of ['navigation.js', 'pilot-ai-current1.js', 'pilot-ai-recent11.js', 'unrelated.js']) assert.ok(existsSync(join(root, file)), file);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a missing or corrupt manifest never deletes the previous working modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'church-react-chunks-'));
  try {
    const old = join(root, 'pilot-ai-oldchunk.js'); writeFileSync(old, 'export {};');
    assert.throws(() => pruneReactChunks(root)); assert.ok(existsSync(old));
    mkdirSync(join(root, '.vite')); writeFileSync(join(root, '.vite/manifest.json'), '{broken');
    assert.throws(() => pruneReactChunks(root)); assert.ok(existsSync(old));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '../lib/server/environment.js';

await loadEnv('.env.local');
assert.equal(process.env.SUPABASE_URL, 'https://onbczidvuhezoouzdrae.supabase.co', 'Wrong destination');
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY, 'Missing server credential');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const verifyOnly = process.argv.includes('--verify-only');
const definitions = [
  ['books', 'version_id,book_id,name,position,chapter_count', ['book_id']],
  ['chapters', 'version_id,book_id,chapter,verse_count', ['book_id', 'chapter']],
  ['verses', 'version_id,book_id,chapter,verse,text', ['book_id', 'chapter', 'verse']],
];

async function request(build) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await build();
    if (!result.error) return result;
    if (attempt === 3 || (result.status >= 400 && result.status < 500 && result.status !== 429)) {
      throw new Error(`Database request failed: ${result.error.code || result.status} ${result.error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}

async function verify(version, payload) {
  const checksums = {};
  for (const [kind, columns, order] of definitions) {
    const table = `scripture_${kind}`;
    const expected = new Map(payload[kind].map(row => [order.map(k => row[k]).join(':'), row]));
    let count = 0;
    const hash = createHash('sha256');
    for (let offset = 0; ; offset += 1000) {
      const { data } = await request(() => {
        let query = db.from(table).select(columns).eq('version_id', version);
        for (const key of order) query = query.order(key);
        return query.range(offset, offset + 999);
      });
      for (const row of data) {
        const key = order.map(k => row[k]).join(':');
        assert.deepEqual(row, expected.get(key), `Content mismatch: ${table}/${key}`);
        expected.delete(key);
        hash.update(JSON.stringify(columns.split(',').map(k => row[k])) + '\n');
        count++;
      }
      if (data.length < 1000) break;
    }
    assert.equal(expected.size, 0, `Missing records: ${table}`);
    assert.equal(count, payload[kind].length);
    checksums[kind] = { count, sha256: hash.digest('hex') };
  }
  return checksums;
}

const reports = [];
for (const version of ['kjv', 'lsg1910']) {
  const payload = JSON.parse(await readFile(new URL(`../output/bible-import/${version}.json`, import.meta.url), 'utf8'));
  assert.equal(payload.version.id, version);
  const { data: existing } = await request(() => db.from('scripture_versions').select('*').eq('id', version).maybeSingle());
  if (!verifyOnly && !existing?.published) {
    await request(() => db.from('scripture_versions').upsert({ ...payload.version, published: false }));
    for (const [kind] of definitions) {
      for (let i = 0; i < payload[kind].length; i += 500) {
        await request(() => db.from(`scripture_${kind}`).upsert(payload[kind].slice(i, i + 500)));
        if (kind === 'verses' && i % 5000 === 0) console.log(`${version}: ${i}/${payload[kind].length} verses`);
      }
    }
  }
  // Published editions are immutable here: rerunning only verifies them.
  const checksums = await verify(version, payload);
  if (!verifyOnly && !existing?.published) {
    await request(() => db.from('scripture_versions').update({ published: true }).eq('id', version));
  }
  const { data: stored } = await request(() => db.from('scripture_versions').select('*').eq('id', version).single());
  assert.equal(stored.published, true);
  for (const [kind] of definitions) assert.equal(stored[`${kind.slice(0, -1)}_count`], payload[kind].length);
  reports.push({ version, source_sha256: stored.source_sha256, verified_at: new Date().toISOString(), ...checksums });
  console.log(`${version}: verified all records; published=${stored.published}`);
}
await writeFile(new URL('../output/bible-import/verification.json', import.meta.url), JSON.stringify(reports, null, 2) + '\n');

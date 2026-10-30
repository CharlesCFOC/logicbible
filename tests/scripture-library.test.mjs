import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('scripture library hides incomplete imports, denies browser writes, and enforces references', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(await readFile(new URL('../supabase/migrations/20261030214125_scripture_library.sql', import.meta.url), 'utf8'));
    await db.exec(`set role service_role;
      insert into scripture_versions values ('test','Test','en','https://example.org','https://example.org','Public domain',repeat('a',64),now(),false,1,1,1);
      insert into scripture_books values ('test','GEN','Genesis',1,1);
      insert into scripture_chapters values ('test','GEN',1,1);
      insert into scripture_verses values ('test','GEN',1,1,'Beginning');`);
    await assert.rejects(db.exec("insert into scripture_verses values ('test','GEN',2,1,'Bad reference');"), /foreign key/);
    await assert.rejects(db.exec("insert into scripture_verses values ('test','GEN',1,1,'Duplicate');"), /duplicate key/);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      for (const table of ['versions', 'books', 'chapters', 'verses']) {
        assert.equal((await db.query(`select * from scripture_${table}`)).rows.length, 0);
        await assert.rejects(db.exec(`delete from scripture_${table}`), /permission denied/);
      }
    }
    await db.exec("set role service_role; update scripture_versions set published=true;");
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      assert.equal((await db.query('select text from scripture_verses')).rows[0].text, 'Beginning');
      await assert.rejects(db.exec("update scripture_verses set text='Changed'"), /permission denied/);
      await assert.rejects(db.exec("insert into scripture_verses values ('test','GEN',1,2,'Added')"), /permission denied/);
    }
  } finally { await db.close(); }
});

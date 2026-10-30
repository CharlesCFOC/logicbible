import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { readPrayerVoteSummary } from '../lib/prayer/intercession-votes.js';
const migration = await readFile(new URL('../supabase/migrations/20261030175438_ai_usage_and_vote_summary.sql',import.meta.url),'utf8');

test('SQL quotas enforce shared limits, refuse browser roles, and aggregate only valid vote windows',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create table public.user_app_state(user_id uuid, state_key text, payload jsonb, updated_at timestamptz, primary key(user_id,state_key));
      grant select on public.user_app_state to service_role;`);
    await db.exec(migration);
    for(const role of ['anon','authenticated']){
      await assert.rejects(db.exec(`begin; set local role ${role}; select public.reserve_ai_call('user:test',2,3,4);`),/permission denied/);
      await db.exec('rollback');
      await assert.rejects(db.exec(`begin; set local role ${role}; select * from public.ai_usage_buckets;`),/permission denied/);
      await db.exec('rollback');
      await assert.rejects(db.exec(`begin; set local role ${role}; select public.intercession_vote_summary(600000,null);`),/permission denied/);
      await db.exec('rollback');
    }
    await db.exec('set role service_role');
    const reserve=async(actor,h=2,d=3,g=4)=>(await db.query('select public.reserve_ai_call($1,$2,$3,$4) as result',[actor,h,d,g])).rows[0].result;
    const results=await Promise.all(Array.from({length:5},()=>reserve('user:a')));
    assert.equal(results.filter(r=>r.allowed).length,2);
    assert.ok(results.find(r=>!r.allowed).retry_after>0);
    assert.equal((await reserve('user:a',10,2)).allowed,false,'daily limit');
    assert.equal((await reserve('user:b')).allowed,true);
    assert.equal((await reserve('user:b')).allowed,true);
    assert.equal((await reserve('user:c')).allowed,false,'global limit');
    assert.equal((await db.query("select used from public.ai_usage_buckets where bucket_key='global:day'")).rows[0].used,4,'denials do not increment usage');
    await db.exec('reset role');
    // Simulate an old bucket; the next day starts with fresh counters and prunes old ones.
    await db.exec("update public.ai_usage_buckets set window_start=window_start-interval '4 days'");
    assert.equal((await reserve('user:a')).allowed,true);
    assert.equal((await db.query('select count(*)::int as count from public.ai_usage_buckets')).rows[0].count,3);
    const uid='00000000-0000-0000-0000-000000000001';
    const uid2='00000000-0000-0000-0000-000000000002';
    await db.query(`insert into public.user_app_state values
      ($1,'intercession-vote:1200000','{"topicId":"healing"}',to_timestamp(700)),
      ($2,'intercession-vote:1200000','{"topicId":"healing"}',to_timestamp(1200)),
      ($1,'intercession-vote:600000','{"topicId":"nations"}',to_timestamp(500))`,[uid,uid2]);
    const admin={rpc:async(name,args)=>({data:(await db.query('select public.intercession_vote_summary($1,$2) as result',[args.session_start_ms,args.viewer_id])).rows[0].result})};
    const summary=await readPrayerVoteSummary(admin,uid,700000);
    assert.equal(summary.counts.healing,1,'late vote excluded');
    assert.equal(summary.currentTheme,'nations');
    assert.equal(summary.ownVote,'healing');
    assert.equal(summary.leadingTheme,'healing');
    assert.equal((await readPrayerVoteSummary(admin,null,700000)).ownVote,null);
  } finally {await db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createChurchCompetitionHandler } from '../lib/routes/church-competition.js';
import { addCompetitionGuest, advanceCompetition, castCompetitionVote, competitionRoundReady, competitionView, createCompetition, startCompetition } from '../src/shared/church-competition.js';
import { churchDefaultSettings, compileChurchScenario } from '../src/shared/church-scenario.js';
import { makeChurchScenario } from './fixtures/church-scenario.mjs';

const scenario = () => compileChurchScenario(makeChurchScenario(), { ...churchDefaultSettings, topic: 'Forgiveness' }, 'church-competition-test');
function add(room, id, random = () => 0) { addCompetitionGuest(room, { id, name: `Guest ${id}`, tokenHash: `secret-${id}` }, random); }
function memoryAdmin() {
  const rows = new Map();
  return { rows, from() {
    return {
      async insert(row) { rows.set(row.id, structuredClone(row)); return {}; },
      select() { return { eq(field, value) { return { async maybeSingle() { return { data: structuredClone([...rows.values()].find(r => r[field] === value) || null) }; } }; } }; },
      update(changes) {
        const filters = [];
        const query = { eq(field, value) { filters.push([field, value]); return query; }, select() { return query; }, async maybeSingle() {
          for (const row of rows.values()) {
            if (!filters.every(([field, value]) => field === 'course_content->>revision' ? String(row.course_content.revision) === value : row[field] === value)) continue;
            Object.assign(row, structuredClone(changes)); return { data: { id: row.id } };
          }
          return { data: null };
        } };
        return query;
      },
    };
  } };
}
function request(handler) {
  return async (action, data = {}, token = '') => {
    const method = action ? 'POST' : 'GET';
    const req = Readable.from(action ? [JSON.stringify({ ...data, action })] : []);
    Object.assign(req, { method, url: `/api/church/competition?room=${data.room || ''}`, headers: { authorization: token ? `Bearer ${token}` : '' }, socket: { remoteAddress: 'competition-test' } });
    const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
    try { await handler(req, res); } catch (error) { res.status = error.status || 500; res.body = { error: error.message }; }
    return res;
  };
}
function setup() {
  const admin = memoryAdmin();
  const call = request(createChurchCompetitionHandler({ getAdmin: () => admin, authenticate: async req => {
    if (req.headers.authorization !== 'Bearer account') throw Object.assign(new Error('Sign in'), { status: 401 });
  }, random: () => 0 }));
  return { admin, call };
}

test('team assignment is random on ties, balanced, and preserves names without markup', () => {
  const room = createCompetition(scenario());
  add(room, 'one', () => .9); assert.equal(room.participants[0].teamId, 'orange');
  add(room, 'two', () => .9); assert.equal(room.participants[1].teamId, 'blue');
  for (let i=0;i<28;i++) add(room, String(i), Math.random);
  assert.equal(room.participants.filter(p=>p.teamId==='blue').length,15);
  assert.throws(()=>addCompetitionGuest(room,{id:'x',name:'<script>'}),{status:400});
  assert.throws(()=>addCompetitionGuest(room,{id:'x',name:'guest one'}),{status:409});
});

test('zero-guest games can start and finish with organizer replies for both teams', async () => {
  const {admin,call}=setup();
  const created=await call('create',{scenario:scenario(),password:'secret123'},'account');
  const room=created.body.id,host=created.body.token;
  let current=await call('start',{room},host);
  assert.equal(current.status,200);assert.equal(current.body.status,'playing');
  assert.ok(current.body.teams.every(t=>t.expected===0));
  for(let round=1;round<=4;round++){
    const roundId=current.body.roundId;
    assert.equal((await call('next',{room,roundId},host)).status,409);
    for(const team of admin.rows.get(room).course_content.teams){
      const content=admin.rows.get(room).course_content;
      const choice=content.scenario.nodes[team.state.nodeId].choices.find(c=>c.quality==='solid').id;
      assert.equal((await call('choose',{room,roundId,teamId:team.id,choice})).status,401);
      const selected=await call('choose',{room,roundId,teamId:team.id,choice},host);
      assert.equal(selected.status,200);
      const view=selected.body.teams.find(t=>t.id===team.id);
      assert.equal(view.locked,true);assert.equal(view.voted,0);assert.equal(view.expected,0);
      assert.equal((await call('choose',{room,roundId,teamId:team.id,choice},host)).status,409);
    }
    const ready=await call(null,{room},host);assert.equal(ready.body.ready,true);
    assert.ok(ready.body.teams.every(t=>t.result));
    current=await call('next',{room,roundId},host);assert.equal(current.status,200);
    assert.equal((await call('choose',{room,roundId,teamId:'blue',choice:'A'},host)).status,409);
  }
  assert.equal(current.body.status,'finished');
  assert.ok(current.body.teams.every(t=>t.score.points===500));
  assert.equal(admin.rows.get(room).course_content.participants.length,0);
});

test('one guest can play while the organizer controls the empty team, and late guests vote next round', async () => {
  const {call}=setup();
  const created=await call('create',{scenario:scenario(),password:'secret123'},'account');
  const room=created.body.id,host=created.body.token;
  const guest=await call('join',{room,name:'Solo guest'});
  const started=await call('start',{room},host);assert.equal(started.status,200);
  const roundId=started.body.roundId,teamId=guest.body.viewer.teamId;
  const emptyTeam=started.body.teams.find(t=>t.id!==teamId).id;
  assert.equal((await call('choose',{room,roundId,teamId,choice:'B'},host)).status,409);
  assert.equal((await call('choose',{room,roundId,teamId:emptyTeam,choice:'B'},guest.body.token)).status,403);
  assert.equal((await call('choose',{room,roundId,teamId:emptyTeam,choice:'Z'},host)).status,400);
  assert.equal((await call('choose',{room,roundId,teamId:'missing',choice:'B'},host)).status,409);
  const late=await call('join',{room,name:'Late guest'});
  assert.equal((await call('vote',{room,roundId,choice:'B'},late.body.token)).status,409);
  assert.equal((await call('choose',{room,roundId,teamId:emptyTeam,choice:'B'},host)).status,200);
  assert.equal((await call('vote',{room,roundId,choice:'B'},guest.body.token)).status,200);
  const next=await call('next',{room,roundId},host);assert.equal(next.status,200);
  assert.equal((await call('choose',{room,roundId:next.body.roundId,teamId:emptyTeam,choice:'B'},host)).status,409);
  assert.equal((await call('vote',{room,roundId:next.body.roundId,choice:'B'},late.body.token)).status,200);
});

test('majorities automatically confirm, ties draw fairly, and results stay hidden until both teams finish', () => {
  const room = createCompetition(scenario());
  for(const id of ['one','two','three','four']) add(room,id);
  startCompetition(room,'round1');
  castCompetitionVote(room,'one','A','round1');
  assert.equal(room.teams[0].state.history.length,0);
  castCompetitionVote(room,'three','B','round1',()=>.99);
  assert.equal(room.teams[0].ballot.choice,'B'); assert.equal(room.teams[0].ballot.tied,true);
  const hidden=competitionView('room',room,{role:'guest',id:'two',teamId:'orange'});
  assert.equal(hidden.teams[0].result,null);assert.equal(hidden.teams[0].score.points,0);
  assert.equal(hidden.teams[0].scene.choices[0].votes,0);
  castCompetitionVote(room,'two','A','round1');castCompetitionVote(room,'four','A','round1');
  assert.equal(competitionRoundReady(room),true);
  const shown=competitionView('room',room,{role:'host'});
  assert.equal(shown.teams[0].result.choice,'B');assert.equal(shown.teams[0].score.points,200);
  assert.equal(shown.teams[1].result.choice,'A');
  castCompetitionVote(room,'one','A','round1'); // Idempotent retry of an accepted vote.
  assert.equal(room.teams[0].state.history.length,1);
  assert.throws(()=>castCompetitionVote(room,'one','C','round1'),{status:409});
});

test('late guests join next round, old votes cannot enter a new round, and the final review declares the highest score', () => {
  const room=createCompetition(scenario()); add(room,'one');add(room,'two');startCompetition(room,'r1');
  add(room,'late');assert.throws(()=>castCompetitionVote(room,'late','A','r1'),{status:409});
  for(let round=1;round<=8;round++){
    for(const team of room.teams){
      if(!team.ballot)continue;
      const choice=team.id==='blue'?room.scenario.nodes[team.state.nodeId].choices.find(c=>c.quality==='solid').id:room.scenario.nodes[team.state.nodeId].choices.find(c=>c.quality==='risky').id;
      for(const id of team.ballot.eligible) castCompetitionVote(room,id,choice,`r${round}`);
    }
    advanceCompetition(room,`r${round}`,`r${round+1}`);
    if(round===1){assert.ok(room.teams[0].ballot.eligible.includes('late'));assert.throws(()=>castCompetitionVote(room,'one','A','r1'),{status:409});}
  }
  assert.equal(room.status,'finished');
  const view=competitionView('room',room,{role:'host'});
  assert.deepEqual(view.winners,['blue']);assert.equal(view.teams[0].score.points,500);
  assert.equal(view.review[0].entries.length,4);assert.equal(view.review[1].entries.length,8);
  assert.throws(()=>add(room,'after'),{status:409});
});

test('API separates organizer and guest access, persists concurrent joins/votes and supports a second organizer device', async () => {
  const {admin,call}=setup();
  assert.equal((await call('create',{scenario:scenario(),password:'secret123'})).status,401);
  assert.equal((await call('create',{scenario:scenario(),password:'short'},'account')).status,400);
  const created=await call('create',{scenario:scenario(),password:'secret123'},'account');assert.equal(created.status,201);
  const {id:room,token:host}=created.body;
  const preview=await call(null,{room});assert.equal(preview.body.viewer,undefined);assert.equal(preview.body.teams,undefined);
  assert.equal((await call('start',{room})).status,401);
  const joins=await Promise.all(Array.from({length:6},(_,i)=>call('join',{room,name:`Person ${i}`})));
  assert.ok(joins.every(r=>r.status===200));
  const guests=joins.map(r=>({token:r.body.token,viewer:r.body.viewer}));
  assert.equal(admin.rows.get(room).course_content.participants.length,6);
  assert.equal((await call('start',{room},guests[0].token)).status,403);
  assert.equal((await call('admin-login',{room,password:'incorrect'})).status,401);
  const second=await call('admin-login',{room,password:'secret123'});assert.equal(second.status,200);
  assert.notEqual(second.body.token,host);assert.equal((await call(null,{room},host)).body.viewer.role,'host');
  const started=await call('start',{room},second.body.token);assert.equal(started.status,200);
  const roundId=started.body.roundId;
  for(const guest of guests){
    const refreshed=await call(null,{room},guest.token);
    assert.equal(refreshed.body.status,'playing');assert.equal(refreshed.body.roundId,roundId);
    const team=refreshed.body.teams.find(t=>t.id===guest.viewer.teamId);
    assert.equal(team.eligible,true);assert.equal(team.locked,false);
    assert.deepEqual(team.scene.choices.map(c=>c.id),['A','B','C','D']);
  }
  const voteResults=await Promise.all(guests.map(g=>call('vote',{room,roundId,choice:g.viewer.teamId==='blue'?'B':'A'},g.token)));
  assert.ok(voteResults.every(r=>r.status===200));
  const current=await call(null,{room},host);assert.equal(current.body.ready,true);
  assert.ok(current.body.teams.every(t=>t.voted===3));
  assert.ok(!JSON.stringify(current.body).includes('tokenHash'));assert.ok(!JSON.stringify(current.body).includes('hostTokens'));
  assert.ok(!JSON.stringify(current.body).includes('admin_password'));assert.ok(!JSON.stringify(current.body).includes(host));
  assert.equal((await call(null,{room},'a'.repeat(64))).status,401);
  const next=await call('next',{room,roundId},host);assert.equal(next.status,200);assert.notEqual(next.body.roundId,roundId);
  for(const guest of guests){
    const refreshed=await call(null,{room},guest.token);
    assert.equal(refreshed.body.status,'playing');assert.equal(refreshed.body.round,2);
    assert.equal(refreshed.body.roundId,next.body.roundId);
    assert.ok(refreshed.body.revision>started.body.revision);
    const team=refreshed.body.teams.find(t=>t.id===guest.viewer.teamId);
    assert.equal(team.locked,false);assert.equal(team.ownVote,null);assert.equal(team.eligible,true);
    assert.notEqual(team.scene.line,started.body.teams.find(t=>t.id===guest.viewer.teamId).scene.line);
  }
  assert.equal((await call('vote',{room,roundId,choice:'B'},guests[0].token)).status,409);
  admin.rows.get(room).course_content.expiresAt=0;
  assert.equal((await call(null,{room})).status,410);
  assert.equal((await call('join',{room,name:'Expired guest'})).status,410);
});

test('organizer can close a partial ballot but cannot invent a vote or advance early', async()=>{
  const {call}=setup();const c=await call('create',{scenario:scenario(),password:'secret123'},'account');const room=c.body.id,host=c.body.token;
  const joined=await Promise.all(['Nora','Paul','Tina','Yvan'].map(name=>call('join',{room,name})));
  const r=await call('start',{room},host),roundId=r.body.roundId;
  assert.equal((await call('close',{room,roundId,teamId:'blue'},host)).status,409);
  assert.equal((await call('next',{room,roundId},host)).status,409);
  const blue=joined.find(g=>g.body.viewer.teamId==='blue');
  assert.equal((await call('vote',{room,roundId,choice:'B'},blue.body.token)).status,200);
  const closed=await call('close',{room,roundId,teamId:'blue'},host);assert.equal(closed.status,200);assert.equal(closed.body.teams[0].locked,true);
});

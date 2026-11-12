import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createChurchCompetitionHandler } from '../lib/routes/church-competition.js';
import { addCompetitionGuest, advanceCompetition, castCompetitionVote, confirmCompetitionReply, competitionRoundReady, competitionView, createCompetition, normalizeCompetition, selectCompetitionReply, startCompetition, undoCompetition } from '../src/shared/church-competition.js';
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

const selectAndConfirm=(room,choice)=>{selectCompetitionReply(room,choice,room.roundId);confirmCompetitionReply(room,choice,room.roundId);};

test('teams remain randomly balanced; late guests can vote immediately on the open common question',()=>{
  const room=createCompetition(scenario());add(room,'one',()=>.9);add(room,'two',()=>.9);
  assert.deepEqual(room.participants.map(p=>p.teamId),['orange','blue']);
  startCompetition(room,'r1');add(room,'late');
  castCompetitionVote(room,'late','A','r1');
  assert.equal(room.teams.find(t=>t.id==='blue').ballot.votes.late,'A');
  assert.throws(()=>addCompetitionGuest(room,{id:'bad',name:'<script>'}),{status:400});
  assert.throws(()=>add(room,'one'),{status:409});
});
test('guest clicks update colored vote counts without confirming or changing the common conversation',()=>{
  const room=createCompetition(scenario());add(room,'one');add(room,'two');startCompetition(room,'r1');
  castCompetitionVote(room,'one','B','r1');castCompetitionVote(room,'two','A','r1');
  assert.equal(room.discussion.phase,'decision');assert.equal(room.discussion.history.length,0);
  assert.equal(competitionRoundReady(room),false);
  const host=competitionView('room',room,{role:'host'});
  const guest=competitionView('room',room,{role:'guest',id:'one',name:'Guest one',teamId:'blue'});
  assert.deepEqual(host.discussion,guest.discussion);
  assert.deepEqual(host.teams.map(t=>t.counts),guest.teams.map(t=>t.counts));
  assert.equal(host.teams[0].counts.B,1);assert.equal(host.teams[1].counts.A,1);
  assert.equal(guest.teams[0].ownVote,'B');
  castCompetitionVote(room,'one','C','r1');castCompetitionVote(room,'one','C','r1');
  const changed=competitionView('room',room,{role:'host'});
  assert.equal(changed.teams[0].counts.B,0);assert.equal(changed.teams[0].counts.C,1);assert.equal(changed.teams[0].voted,1);
  selectAndConfirm(room,'D'); // The organizer can choose a reply with no votes.
  assert.equal(room.discussion.phase,'reaction');assert.equal(room.discussion.history[0].choiceId,'D');
  assert.throws(()=>castCompetitionVote(room,'one','A','r1'),{status:409});
});
test('zero guests can finish a common conversation; confirmation and continuation are manual',()=>{
  const room=createCompetition(scenario());startCompetition(room,'r1');
  for(let round=1;round<=4;round++){
    const choice=room.scenario.nodes[room.discussion.nodeId].choices.find(c=>c.quality==='solid').id;
    assert.throws(()=>advanceCompetition(room,room.roundId,'next'),{status:409});
    selectCompetitionReply(room,choice,room.roundId);
    assert.equal(room.discussion.history.length,round-1);
    selectAndConfirm(room,choice);
    assert.equal(competitionRoundReady(room),true);
    advanceCompetition(room,room.roundId,`r${round+1}`);
  }
  assert.equal(room.status,'finished');
  const view=competitionView('room',room,{role:'host'});
  assert.equal(view.discussion.score.shelters,4);assert.equal(view.review.length,4);assert.equal(view.participants,undefined);
});
test('undo restores the common question, votes and journey; old requests cannot change the restored question',()=>{
  const room=createCompetition(scenario());add(room,'one');startCompetition(room,'r1');
  castCompetitionVote(room,'one','B','r1');selectAndConfirm(room,'B');
  advanceCompetition(room,'r1','r2');add(room,'late');castCompetitionVote(room,'late','A','r2');
  undoCompetition(room,'r2','restored');
  assert.equal(room.round,1);assert.equal(room.discussion.phase,'decision');assert.equal(room.discussion.history.length,0);
  assert.equal(room.discussion.selected,'B');assert.equal(room.teams[0].ballot.votes.one,'B');
  assert.equal(room.teams[1].ballot.votes.late,undefined);assert.ok(room.teams[1].ballot.eligible.includes('late'));
  assert.throws(()=>castCompetitionVote(room,'one','A','r1'),{status:409});
  assert.throws(()=>confirmCompetitionReply(room,'B','r2'),{status:409});
  assert.throws(()=>undoCompetition(room,'restored','again'),{status:409});
  selectAndConfirm(room,'A');undoCompetition(room,'restored','restored-again');assert.equal(room.discussion.history.length,0);
});
test('an existing invitation migrates without losing guests, dialogue or valid votes',()=>{
  const room=createCompetition(scenario());add(room,'one');startCompetition(room,'r1');castCompetitionVote(room,'one','B','r1');
  const state=structuredClone(room.discussion);
  delete room.mode;delete room.discussion;delete room.checkpoints;
  room.teams.forEach(t=>{t.state=structuredClone(state);t.previous=null;});
  normalizeCompetition(room);
  assert.deepEqual(room.discussion,state);assert.equal(room.participants.length,1);
  assert.equal(room.teams[0].ballot.votes.one,'B');assert.equal(room.legacyTeamStates.length,2);
  const once=structuredClone(room);normalizeCompetition(room);assert.deepEqual(room,once);
  selectAndConfirm(room,'B');
  const confirmed=structuredClone(room.discussion);
  delete room.mode;delete room.discussion;room.teams.forEach(t=>t.state=structuredClone(confirmed));
  normalizeCompetition(room);assert.equal(room.checkpoints.length,1);
  undoCompetition(room,'r1','restored');assert.equal(room.discussion.phase,'decision');assert.equal(room.discussion.history.length,0);
});
test('API syncs votes, organizer selection, confirmation, next and undo to every role and protects organizer controls',async()=>{
  const {call,admin}=setup();
  assert.equal((await call('create',{scenario:scenario(),password:'secret123'})).status,401);
  const created=await call('create',{scenario:scenario(),password:'secret123'},'account');assert.equal(created.status,201);
  const room=created.body.id,host=created.body.token;
  const publicView=await call(null,{room});assert.equal(publicView.body.discussion,undefined);assert.equal(publicView.body.teams,undefined);
  assert.equal((await call('start',{room})).status,401);
  const started=await call('start',{room},host);assert.equal(started.status,200);
  const roundId=started.body.roundId;
  const joined=await Promise.all(Array.from({length:6},(_,i)=>call('join',{room,name:`Person ${i}`})));
  assert.ok(joined.every(r=>r.status===200));
  const guests=joined.map(g=>({token:g.body.token,viewer:g.body.viewer}));
  const votes=await Promise.all(guests.map(g=>call('vote',{room,roundId,choice:g.viewer.teamId==='blue'?'B':'A'},g.token)));
  assert.ok(votes.every(r=>r.status===200));
  const live=await call(null,{room},host);assert.equal(live.body.ready,false);
  assert.equal(live.body.teams[0].counts.B,3);assert.equal(live.body.teams[1].counts.A,3);
  assert.equal(live.body.discussion.phase,'decision');
  for(const action of ['start','select','confirm','undo','next','present','debrief','conversation','dismiss','choose','close']){
    assert.equal((await call(action,{room,roundId,choice:'B',sideSlide:'conversation'},guests[0].token)).status,403);
  }
  assert.equal((await call('select',{room,roundId,choice:'B'},host)).status,200);
  const guestView=await call(null,{room},guests[0].token);assert.equal(guestView.body.discussion.selected,'B');
  assert.equal((await call('confirm',{room,roundId,choice:'C'},host)).status,409);
  const confirmed=await call('confirm',{room,roundId,choice:'B'},host);assert.equal(confirmed.status,200);
  assert.equal(confirmed.body.ready,true);assert.equal(confirmed.body.discussion.phase,'reaction');
  assert.ok(confirmed.body.discussion.journeyReveal.startedAt);
  assert.ok(confirmed.body.discussion.transcript.some(m=>m.role==='us'));
  assert.equal((await call('vote',{room,roundId,choice:'A'},guests[0].token)).status,409);
  const presented=await call('present',{room,sideSlide:'conversation'},host);assert.equal(presented.status,200);
  assert.equal((await call(null,{room},guests[1].token)).body.sideSlide,'conversation');
  assert.equal((await call('present',{room,sideSlide:'guests'},host)).status,200);
  assert.equal((await call(null,{room},guests[1].token)).body.sideSlide,'guests');
  assert.equal((await call('debrief',{room,roundId},host)).status,200);
  assert.equal((await call(null,{room},guests[0].token)).body.discussion.phase,'debrief');
  assert.equal((await call('conversation',{room,roundId},host)).body.discussion.phase,'reaction');
  const expanded=await call('present',{room,mountainExpanded:true},host);assert.equal(expanded.status,200);
  assert.ok(expanded.body.discussion.mountainBranches.nodes.length>0);
  assert.ok(!JSON.stringify(expanded.body.discussion.mountainBranches).includes('quality'));
  await call('present',{room,mountainExpanded:false},host);
  const next=await call('next',{room,roundId},host);assert.equal(next.status,200);assert.equal(next.body.round,2);
  assert.notEqual(next.body.roundId,roundId);assert.equal(next.body.discussion.selected,null);
  assert.ok(next.body.teams.every(t=>t.voted===0));
  const guestNext=await call(null,{room},guests[0].token);assert.deepEqual(guestNext.body.discussion,next.body.discussion);
  const undone=await call('undo',{room,roundId:next.body.roundId},host);assert.equal(undone.status,200);
  assert.equal(undone.body.round,1);assert.equal(undone.body.discussion.score.shelters,0);
  assert.equal(undone.body.teams[0].counts.B,3);assert.notEqual(undone.body.roundId,roundId);
  const guestUndo=await call(null,{room},guests[1].token);assert.deepEqual(guestUndo.body.discussion,undone.body.discussion);
  const serialized=JSON.stringify(guestUndo.body);
  for(const secret of ['tokenHash','hostTokens','legacyTeamStates','checkpoints','admin_password','completesRefuge','stage-2'])assert.ok(!serialized.includes(`"${secret}"`),secret);
  assert.ok(guestUndo.body.discussion.scene.choices.every(c=>c.quality===undefined&&c.next===undefined&&c.review===undefined));
  assert.ok(!serialized.includes(host));assert.ok(!serialized.includes('Which part of forgiveness'));
  assert.equal((await call(null,{room},'a'.repeat(64))).status,401);
  admin.rows.get(room).course_content.expiresAt=0;assert.equal((await call(null,{room})).status,410);
});

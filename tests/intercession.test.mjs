import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntercessionStore, getGlobalIntercessionSchedule, getIntercessionPhase, getPrayerFocus, formatIntercessionClock, formatIntercessionTime, formatPrayerDuration } from '../lib/prayer/intercession.js';
const memory = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}; };
test('preparation lasts 60 seconds, prayer lasts 10 minutes, and completion counts once', () => {
  let now=1000;const storage=memory(),s=createIntercessionStore(storage,()=>now);s.join();
  assert.equal(getIntercessionPhase(s.getSnapshot().session,now).phase,'prepare');
  now+=59_000;s.tick();assert.equal(getIntercessionPhase(s.getSnapshot().session,now).secondsLeft,1);assert.equal(s.getSnapshot().count,0);
  now+=1000;s.tick();assert.deepEqual(getIntercessionPhase(s.getSnapshot().session,now),{phase:'praying',secondsLeft:600});
  now+=599_000;s.tick();assert.equal(s.getSnapshot().count,0);now+=1000;s.tick();s.tick();assert.equal(s.getSnapshot().count,1);
  assert.equal(createIntercessionStore(storage,()=>now).getSnapshot().count,1);
  assert.equal(formatIntercessionTime(60),'01:00');assert.equal(formatIntercessionTime(600),'10:00');
});
test('refresh and a backgrounded timer preserve the session, topic and final count', () => {
  let now=1000;const storage=memory(),s=createIntercessionStore(storage,()=>now);s.vote('church');s.join();s.vote('healing');
  assert.equal(s.getSnapshot().session.topicId,'church');now+=120_000;
  const resumed=createIntercessionStore(storage,()=>now);assert.deepEqual(getIntercessionPhase(resumed.getSnapshot().session,now),{phase:'praying',secondsLeft:540});
  resumed.join();assert.equal(resumed.getSnapshot().session.startedAt,1000);
  now+=600_000;resumed.tick();assert.equal(resumed.getSnapshot().count,1);resumed.reset();resumed.join();assert.equal(resumed.getSnapshot().session.topicId,'healing');
});
test('changing a vote replaces the old choice and survives reopening', () => {
  const storage=memory(),s=createIntercessionStore(storage);s.vote('healing');s.vote('nations');s.vote('nations');
  assert.equal(createIntercessionStore(storage).getSnapshot().vote,'nations');s.vote('invalid');assert.equal(s.getSnapshot().vote,'nations');
});
test('malformed or unavailable storage does not break prayer', () => {
  const storage=memory();storage.setItem('intercession.local.v1',JSON.stringify({version:1,count:-1,session:{topicId:'invalid',startedAt:0}}));
  const s=createIntercessionStore(storage);assert.equal(s.getSnapshot().count,0);assert.equal(s.getSnapshot().session,null);
  const denied={getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}};let now=1000;const offline=createIntercessionStore(denied,()=>now);offline.join();now+=660_000;offline.tick();assert.equal(offline.getSnapshot().count,1);
});
test('the global rhythm rotates family prayer focuses every two minutes', () => {
  const first = getGlobalIntercessionSchedule(0);
  const next = getGlobalIntercessionSchedule(120_000);
  assert.equal(first.nextSessionSeconds, 600);
  assert.equal(first.nextTopicSeconds, 120);
  assert.notEqual(getPrayerFocus('families', first.familyTopicIndex).id, getPrayerFocus('families', next.familyTopicIndex).id);
});

test('global prayer keeps five focuses aligned with each ten-minute session', () => {
  for (let index = 0; index < 5; index++) {
    const schedule = getGlobalIntercessionSchedule(600_000 + index * 120_000);
    assert.equal(schedule.familyTopicIndex, index);
    assert.equal(schedule.nextTopicSeconds, 120);
    assert.equal(schedule.nextSessionSeconds, 600 - index * 120);
    assert.equal(schedule.topicProgress, 0);
  }
  assert.equal(getGlobalIntercessionSchedule(1_199_999).familyTopicIndex, 4);
  assert.equal(getGlobalIntercessionSchedule(1_200_000).familyTopicIndex, 0);
});

test('joining partway through a global session shares its end and survives a refresh', () => {
  let now = 850_000;
  const storage = memory();
  const store = createIntercessionStore(storage, () => now);
  store.joinGlobal();
  const joined = store.getSnapshot().session;
  assert.equal(joined.endsAt, 1_200_000);
  assert.deepEqual(getIntercessionPhase(joined, now), { phase: 'praying', secondsLeft: 350 });
  store.joinGlobal();
  assert.equal(store.getSnapshot().session.startedAt, 850_000);
  now = 970_000;
  const resumed = createIntercessionStore(storage, () => now);
  assert.deepEqual(getIntercessionPhase(resumed.getSnapshot().session, now), { phase: 'praying', secondsLeft: 230 });
  now = 1_200_000;
  resumed.tick(); resumed.tick();
  assert.equal(resumed.getSnapshot().count, 1);
  resumed.joinGlobal();
  assert.equal(resumed.getSnapshot().session.endsAt, 1_800_000);
  assert.equal(getIntercessionPhase(resumed.getSnapshot().session, now).secondsLeft, 600);
});

test('finishing a global prayer records its duration and total prayer time', () => {
  let now = 850_000;
  const store = createIntercessionStore(memory(), () => now);
  store.joinGlobal('healing');
  now += 125_000;
  const result = store.finishGlobal();
  assert.equal(result.durationSeconds, 125);
  assert.equal(store.getSnapshot().prayerSeconds, 125);
  assert.equal(store.getSnapshot().session.durationSeconds, 125);
  assert.equal(formatPrayerDuration(result.durationSeconds), '2 min 5s');
});


test('sessions start on the actual clock at :00, :10, :20, :30, :40, and :50', () => {
  for (const minute of [0, 10, 20, 30, 40, 50]) {
    const start = Date.parse(`2026-10-14T13:${String(minute).padStart(2, '0')}:00-04:00`);
    const schedule = getGlobalIntercessionSchedule(start);
    assert.equal(schedule.sessionStartsAt, start);
    assert.equal(schedule.sessionEndsAt, start + 600_000);
    assert.equal(schedule.nextSessionSeconds, 600);
    assert.equal(schedule.familyTopicIndex, 0);
  }
  const midway = getGlobalIntercessionSchedule(Date.parse('2026-10-14T13:07:25-04:00'));
  assert.equal(midway.sessionStartsAt, Date.parse('2026-10-14T13:00:00-04:00'));
  assert.equal(midway.sessionEndsAt, Date.parse('2026-10-14T13:10:00-04:00'));
  assert.equal(midway.nextSessionSeconds, 155);
  assert.equal(formatIntercessionClock(midway.sessionEndsAt, 'America/Toronto'), '1:10 PM');
});

test('clock-aligned sessions continue through midnight and daylight-saving changes', () => {
  const midnight = getGlobalIntercessionSchedule(Date.parse('2026-10-14T23:59:59-04:00'));
  assert.equal(midnight.sessionEndsAt, Date.parse('2026-10-15T00:00:00-04:00'));
  assert.equal(midnight.nextSessionSeconds, 1);
  for (const [before, next, displayed] of [
    ['2026-03-08T01:59:59-05:00', '2026-03-08T03:00:00-04:00', '3:00 AM'],
    ['2026-11-01T01:59:59-04:00', '2026-11-01T01:00:00-05:00', '1:00 AM'],
  ]) {
    const schedule = getGlobalIntercessionSchedule(Date.parse(before));
    assert.equal(schedule.sessionEndsAt, Date.parse(next));
    assert.equal(schedule.nextSessionSeconds, 1);
    assert.equal(formatIntercessionClock(schedule.sessionEndsAt, 'America/Toronto'), displayed);
  }
});

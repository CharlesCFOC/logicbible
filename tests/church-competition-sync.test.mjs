import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeCompetition } from '../src/react/church-competition-sync.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
test('live updates follow start, guest votes, next round and undo without reload, and wake on focus and reconnection', async () => {
  const events=new EventTarget(),visibility=new EventTarget(); visibility.hidden=false;
  const timers=new Map(),updates=[],errors=[];let id=0,revision=0,calls=0;
  const request=async()=>{calls++;return {revision:revision++,status:revision===1?'lobby':'playing'};};
  const stop=subscribeCompetition({room:'session',token:'guest',onRoom:r=>updates.push(r),onError:e=>errors.push(e)}, {
    request,events,visibility,schedule:(callback,ms)=>{const key=++id;timers.set(key,{callback,ms});return key;},cancel:key=>timers.delete(key),
  });
  await flush();assert.equal(updates[0].status,'lobby');
  for(let n=0;n<4;n++){const [key,timer]=timers.entries().next().value;timers.delete(key);assert.equal(timer.ms,1000);await timer.callback();}
  assert.deepEqual(updates.map(r=>r.revision),[0,1,2,3,4]);
  events.dispatchEvent(new Event('focus'));await flush();
  events.dispatchEvent(new Event('online'));await flush();
  visibility.dispatchEvent(new Event('visibilitychange'));await flush();
  assert.equal(calls,8);assert.equal(errors.length,0);
  stop();assert.equal(timers.size,0);
  events.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,8);
});
test('a failed refresh retries, simultaneous wake events do not overlap, and cleanup ignores in-flight responses',async()=>{
  const events=new EventTarget(),visibility=new EventTarget(),timers=new Map(),updates=[],errors=[];
  let resolveRequest,calls=0;
  const request=()=>{calls++;if(calls===1)return Promise.reject(new Error('Offline'));return new Promise(resolve=>{resolveRequest=resolve;});};
  const stop=subscribeCompetition({room:'session',token:'guest',onRoom:r=>updates.push(r),onError:e=>errors.push(e)}, {
    request,events,visibility,schedule:(callback,ms)=>{timers.set(callback,ms);return callback;},cancel:key=>timers.delete(key),
  });
  await flush();assert.equal(errors.length,1);assert.equal(timers.size,1);
  events.dispatchEvent(new Event('online'));events.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,2);
  resolveRequest({revision:2});await flush();assert.equal(updates.length,1);
  assert.equal([...timers.values()][0],0);
  events.dispatchEvent(new Event('focus'));await flush();assert.equal(calls,3);
  stop();resolveRequest({revision:3});await flush();assert.equal(updates.length,1);assert.equal(timers.size,0);
});

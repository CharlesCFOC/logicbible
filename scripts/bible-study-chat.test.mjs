import test from 'node:test';
import assert from 'node:assert/strict';
import { studyChatStorageKey,readStudyChats,saveStudyChats,studyChatTitle } from './bible-study-chat.js';

const scope={accountScope:'user-a',versionId:'kjv',bookId:'JHN',chapter:18,tabName:'historical',cardId:'card:0'};
test('discussion history is isolated by account, translation, chapter, tab and card',()=>{
  const key=studyChatStorageKey(scope);
  assert.ok(key.startsWith('thinkbible.localStudyChat.'));
  assert.ok(!key.startsWith('brother.')); // Generic app-state cloud hydration must not overwrite local chats.
  for(const change of [{accountScope:'user-b'},{versionId:'nlt'},{chapter:19},{tabName:'summary'},{cardId:'card:1'}])assert.notEqual(key,studyChatStorageKey({...scope,...change}));
});
test('a saved discussion retains complete messages, drafts and a useful history title',()=>{
  const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const messages=[{role:'user',text:'Why does Passover matter here?'},{role:'assistant',text:'It shapes the setting.\n\nJohn 18:28 mentions it.'}];
  const threads=[{id:'one',messages,draft:'And what about Pilate?',updatedAt:12,status:'ready'}];
  assert.equal(saveStudyChats(storage,'key',threads),true);
  const restored=readStudyChats(storage,'key');
  assert.deepEqual(restored[0].messages,messages);assert.equal(restored[0].draft,threads[0].draft);
  assert.equal(studyChatTitle(restored[0]),messages[0].text);
});
test('unfinished requests become retryable after reload, without duplicating the question',()=>{
  const thread={id:'pending',status:'pending',messages:[{role:'user',text:'A question'}]};
  const restored=readStudyChats({getItem:()=>JSON.stringify({threads:[thread]})},'key');
  assert.equal(restored[0].status,'interrupted');assert.equal(restored[0].messages.length,1);
});
test('storage errors and malformed history do not break Bible Study',()=>{
  assert.deepEqual(readStudyChats({getItem:()=>'{invalid'},'key'),[]);
  assert.deepEqual(readStudyChats(null,'key'),[]);
  assert.equal(saveStudyChats({setItem:()=>{throw new Error('Quota exceeded');}},'key',[]),false);
});

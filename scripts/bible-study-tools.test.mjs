import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { limitStudySections, parseStudyReference, selectStudyVerses, studySourceLinks, mergeStudyReflection, studyMapSvg } from './bible-study-tools.js';

const books = [{ id:'JHN', name:'John', chapters:21 }, { id:'1CO', name:'1 Corinthians', chapters:16 }];

test('an overlong AI response cannot flood a tab with cards from other study sections',()=>{
  const mixed={steps:[{},{},{},{}],cards:[{label:'Biblical context'},{label:'Historical context'},{label:'Summary',title:'Central point'},{label:'Veracity'},{label:'Manuscripts'}]};
  const summary=limitStudySections(mixed,'summary');
  assert.equal(summary.cards.length,1);assert.equal(summary.cards[0].title,'Central point');assert.equal(summary.steps.length,3);
  assert.equal(limitStudySections(mixed,'manuscripts').steps.length,0);
});

test('passage previews preserve disjoint verse ranges without including intervening verses', () => {
  const reference = parseStudyReference('John 18:31–33, 37–38', books, 'John');
  const verses = Array.from({length:40}, (_,index) => ({number:index+1,text:'Verse'}));
  assert.deepEqual(selectStudyVerses(verses,reference).map(verse=>verse.number),[31,32,33,37,38]);
});

test('references reject invalid chapters, reversed ranges and unknown books', () => {
  for(const reference of ['John 99:1','John 18:38-31','Unknown 1:1','John 18:0']) {
    assert.equal(parseStudyReference(reference,books,'John'),null);
  }
  assert.equal(parseStudyReference('1 Corinthians 13:4–7',books,'John').bookId,'1CO');
});

test('a full chapter reference previews all available verses', () => {
  const verses=[{number:1,text:'One'},{number:2,text:'Two'}];
  assert.deepEqual(selectStudyVerses(verses,parseStudyReference('John 18',books,'John')),verses);
});

test('unrecognized publications remain research leads, and generated URLs are never trusted', () => {
  const links=studySourceLinks({title:'Rylands Papyrus P52',sources:[null,{title:'Unverified publication',author:'Example',url:'javascript:alert(1)'}]});
  assert.equal(links[0].kind,'Manuscript record');
  assert.equal(links[1].kind,'Research lead · search');
  assert.ok(links.every(link=>link.url.startsWith('https://')));
});

test('editing a reflection preserves pre-existing notes and avoids duplicate reflection blocks', () => {
  const original={note:'Existing personal note',noteHtml:'<p>Existing personal note</p>'};
  const first=mergeStudyReflection(original,{tab:'summary',reference:'John 18',question:'What stands out?',answer:'First thought'});
  const updated=mergeStudyReflection(first,{tab:'summary',reference:'John 18',question:'What stands out?',answer:'Revised thought'});
  assert.ok(updated.note.startsWith(original.note));
  assert.ok(updated.noteHtml.startsWith(original.noteHtml));
  assert.ok(!updated.note.includes('First thought'));
  assert.equal(updated.note.match(/Reflection ·/g).length,1);
  const another=mergeStudyReflection(updated,{tab:'historical',reference:'John 18',question:'What context matters?',answer:'Another thought'});
  assert.ok(another.note.includes('Revised thought'));
  assert.ok(another.note.includes('Another thought'));
});

test('personal reflection text is escaped before inclusion in note HTML', () => {
  const result=mergeStudyReflection({},{tab:'summary',reference:'John 18',question:'Reflect',answer:'<img src=x onerror=alert(1)>'});
  assert.ok(!result.noteHtml.includes('<img'));
  assert.ok(result.noteHtml.includes('&lt;img'));
});

test('the Notes integration saves a reflection through the existing store without losing grouped notes', async () => {
  const script=await readFile(new URL('../script.js',import.meta.url),'utf8');
  const start=script.indexOf('async saveReflection({tab,question,answer})');
  const end=script.indexOf('\n      },',start);
  const original={key:'KJV.JHN.18.1',note:'Existing grouped note',noteHtml:'<p>Existing grouped note</p>',noteGroupId:'existing-group'};
  const savedState={notes:{first:{...original,key:'first'},second:{...original,key:'second'}}};
  let persisted,events=[];
  const context=vm.createContext({
    studyHelpersReady:Promise.resolve({mergeStudyReflection}),snapshot:{verses:[{key:'first'}]},result:{reference:'John 18'},savedState,
    writeJson:(key,value)=>{assert.equal(key,'brother.notes');persisted=JSON.parse(JSON.stringify(value));},refreshProfilePanel:()=>{},
    document:{dispatchEvent:event=>events.push(event.type)},CustomEvent:class { constructor(type){this.type=type;} },syncPendingState:async()=>{},console,
  });
  const handler=vm.runInContext(`({${script.slice(start,end)}\n}})`,context);
  await handler.saveReflection({tab:'summary',question:'What stands out?',answer:'A personal response'});
  for(const note of Object.values(persisted)) {
    assert.ok(note.note.startsWith('Existing grouped note'));
    assert.ok(note.note.includes('A personal response'));
    assert.equal(note.noteGroupId,'existing-group');
  }
  assert.ok(events.includes('home:library-data-change'));
});

test('the locally shipped chapter map has valid indices and finite geometry', async () => {
  const data=JSON.parse(await readFile(new URL('../assets/bible-study/geography.json',import.meta.url),'utf8'));
  for(const ids of Object.values(data.chapters)) assert.ok(ids.every(id=>data.places[id]));
  const places=data.chapters['JHN.18'].map(id=>data.places[id]);
  assert.ok(places.some(place=>place[0]==='Kidron Valley'));
  assert.ok(!/NaN|Infinity/.test(studyMapSvg(data,places)));
});

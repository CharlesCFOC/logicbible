import test from 'node:test';
import assert from 'node:assert/strict';
import {searchRememberedScripture,validateReferenceMatches} from '../lib/ai/bible-reference-search.js';
test('remembered quotation resolves to a navigable reference',async()=>{
 const result=await searchRememberedScripture('Ouvre le verset où Jésus pleura',async request=>{
  assert.match(request.input,/Jésus pleura/);
  assert.equal(request.jsonMode,true);
  return {text:JSON.stringify({certain:true,matches:[{bookId:'JHN',chapter:11,verse:35}]})};
 });
 assert.deepEqual(result,{certain:true,matches:[{bookId:'JHN',bookName:'John',chapter:11,verse:35}]});
});
test('ambiguous, unknown and invalid references do not force a navigation',()=>{
 const a={bookId:'JHN',chapter:11,verse:35},b={bookId:'LUK',chapter:19,verse:41};
 assert.equal(validateReferenceMatches({certain:true,matches:[a,b]}).certain,false);
 assert.deepEqual(validateReferenceMatches({certain:true,matches:[{...a,chapter:999},{...a,verse:-1},{...a,bookId:'FAKE'}]}),{matches:[],certain:false});
 assert.deepEqual(validateReferenceMatches({matches:[]}),{matches:[],certain:false});
 assert.equal(validateReferenceMatches({matches:[a,a]}).matches.length,1);
});
test('incomplete AI responses are not treated as matches',async()=>{
 await assert.rejects(searchRememberedScripture('un souvenir',async()=>({incomplete:true,text:'{}'})),/recherche/);
});

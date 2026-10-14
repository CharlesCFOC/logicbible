import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../script.js',import.meta.url),'utf8');
const apiCode=source.slice(0,source.indexOf('document.addEventListener'));
test('APK calls the hosted API for HTTPS, HTTP and Capacitor schemes; browser development remains local',()=>{
 for(const protocol of ['https:','http:','capacitor:']){
  const c=vm.createContext({window:{location:{hostname:'localhost',port:'',protocol}}});vm.runInContext(apiCode,c);
  assert.equal(c.apiUrl('/api/bible/quiz'),'https://logicbible.vercel.app/api/bible/quiz');
 }
 for(const location of [{hostname:'localhost',port:'4000',protocol:'http:'},{hostname:'logicbible.vercel.app',port:'',protocol:'https:'}]){
  const c=vm.createContext({window:{location}});vm.runInContext(apiCode,c);assert.equal(c.apiUrl('/api/bible/quiz'),'/api/bible/quiz');
 }
});
test('native bridge initialized after script loading still selects the hosted API',()=>{
 const c=vm.createContext({window:{location:{hostname:'custom-app-host',port:'',protocol:'https:'}}});vm.runInContext(apiCode,c);
 c.window.Capacitor={isNativePlatform:()=>true};assert.equal(c.apiUrl('/api/bible/quiz'),'https://logicbible.vercel.app/api/bible/quiz');
});
const c=vm.createContext({});vm.runInContext(source.slice(source.indexOf('async function readQuizResponse('),source.indexOf('window.bibleReaderBridge =')),c);
test('plain text 404 and HTML failure responses become a usable quiz error instead of a JSON parsing error',async()=>{
 for(const ok of [false,true])await assert.rejects(c.readQuizResponse({ok,json:async()=>{throw new SyntaxError('Unexpected token N');}}),/quiz service could not be reached/);
 await assert.rejects(c.readQuizResponse({ok:false,json:async()=>({error:'Provider unavailable'})}),/Provider unavailable/);
 const quiz={questions:[{question:'What happened?'}]};assert.equal(await c.readQuizResponse({ok:true,json:async()=>quiz}),quiz);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/core/api.js',import.meta.url),'utf8');
const apiCode=source;
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
const c=vm.createContext({});vm.runInContext(source,c);
test('plain text 404 and HTML failure responses become a usable quiz error instead of a JSON parsing error',async()=>{
 for(const ok of [false,true])await assert.rejects(c.readQuizResponse({ok,json:async()=>{throw new SyntaxError('Unexpected token N');}}),/quiz service could not be reached/);
 await assert.rejects(c.readQuizResponse({ok:false,json:async()=>({error:'Provider unavailable'})}),/Provider unavailable/);
 const quiz={questions:[{question:'What happened?'}]};assert.equal(await c.readQuizResponse({ok:true,json:async()=>quiz}),quiz);
});

test('AI transport attaches the current token, keeps abort and content headers, and refuses signed-out calls',async()=>{
 const requests=[];
 const context=vm.createContext({Headers,fetch:async(...args)=>{requests.push(args);return {ok:true};},supabaseClient:null});
 vm.runInContext(apiCode,context);
 await assert.rejects(context.aiFetch('/api/ai/chat'),/Sign in/);
 assert.equal(requests.length,0);
 context.supabaseClient={auth:{getSession:async()=>({data:{session:{access_token:'current-token'}}})}};
 const signal={};
 await context.aiFetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:'{}'});
 assert.equal(requests[0][1].headers.get('Authorization'),'Bearer current-token');
 assert.equal(requests[0][1].headers.get('Content-Type'),'application/json');
 assert.equal(requests[0][1].signal,signal);
});

test('Bible reader sends the chapter snapshot to the current quiz API with authentication', async () => {
 const { validateQuizSource } = await import('../lib/bible/chapter-quiz.js');
 const chapter = { reference: '1 John 5', version: 'KJV', verses: [{number: 1, text: 'Whosoever believeth that Jesus is the Christ is born of God.'}] };
 const signal = new AbortController().signal;
 const result = {questions: []};
 const requests = [];
 const context = vm.createContext({
  Headers,
  window: {location: {hostname: 'localhost', port: '4011'}},
  supabaseClient: {auth: {getSession: async () => ({data: {session: {access_token: 'test-token'}}})}},
  fetch: async (url, options) => {
   requests.push({url, options});
   return {ok: true, json: async () => result};
  },
 });
 vm.runInContext(apiCode, context);
 vm.runInContext(readFileSync(new URL('../scripts/bridges/bible-reader.js', import.meta.url), 'utf8'), context);
 context.installBibleReaderBridge();
 assert.equal(await context.window.bibleReaderBridge.createChapterQuiz(chapter, signal), result);
 assert.equal(requests.length, 1);
 const {url, options} = requests[0];
 assert.equal(url, '/api/ai/chapter-quiz');
 assert.equal(options.method, 'POST');
 assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
 assert.equal(options.signal, signal);
 assert.deepEqual(validateQuizSource(JSON.parse(options.body)), chapter);
});

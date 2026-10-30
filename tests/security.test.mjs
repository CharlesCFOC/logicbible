import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createStaticHandler } from '../lib/http/static-files.js';
import { authenticateAiRequest, authenticatedAiRoutes, reserveAiCall } from '../lib/ai/access.js';

function response() {
  return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, writeHead(status, headers={}) { this.status=status; Object.assign(this.headers,headers); }, end(body) { this.body=body; } };
}
test('static server exposes public assets only, including encoded paths and symlinks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bible-static-test-'));
  try {
    await mkdir(join(root, 'assets'));
    await mkdir(join(root, '.git'));
    await writeFile(join(root, '.env.local'), 'private');
    await writeFile(join(root, '.git/config'), 'private');
    await writeFile(join(root, 'index.html'), '<h1>public</h1>');
    await writeFile(join(root, 'assets/photo.webp'), 'image');
    await symlink(join(root, '.env.local'), join(root, 'assets/leak.js'));
    const serve = createStaticHandler(root);
    for (const url of ['/.env.local', '/%2eenv.local', '/.git/config', '/server.mjs', '/package.json', '/scripts/build-mobile.mjs', '/scripts/bible-study-chat.test.mjs', '/assets/../.env.local', '/assets/%2e%2e%2f.env.local', '/assets/leak.js', '/assets/%00.png']) {
      const res=response(); await serve({url,method:'GET'},res); assert.equal(res.status,404,url);
    }
    for (const url of ['/', '/assets/photo.webp']) {
      const res=response(); await serve({url,method:'GET'},res); assert.equal(res.status,200,url);
    }
    const head=response(); await serve({url:'/',method:'HEAD'},head); assert.equal(head.status,200); assert.equal(head.body,undefined);
    const post=response(); await serve({url:'/',method:'POST'},post); assert.equal(post.status,405);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('AI authentication verifies the token remotely and refuses missing or expired sessions',async()=>{
  let seen;
  const auth=()=>({getUser:async(token)=>{seen=token;return {data:{user:{id:'verified-user'}}};}});
  await assert.rejects(authenticateAiRequest({method:'POST',headers:{}},auth),{status:401});
  await assert.rejects(authenticateAiRequest({method:'GET',headers:{}},auth),{status:405});
  assert.equal(seen,undefined);
  assert.equal(await authenticateAiRequest({method:'POST',headers:{authorization:'Bearer valid'}},auth),'user:verified-user');
  assert.equal(seen,'valid');
  await assert.rejects(authenticateAiRequest({method:'POST',headers:{authorization:'Bearer expired'}},()=>({getUser:async()=>({error:{message:'expired'}})})),{status:401});
});

test('AI quota outages and denials fail closed',async()=>{
  for(const result of [{error:{}},{data:null},{data:{allowed:'true'}}]) {
    await assert.rejects(reserveAiCall({rpc:async()=>result},'user:test'),{status:503});
  }
  await assert.rejects(reserveAiCall({rpc:async()=>{throw new Error('offline');}},'user:test'),{status:503});
  await assert.rejects(reserveAiCall({rpc:async()=>({data:{allowed:false,retry_after:123}})},'user:test'),{status:429,retryAfter:123});
  await reserveAiCall({rpc:async()=>({data:{allowed:true}})},'user:test');
});

test('every protected HTTP route rejects anonymous callers before provider or database requests',async()=>{
  process.env.VERCEL='1';
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error('Unexpected network request');};
  try {
    const {default:handler}=await import('../server.mjs');
    for(const url of authenticatedAiRoutes){
      const req=Readable.from(['{}']); Object.assign(req,{url,method:'POST',headers:{},socket:{remoteAddress:'127.0.0.1'}});
      const res=response();await handler(req,res);assert.equal(res.status,401,url);
    }
    for(const url of ['/api/ai/chat-bypass','/api/ai/verse/extra','/api/bible/quiz-extra']){
      const req=Readable.from(['{}']);Object.assign(req,{url,method:'POST',headers:{},socket:{remoteAddress:'127.0.0.1'}});
      const res=response();await handler(req,res);assert.equal(res.status,404,url);
    }
  } finally {globalThis.fetch=originalFetch;}
});

test('authenticated HTTP chat reserves usage before contacting the provider and stops on denial or outage',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','OPENAI_API_KEY'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch;
  process.env.VERCEL='1';
  const {default:handler}=await import('../server.mjs');
  Object.assign(process.env,{SUPABASE_URL:'https://audit.supabase.co',SUPABASE_ANON_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'test',OPENAI_API_KEY:'test'});
  let quota={allowed:true}; const calls=[];
  globalThis.fetch=async(url,options)=>{
    const path=new URL(url).pathname;
    if(path==='/auth/v1/user')return Response.json({id:'00000000-0000-0000-0000-000000000001'});
    if(path==='/rest/v1/rpc/reserve_ai_call'){
      calls.push('quota'); assert.equal(JSON.parse(options.body).actor_key,'user:00000000-0000-0000-0000-000000000001');
      return quota===null ? Response.json({message:'missing migration'},{status:404}) : Response.json(quota);
    }
    if(path==='/v1/responses'){calls.push('provider');return Response.json({output_text:'Test answer',model:'mock'});}
    throw new Error('Unexpected network target');
  };
  try{
    for(const [value,status,expected] of [[{allowed:true},200,['quota','provider']],[{allowed:false,retry_after:120},429,['quota']],[null,503,['quota']]]){
      quota=value;calls.length=0;
      const req=Readable.from([JSON.stringify({prompt:'Hello'})]);
      Object.assign(req,{url:'/api/ai/chat',method:'POST',headers:{authorization:'Bearer test-token'},socket:{remoteAddress:'127.0.0.1'}});
      const res=response();await handler(req,res);
      assert.equal(res.status,status,String(res.body));assert.deepEqual(calls,expected);
      if(status===429)assert.equal(res.headers['Retry-After'],'120');
    }
  } finally{
    globalThis.fetch=originalFetch;
    for(const k of keys){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}
  }
});

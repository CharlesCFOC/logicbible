import test from 'node:test';
import assert from 'node:assert/strict';
import { competitionLink, competitionRequest, createSharedCompetition, readCompetitionAccess, saveCompetitionAccess } from '../src/react/church-competition-client.js';

function browser() {
  const originals = Object.fromEntries(['window','location','localStorage'].map(key=>[key,globalThis[key]]));
  const values=new Map();
  globalThis.window={};globalThis.location={origin:'https://example.test',hostname:'example.test',port:''};
  globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
  return ()=>{for(const [key,value]of Object.entries(originals))if(value===undefined)delete globalThis[key];else globalThis[key]=value;};
}
test('guest and organizer links always use the public Vercel origin, without credentials',()=>{
  const restore=browser();try{
    assert.equal(competitionLink('room'),'https://logicbible.vercel.app/evangelism-pilot.html?room=room');
    assert.equal(competitionLink('room',true),'https://logicbible.vercel.app/evangelism-pilot.html?room=room&admin=1');
    globalThis.location={origin:'http://localhost:4000',hostname:'localhost',port:'4000'};
    assert.equal(new URL(competitionLink('room')).origin,'https://logicbible.vercel.app');
    assert.equal(new URL(competitionLink('room',true)).origin,'https://logicbible.vercel.app');
    saveCompetitionAccess('room','host','secret');assert.equal(readCompetitionAccess('room','guest'),'');
    assert.equal(readCompetitionAccess('room','host'),'secret');
    globalThis.window.Capacitor={isNativePlatform:()=>true};
    assert.equal(new URL(competitionLink('room')).origin,'https://logicbible.vercel.app');
  }finally{restore();}
});
test('creation uses the signed-in account and stores only local organizer access',async()=>{
  const restore=browser();try{
    const calls=[];
    const fetcher=async(url,options)=>{calls.push([url,options]);return Response.json(url.endsWith('/config')?{configured:true,url:'https://project.supabase.co',anonKey:'public'}:{id:'room',token:'host-secret',revision:0});};
    const makeAuthClient=()=>({auth:{getSession:async()=>({data:{session:{access_token:'account-token'}}})}});
    const created=await createSharedCompetition({id:'scenario'},'password123',{fetcher,makeAuthClient});
    assert.equal(created.id,'room');assert.equal(calls[1][1].headers.Authorization,'Bearer account-token');
    assert.equal(JSON.parse(calls[1][1].body).password,'password123');assert.equal(readCompetitionAccess('room','host'),'host-secret');
    await assert.rejects(createSharedCompetition({},'password123',{fetcher,makeAuthClient:()=>({auth:{getSession:async()=>({data:{session:null}})}})}),/Sign in/);
  }finally{restore();}
});
test('guest votes carry their credential and round id; failures remain actionable',async()=>{
  const restore=browser();try{
    const abort=new AbortController();
    await competitionRequest({room:'room',action:'vote',token:'guest',choice:'B',roundId:'round1',signal:abort.signal},async(url,options)=>{
      assert.equal(url,'/api/church/competition');assert.equal(options.signal,abort.signal);assert.equal(options.headers.Authorization,'Bearer guest');
      assert.deepEqual(JSON.parse(options.body),{room:'room',action:'vote',choice:'B',roundId:'round1'});return Response.json({ready:false});
    });
    await assert.rejects(competitionRequest({room:'room'},async()=>Response.json({error:'The round has changed.'},{status:409})),{status:409,message:'The round has changed.'});
    await assert.rejects(competitionRequest({room:'room'},async()=>new Response('Unavailable',{status:503})),/connection/);
  }finally{restore();}
});

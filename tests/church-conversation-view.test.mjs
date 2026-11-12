import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createCompetition, addCompetitionGuest, startCompetition, castCompetitionVote, competitionView } from '../src/shared/church-competition.js';
import { compileChurchScenario, churchDefaultSettings } from '../src/shared/church-scenario.js';
import { makeChurchScenario } from './fixtures/church-scenario.mjs';

test('host and guest reuse the original discussion layout with exactly four reply cards and two vote badges per card', async()=>{
  const originalWindow=globalThis.window;
  globalThis.window={location:{search:''},matchMedia:()=>({matches:false})};
  const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  try {
    const {ChurchConversation}=await server.ssrLoadModule('/src/react/church-conversation.jsx');
    const room=createCompetition(compileChurchScenario(makeChurchScenario(),{...churchDefaultSettings,topic:'Forgiveness'},'view-test'));
    addCompetitionGuest(room,{id:'guest',name:'Blue guest'},()=>0);
    addCompetitionGuest(room,{id:'orange-guest',name:'Orange guest'},()=>0);
    startCompetition(room,'round');castCompetitionVote(room,'guest','B','round');
    const host=renderToStaticMarkup(React.createElement(ChurchConversation,{room:competitionView('room',room,{role:'host'}),busy:false,onAction:()=>{}}));
    const guest=renderToStaticMarkup(React.createElement(ChurchConversation,{room:competitionView('room',room,{role:'guest',id:'guest',name:'Guest',teamId:'blue'}),busy:false,onAction:()=>{}}));
    for(const html of [host,guest]){
      assert.equal((html.match(/class="pilot-choice-card"/g)||[]).length,4);
      assert.equal((html.match(/class="shared-vote-badge"/g)||[]).length,8);
      assert.match(html,/class="pilot-layout"/);assert.match(html,/class="pilot-conversation"/);
      assert.match(html,/aria-label="Discussion messages"/);assert.match(html,/Map of the journey to the summit/);
      assert.match(html,/Blue team: 1 votes/);assert.match(html,/Orange team: 0 votes/);
      assert.ok(!html.includes('competition-team-round'));
      assert.equal((html.match(/class="shared-guest-table"/g)||[]).length,1);
      assert.equal((html.match(/scope="col"/g)||[]).length,2);
      assert.match(html,/<td>Blue guest<\/td>/);assert.match(html,/<td>Orange guest<\/td>/);
      assert.match(html,/data-slide="guests"/);
      assert.match(html,/class="pilot-side-slide pilot-side-slide--guests"/);
      assert.ok(html.indexOf('class="shared-guest-table"')>html.indexOf('class="pilot-side-slide pilot-side-slide--guests"'));
    }
    assert.match(host,/Choose A, B, C or D/);assert.ok(!guest.includes('aria-label="Choose A, B, C or D"'));
    assert.match(guest,/Vote recorded: B/);assert.match(guest,/Your vote/);
    globalThis.window.matchMedia=()=>({matches:true});
    const mobile=renderToStaticMarkup(React.createElement(ChurchConversation,{room:competitionView('room',room,{role:'guest',id:'guest',name:'Guest',teamId:'blue'}),busy:false,onAction:()=>{}}));
    assert.match(mobile,/pilot-stage--mobile/);assert.ok(!mobile.includes('data-slide="guests"'));
    assert.equal((mobile.match(/class="shared-guest-table"/g)||[]).length,1);
    assert.ok(mobile.indexOf('class="shared-guest-table"')<mobile.indexOf('class="pilot-side-panel'));
  } finally {await server.close();if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});

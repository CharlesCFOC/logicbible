import test from 'node:test';
import assert from 'node:assert/strict';
import { discussionRefuges, refugeProgress, refugeNextScene, validateRefugeScenario } from '../src/shared/discussion-refuges.js';
import { evangelismPilot } from '../src/shared/evangelism-pilot.js';

test('the pilot declares valid refuge objectives independently of its emotions', () => {
  assert.deepEqual(validateRefugeScenario(evangelismPilot), []);
});

test('the same objective engine accepts a different topic and unrelated scene names', () => {
  const scenario = {
    completionNode: 'finished-reading',
    refuges: discussionRefuges.map(refuge => ({ ...refuge, entry: `text-${refuge.id}` })),
    nodes: Object.fromEntries(discussionRefuges.map(refuge => [`text-${refuge.id}`, {
      stage: refuge.id,
      choices: [
        { id: 'D', quality: 'solid', completesRefuge: refuge.id, next: refuge.id === 4 ? 'finished-reading' : `text-${refuge.id + 1}` },
        { id: 'A', quality: 'mixed', next: `text-${refuge.id}` },
      ],
    }])),
  };
  assert.deepEqual(validateRefugeScenario(scenario), []);
  const history = [];
  for (let stage = 1; stage <= 4; stage++) {
    const entry = { nodeId: `text-${stage}`, choiceId: 'D' };
    history.push(entry);
    assert.equal(refugeNextScene(scenario, entry, history), stage === 4 ? 'finished-reading' : `text-${stage + 1}`);
    assert.equal(refugeProgress(scenario, history).completed.length, stage);
  }
  const skipped = [{ nodeId: 'text-4', choiceId: 'D' }];
  assert.equal(refugeNextScene(scenario, skipped[0], skipped), 'text-1', 'a final invitation cannot skip the earlier objectives');
  scenario.nodes['text-2'].choices[0].completesRefuge = 3;
  assert.ok(validateRefugeScenario(scenario).some(error => error.includes('Invalid objective')));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretVoiceAssistant, findKidsVoiceStory } from '../lib/ai/voice-assistant.js';

const answer = value => async () => ({ text: JSON.stringify(value), incomplete: false });

test('voice assistant accepts only known navigation destinations', async () => {
  assert.deepEqual(await interpretVoiceAssistant('ouvre Debate Room', answer({ type: 'navigate', screen: 'apologetics-debate' })), { type: 'navigate', screen: 'apologetics-debate' });
  assert.deepEqual(await interpretVoiceAssistant('ouvre quelque chose', answer({ type: 'navigate', screen: 'admin' })), { type: 'unsupported' });
});

test('voice assistant preserves question, reference and unsupported classifications', async () => {
  for (const type of ['question', 'reference', 'kids_story', 'unsupported']) {
    assert.deepEqual(await interpretVoiceAssistant('ma demande', answer({ type })), { type });
  }
  await assert.rejects(interpretVoiceAssistant('test', async () => ({ text: '{}', incomplete: true })), error => error.status === 502);
});

test('Kids Bible story search accepts catalogue IDs and preserves ambiguity', async () => {
  const found = await findKidsVoiceStory('la création', answer({ certain: true, ids: ['genesis-creation'] }));
  assert.equal(found.certain, true);
  assert.equal(found.matches[0].title, 'God Creates the World');
  const choices = await findKidsVoiceStory('la création', answer({ certain: true, ids: ['genesis-creation', 'genesis-humanity', 'not-a-story'] }));
  assert.equal(choices.certain, false);
  assert.equal(choices.matches.length, 2);
  assert.deepEqual(await findKidsVoiceStory('histoire absente', answer({ certain: true, ids: ['not-a-story'] })), { certain: false, matches: [] });
});

test('voice assistant validates prayer drafts and never executes generated actions', async () => {
  assert.deepEqual(await interpretVoiceAssistant('Écris une prière pour ma famille', answer({ type: 'prayer', title: ' Ma famille ', text: ' Merci pour ma famille. ', category: 'family' })), { type: 'prayer', title: 'Ma famille', text: 'Merci pour ma famille.', category: 'family' });
  assert.deepEqual(await interpretVoiceAssistant('Une prière', answer({ type: 'prayer', title: '', text: 'Texte', category: 'family' })), { type: 'unsupported' });
  assert.equal((await interpretVoiceAssistant('Une prière', answer({ type: 'prayer', title: 'Prière', text: 'Texte', category: 'invalid' }))).category, 'general');
});

test('classification instructions identify remembered verses and prayer requests', async () => {
  await interpretVoiceAssistant('Quel verset dit Jésus pleura ?', async ({ instructions }) => {
    assert.match(instructions, /quel verset dit Jésus pleura/);
    assert.match(instructions, /Use prayer/);
    return { text: '{"type":"reference"}', incomplete: false };
  });
});

test('both voice assistant requests explicitly identify JSON in the input', async () => {
  const respond = async ({ input, jsonMode }) => {
    assert.equal(jsonMode, true);
    assert.equal(JSON.parse(input).responseFormat, 'json');
    return { text: '{"type":"reference","ids":[]}', incomplete: false };
  };
  await interpretVoiceAssistant('Which scripture says Jesus wept?', respond);
  await findKidsVoiceStory('the story of creation', respond);
});

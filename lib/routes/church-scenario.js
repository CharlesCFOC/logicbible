import { readJsonBody, sendJson } from '../http/json.js';
import { openAiResponse } from '../ai/provider.js';
import { generateChurchScenario } from '../ai/church-scenario.js';

export async function handleChurchScenario(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Utilisez POST pour créer un scénario.' });
    return;
  }
  sendJson(res, 200, await generateChurchScenario(await readJsonBody(req), openAiResponse));
}

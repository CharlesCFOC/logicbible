import { readJsonBody } from '../http/json.js';
import { generateReadAloud } from '../ai/read-aloud.js';

export async function handleReadAloud(req, res) {
  const controller = new AbortController();
  const cancel = () => { if (!res.writableEnded) controller.abort(); };
  res.on('close', cancel);
  try {
    const audio = await generateReadAloud(await readJsonBody(req, 24_000), { signal: controller.signal });
    if (controller.signal.aborted) return;
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'Content-Length': audio.length });
    res.end(audio);
  } finally { res.off('close', cancel); }
}

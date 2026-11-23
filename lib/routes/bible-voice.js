import { readJsonBody, sendJson } from "../http/json.js";
import { transcribeBibleAudio } from "../ai/transcription.js";

const maxAudioBytes = 5_000_000;

export async function handleBibleVoiceTranscription(req, res) {
  if (req.method !== "POST") throw Object.assign(new Error("Use POST for voice transcription."), { status: 405 });
  const body = await readJsonBody(req, 7_000_000);
  const audioBase64 = String(body.audioBase64 || "");
  const mimeType = String(body.mimeType || "");
  if (!audioBase64 || audioBase64.length > Math.ceil(maxAudioBytes * 4 / 3) + 8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(audioBase64)) {
    throw Object.assign(new Error("The voice recording is empty or too large."), { status: 400 });
  }
  const audio = Buffer.from(audioBase64, "base64");
  if (!audio.length || audio.length > maxAudioBytes) {
    throw Object.assign(new Error("The voice recording is empty or too large."), { status: 413 });
  }
  const text = await transcribeBibleAudio(audio, mimeType);
  sendJson(res, 200, { text });
}

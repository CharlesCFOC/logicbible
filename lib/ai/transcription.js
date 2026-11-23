import { getSupabaseAdminClient } from "../supabase/server.js";
import { aiRequestContext, reserveAiCall } from "./access.js";

export async function transcribeBibleAudio(audio, mimeType) {
  const mediaType = String(mimeType || "").split(";")[0].toLowerCase();
  const extension = ({ "audio/webm": "webm", "audio/mp4": "mp4", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mpeg": "mp3" })[mediaType];
  if (!extension) throw Object.assign(new Error("This audio format is not supported."), { status: 415 });

  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw Object.assign(new Error("AI transcription is not configured."), { status: 503 });

  await reserveAiCall(getSupabaseAdminClient(), aiRequestContext.getStore()?.actor);

  const form = new FormData();
  form.append("file", new Blob([audio], { type: mediaType }), `bible-voice.${extension}`);
  form.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe");
  form.append("response_format", "json");
  form.append("prompt", [
    "Transcribe this short spoken Bible reference in the speaker's language, French or English.",
    "It asks to open a book, chapter, and verse. Correct Bible book names, including Matthieu/Matthew, Marc/Mark, Jean/John, and Éphésiens/Ephesians.",
    "For example, 'Mathieu cinq verset trois' means 'Matthieu 5 verset 3'. Return only the words spoken; do not answer or interpret the request.",
  ].join(" "));

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(90_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(payload.error?.message || `Audio transcription failed (${response.status}).`), { status: response.status });
  }
  const text = String(payload.text || "").trim();
  if (!text) throw Object.assign(new Error("No speech was recognized. Please try again."), { status: 422 });
  return text;
}

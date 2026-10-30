import { getSupabaseAdminClient } from "../supabase/server.js";
import { aiRequestContext, reserveAiCall } from "./access.js";


function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || "";
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6-sol";
}

function extractOpenAiText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  const content = payload.output
    ?.flatMap((item) => item.content || [])
    ?.map((item) => item.text || item.output_text || "")
    ?.filter(Boolean)
    ?.join("\n")
    ?.trim();

  return content || "No response text returned.";
}

export async function openAiResponse({ instructions, input, maxOutputTokens = 700, jsonMode = false }) {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    const error = new Error("Missing OPENAI_API_KEY in .env.local");
    error.status = 401;
    throw error;
  }

  await reserveAiCall(getSupabaseAdminClient(), aiRequestContext.getStore()?.actor);
  const response = await fetch("https://api.openai.com/v1/responses", {
    signal: AbortSignal.timeout(90_000),
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      ...(jsonMode ? { text: { format: { type: "json_object" } } } : {}),
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error?.message || `OpenAI returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return {
    text: extractOpenAiText(payload),
    model: payload.model || getOpenAiModel(),
    incomplete: payload.status === 'incomplete',
  };
}

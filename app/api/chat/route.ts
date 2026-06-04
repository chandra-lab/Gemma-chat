import {
  convertToModelMessages,
  streamText,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { AUDIO_ENABLED, getModel, IS_GEMMA_ON_GOOGLE, SYSTEM_PROMPT } from "@/lib/model";

// Models can take a while on the first token; give the route room.
export const maxDuration = 120;

/**
 * When audio is disabled (or unsupported by the backend), drop audio
 * attachments before they reach the model so text + images still work.
 */
function stripAudioIfNeeded(messages: UIMessage[]): UIMessage[] {
  if (AUDIO_ENABLED) return messages;

  return messages.map((message) => {
    if (message.role !== "user" || !Array.isArray(message.parts)) return message;

    let removed = false;
    const parts = message.parts.filter((part) => {
      const isAudio =
        part.type === "file" &&
        typeof part.mediaType === "string" &&
        part.mediaType.startsWith("audio/");
      if (isAudio) removed = true;
      return !isAudio;
    });

    if (removed) {
      parts.push({
        type: "text",
        text: "(An audio attachment was omitted because audio input is disabled.)",
      });
    }
    return { ...message, parts };
  });
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = convertToModelMessages(stripAudioIfNeeded(messages));

  // Gemma on Google's API rejects a `system` instruction, so prime the
  // conversation with the system prompt as the first turn instead.
  const result = IS_GEMMA_ON_GOOGLE
    ? streamText({
        model: getModel(),
        messages: [
          { role: "user", content: SYSTEM_PROMPT },
          { role: "assistant", content: "Understood." },
          ...modelMessages,
        ] satisfies ModelMessage[],
      })
    : streamText({
        model: getModel(),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
      });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("[/api/chat] error:", error);
      const message = error instanceof Error ? error.message : String(error);

      if (/api key|API_KEY|permission|unauthor|401|403/i.test(message)) {
        return "The Google API key is missing or invalid. Set GOOGLE_GENERATIVE_AI_API_KEY (a Codespaces secret or .env.local).";
      }
      if (/429|quota|rate.?limit|resource.?exhausted/i.test(message)) {
        return "Hit the Google API free-tier rate limit. Wait a moment and try again.";
      }
      if (/audio|unsupported|media|modal/i.test(message)) {
        return "This backend couldn't process that attachment (audio isn't supported here). Try text or an image.";
      }
      if (/fetch|ECONNREFUSED|network|connect/i.test(message)) {
        return "Couldn't reach the model. If running locally, make sure Ollama is running and the model is pulled.";
      }
      return "Sorry, something went wrong generating a response. Check the server logs for details.";
    },
  });
}

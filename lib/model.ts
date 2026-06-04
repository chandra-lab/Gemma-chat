import { createOllama } from "ollama-ai-provider-v2";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Two backends, chosen by MODEL_PROVIDER:
 * - "ollama" (default): local Gemma 4 E2B via Ollama. Great for dev; supports
 *   text + image (+ experimental audio).
 * - "google": Google's free hosted API (e.g. gemma-4-31b-it). No GPU needed,
 *   so it's ideal for Codespaces. Text + image only (hosted Gemma has no audio).
 */
const PROVIDER = (process.env.MODEL_PROVIDER ?? "ollama") as "ollama" | "google";

export const MODEL_NAME =
  process.env.MODEL_NAME ?? (PROVIDER === "google" ? "gemma-4-31b-it" : "gemma4:e2b");

/**
 * Gemma served on Google's Gemini API rejects a `system` instruction
 * (HTTP 400 "Developer instruction is not enabled"). When true, the route
 * injects the system prompt as the first conversation turn instead.
 */
export const IS_GEMMA_ON_GOOGLE = PROVIDER === "google" && MODEL_NAME.startsWith("gemma");

/**
 * Audio input is best-effort and only works on the local Ollama edge models.
 * Hosted Gemma (Google) has no audio, so audio is always disabled there.
 */
export const AUDIO_ENABLED =
  PROVIDER === "ollama" && (process.env.ENABLE_AUDIO ?? "true") !== "false";

export function getModel() {
  if (PROVIDER === "google") {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google(MODEL_NAME);
  }

  // Use 127.0.0.1 (not "localhost"): on Windows, Node's fetch may resolve
  // "localhost" to IPv6 ::1 while Ollama listens on IPv4 127.0.0.1.
  const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api",
  });
  return ollama(MODEL_NAME);
}

export const SYSTEM_PROMPT = [
  "You are Gemma, a helpful, friendly, and concise AI assistant.",
  "Answer clearly and use Markdown for formatting.",
  "Use fenced code blocks with a language tag for any code.",
  "When the user shares an image or audio, use it to inform your answer.",
].join(" ");

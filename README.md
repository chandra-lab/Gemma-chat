# Gemma Chat

A ChatGPT / Claude-style streaming chat web app for **Gemma 4**, built with Next.js
(App Router), React, TypeScript, Tailwind CSS, and the Vercel AI SDK. It runs two ways
from the same codebase:

- **Local** via **Ollama** (`gemma4:e2b`, edge size) — private, offline, supports
  text + image (+ experimental audio).
- **Cloud** via **Google's free hosted API** (`gemma-4-31b-it`) — no GPU, perfect for
  **GitHub Codespaces** + a public URL to share with friends (text + image).

Which backend is used is controlled by the `MODEL_PROVIDER` env var.

![stack](https://img.shields.io/badge/Next.js-15-black) ![model](https://img.shields.io/badge/Gemma_4-31B%20%2F%20E2B-7c3aed) ![sdk](https://img.shields.io/badge/AI_SDK-v5-success)

## Features

- Streaming responses with a clean, ChatGPT-like UI (light/dark)
- Markdown + syntax-highlighted code blocks
- Image attachments (attach a photo and ask about it)
- Audio attachments / mic recording (local Ollama only; experimental)
- Stop / regenerate, suggested prompts, auto-scroll
- One codebase, two backends (local Ollama or hosted Google)

---

## Option A — Run in GitHub Codespaces with Google's API (easiest to share)

Inference runs on Google's free hosted API, so the Codespace only needs Node. No GPU,
nothing to install locally. Great for sharing a URL with friends.

1. **Push this project to a GitHub repo** (Codespaces opens from a repo). Easiest:
   VS Code "Publish to GitHub", GitHub Desktop, or `gh repo create`.
2. **Get a free API key** at [aistudio.google.com](https://aistudio.google.com).
3. **Add it as a Codespaces secret** (so it's never committed):
   GitHub repo → **Settings** → **Secrets and variables** → **Codespaces** →
   **New repository secret** → name `GOOGLE_GENERATIVE_AI_API_KEY`, value = your key.
4. **Open the repo in a Codespace**: green **Code** button → **Codespaces** →
   **Create codespace on main**. Wait for it to build (`npm install` runs automatically).
5. **Start the app** in the Codespace terminal:
   ```bash
   npm run dev
   ```
6. **Make it public & share**: open the **Ports** tab, right-click port **3000** →
   **Port Visibility** → **Public**, then copy the `https://<name>-3000.app.github.dev`
   URL and send it to friends. (Or run `gh codespace ports visibility 3000:public`.)

The Codespace sets `MODEL_PROVIDER=google`, `MODEL_NAME=gemma-4-31b-it`, and
`NEXT_PUBLIC_ENABLE_AUDIO=false` automatically (see
[.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)).

**Notes**
- The free Gemini API tier has rate limits (per minute / per day) — fine for a few
  friends, may throttle under heavy use.
- The Codespace must be running for the shared URL to work; it auto-stops when idle.
- Hosted Gemma supports text + image only (no audio), so the mic is hidden in this mode.

---

## Option B — Run locally with Ollama

### 1. Prerequisites
- [Node.js](https://nodejs.org/) 18.18+ (20+ recommended)
- [Ollama](https://ollama.com/download) installed and running

### 2. Pull the model
```bash
ollama pull gemma4:e2b
```
Make sure Ollama is running (desktop app or `ollama serve`); it listens on
`http://127.0.0.1:11434`.

> Tip: want more quality and have the RAM? Pull `gemma4:e4b` and set
> `MODEL_NAME=gemma4:e4b`.

### 3. Install and run
```bash
npm install
npm run dev          # MODEL_PROVIDER defaults to "ollama"
```
Open http://localhost:3000 and start chatting.

### 4. (Optional) Share your local instance with a free tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```
Share the printed `*.trycloudflare.com` URL. Your PC must stay on; the URL changes on
each restart.

---

## Configuration

Set in `.env.local` (copy from [.env.local.example](.env.local.example)) or via env vars.

| Variable                        | Used when            | Purpose                                                        |
| ------------------------------- | -------------------- | -------------------------------------------------------------- |
| `MODEL_PROVIDER`                | always               | `ollama` (default) or `google`                                 |
| `MODEL_NAME`                    | always               | `gemma4:e2b` (ollama) / `gemma-4-31b-it` (google)              |
| `OLLAMA_BASE_URL`               | provider=ollama      | Ollama API URL (default `http://127.0.0.1:11434/api`)         |
| `ENABLE_AUDIO`                  | provider=ollama      | `false` strips audio attachments                               |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | provider=google      | Your Google AI Studio key (use a Codespaces secret)            |
| `NEXT_PUBLIC_ENABLE_AUDIO`      | client UI            | `false` hides the mic button (set automatically in Codespaces) |

## Multimodal notes
- **Images**: supported on both backends. Attach via the paperclip.
- **Audio**: local Ollama edge models only (experimental). Hosted Gemma has no audio,
  so it's auto-disabled when `MODEL_PROVIDER=google`. (Want cloud audio? Switch
  `MODEL_NAME` to a Gemini model like `gemini-2.5-flash`.)

## Project structure
```
.devcontainer/
  devcontainer.json   # Codespaces: Node, port 3000, google provider env
app/
  api/chat/route.ts   # streaming endpoint; Gemma-on-Google system-prompt handling
  layout.tsx          # root layout, theme bootstrap, hljs theme
  page.tsx            # chat page (useChat) + header + empty state
  globals.css         # Tailwind + dark mode
components/
  Composer.tsx        # input, attachments, mic recording
  ChatMessages.tsx    # message list, auto-scroll, typing indicator
  MessageBubble.tsx   # renders text/image/audio parts
  Markdown.tsx        # markdown + code highlighting
lib/
  model.ts            # provider switch (ollama/google) + system prompt
```

## Tech
Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Vercel AI SDK v5
(`ai`, `@ai-sdk/react`) · `@ai-sdk/google` · `ollama-ai-provider-v2` · react-markdown ·
rehype-highlight

"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { ChatMessages } from "@/components/ChatMessages";
import { Composer } from "@/components/Composer";

const SUGGESTIONS = [
  "Explain quantum entanglement like I'm 12",
  "Write a Python script to rename files by date",
  "Give me a 3-day Tokyo itinerary",
  "Describe what's in this image (then attach one)",
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label="Toggle theme"
      title="Toggle light/dark"
    >
      <span suppressHydrationWarning>{mounted ? (dark ? "☀️" : "🌙") : null}</span>
    </button>
  );
}

export default function Page() {
  const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const audioEnabled = process.env.NEXT_PUBLIC_ENABLE_AUDIO !== "false";
  const isEmpty = messages.length === 0;

  function handleSend(text: string, files: FileUIPart[]) {
    sendMessage({ text, files: files.length ? files : undefined });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
            G
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Gemma Chat</h1>
            <p className="text-[11px] text-neutral-500">Gemma 4 E2B · local via Ollama</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              New chat
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
              G
            </div>
            <h2 className="mb-1 text-2xl font-semibold">How can I help today?</h2>
            <p className="mb-8 text-sm text-neutral-500">
              Ask anything, or attach an image{audioEnabled ? " or audio clip" : ""}.
            </p>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage({ text: s })}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-neutral-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-indigo-700 dark:hover:bg-neutral-800"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} status={status} />
        )}

        {error && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/40 dark:text-red-200">
              <span>Something went wrong. Is Ollama running?</span>
              <button
                onClick={() => regenerate()}
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </main>

      <Composer onSend={handleSend} onStop={stop} status={status} audioEnabled={audioEnabled} />
    </div>
  );
}

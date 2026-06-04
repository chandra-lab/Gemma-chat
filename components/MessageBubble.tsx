"use client";

import type { UIMessage } from "ai";
import { Markdown } from "./Markdown";

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
          G
        </div>
      )}

      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-white"
            : "max-w-[85%] text-neutral-900 dark:text-neutral-100"
        }
      >
        <div className="space-y-2">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              if (!part.text) return null;
              return isUser ? (
                <p key={index} className="whitespace-pre-wrap break-words leading-relaxed">
                  {part.text}
                </p>
              ) : (
                <Markdown key={index}>{part.text}</Markdown>
              );
            }

            if (part.type === "file" && part.mediaType?.startsWith("image/")) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={part.url}
                  alt={part.filename ?? "attached image"}
                  className="max-h-72 rounded-lg border border-black/10 object-contain dark:border-white/10"
                />
              );
            }

            if (part.type === "file" && part.mediaType?.startsWith("audio/")) {
              return <audio key={index} controls src={part.url} className="w-64 max-w-full" />;
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

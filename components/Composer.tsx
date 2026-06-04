"use client";

import { useRef, useState } from "react";
import type { FileUIPart } from "ai";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";
type Attachment = FileUIPart & { id: string };

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file keeps local inference responsive.

function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function Composer({
  onSend,
  onStop,
  status,
  audioEnabled,
}: {
  onSend: (text: string, files: FileUIPart[]) => void;
  onStop: () => void;
  status: ChatStatus;
  audioEnabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isBusy = status === "submitted" || status === "streaming";

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const next: Attachment[] = [];
    for (const file of incoming) {
      if (file.size > MAX_BYTES) {
        setNotice(`"${file.name}" is larger than 8 MB and was skipped.`);
        continue;
      }
      const url = await readAsDataURL(file);
      next.push({
        id: crypto.randomUUID(),
        type: "file",
        mediaType: file.type || "application/octet-stream",
        filename: file.name,
        url,
      });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = await readAsDataURL(blob);
        setAttachments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "file",
            mediaType: blob.type,
            filename: `recording-${Date.now()}.webm`,
            url,
          },
        ]);
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setNotice(null);
    } catch {
      setNotice("Couldn't access the microphone. Check browser permissions.");
    }
  }

  function submit() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isBusy) return;
    const files: FileUIPart[] = attachments.map(({ id: _id, ...rest }) => rest);
    onSend(text, files);
    setInput("");
    setAttachments([]);
    requestAnimationFrame(autoGrow);
  }

  return (
    <div className="border-t border-neutral-200 bg-neutral-50/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        {notice && (
          <div className="mb-2 rounded-md bg-amber-100 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {notice}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              >
                {a.mediaType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.filename} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="text-neutral-500">🎵</span>
                )}
                <span className="max-w-[140px] truncate">{a.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="text-neutral-400 hover:text-red-500"
                  aria-label="Remove attachment"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm focus-within:border-indigo-400 dark:border-neutral-700 dark:bg-neutral-900">
          <input
            ref={fileInputRef}
            type="file"
            accept={audioEnabled ? "image/*,audio/*" : "image/*"}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Attach a file"
            title="Attach image or audio"
          >
            <PaperclipIcon />
          </button>

          {audioEnabled && (
            <button
              type="button"
              onClick={() => void toggleRecording()}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                recording
                  ? "animate-pulse bg-red-500 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              }`}
              aria-label={recording ? "Stop recording" : "Record audio"}
              title={recording ? "Stop recording" : "Record audio (experimental)"}
            >
              <MicIcon />
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            placeholder="Message Gemma…"
            className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none placeholder:text-neutral-400"
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />

          {isBusy ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
              aria-label="Stop generating"
              title="Stop"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() && attachments.length === 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
              title="Send"
            >
              <SendIcon />
            </button>
          )}
        </div>

        <p className="mt-1.5 text-center text-[11px] text-neutral-400">
          Gemma can make mistakes. Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}

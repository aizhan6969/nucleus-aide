import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api";
import { Markdown } from "./Markdown";
import { cn } from "@/lib/utils";

export function ChatThread({
  messages, loading,
}: { messages: ChatMessage[]; loading?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex animate-fade-in-up", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "user" ? (
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14px] leading-relaxed text-primary-foreground">
                {m.content}
              </div>
            ) : (
              <div className="w-full max-w-full rounded-2xl rounded-bl-md border border-border bg-surface/60 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                    <span className="font-mono text-[9px] font-semibold text-primary">M</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">MynDerek</span>
                </div>
                <Markdown content={m.content} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex animate-fade-in-up justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface/60 px-4 py-3">
              <div className="dot-pulse"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  const suggestions = [
    "Explain Bayes' theorem with an intuition",
    "Summarize my uploaded lecture notes",
    "Recommend electives for an ML-focused term",
  ];
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center animate-fade-in-up">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <span className="font-mono text-base font-semibold text-primary">M</span>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">How can I help you today?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ask anything about your courses, data, or documents.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggest(s)}
              className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

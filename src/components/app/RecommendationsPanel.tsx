import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { Markdown } from "./Markdown";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function RecommendationsPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function submit() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await api.recommend(input);
      setReply(r.reply);
    } catch (e: any) {
      toast.error("Recommendation failed", { description: e.message });
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-8">
        {!reply && !loading && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <h2 className="text-xl font-semibold">Recommend my next courses</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tell me about your interests, strengths, and goals.</p>
            </div>
          </div>
        )}
        {loading && (
          <div className="grid h-full place-items-center"><div className="dot-pulse"><span /><span /><span /></div></div>
        )}
        {reply && (
          <div className="mx-auto max-w-3xl animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-6">
            <Markdown content={reply} />
          </div>
        )}
      </div>
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        disabled={loading}
        placeholder="Tell me about your interests…"
      />
    </div>
  );
}

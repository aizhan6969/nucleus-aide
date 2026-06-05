import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { Markdown } from "./Markdown";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function AnalyticsPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function submit() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await api.predict(input);
      setReply(r.reply);
    } catch (e: any) {
      toast.error("Prediction failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_1fr]">
      <div className="flex h-full flex-col border-r border-border">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <h2 className="text-lg font-semibold">Student profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe the student (grades, attendance, engagement). The model returns a success probability and risk.
          </p>
        </div>
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={submit}
          disabled={loading}
          placeholder="e.g. 2nd year CS, GPA 3.1, 78% attendance…"
        />
      </div>

      <div className="scrollbar-thin overflow-y-auto p-6">
        {!reply && !loading && (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Submit a profile to see prediction results.
          </div>
        )}
        {loading && (
          <div className="grid h-full place-items-center">
            <div className="dot-pulse"><span /><span /><span /></div>
          </div>
        )}
        {reply && (
          <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-6">
            <Markdown content={reply} />
          </div>
        )}
      </div>
    </div>
  );
}

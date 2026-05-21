import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Result = { probability: number; risk: "low" | "medium" | "high"; recommendations: string[] };

function Ring({ value }: { value: number }) {
  const r = 56, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg className="-rotate-90" width="160" height="160" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} stroke="var(--color-border)" strokeWidth="8" fill="none" />
        <circle
          cx="70" cy="70" r={r}
          stroke="var(--color-primary)" strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-semibold tracking-tight">{Math.round(value)}%</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Success</div>
      </div>
    </div>
  );
}

export function AnalyticsPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await api.predict({ description: input });
      setResult(r);
    } catch (e: any) {
      toast.error("Prediction failed", { description: e.message });
      // demo fallback
      setResult({
        probability: 72,
        risk: "medium",
        recommendations: [
          "Increase weekly study sessions to 4+ hours per subject",
          "Engage in tutor office hours at least twice this term",
          "Submit assignments at least 48 hours before deadline",
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  const riskStyles: Record<Result["risk"], string> = {
    low: "bg-success/15 text-success ring-success/30",
    medium: "bg-warning/15 text-warning ring-warning/30",
    high: "bg-danger/15 text-danger ring-danger/30",
  };

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
          placeholder="e.g. 2nd year CS, GPA 3.1, 78% attendance, missed 2 assignments…"
        />
      </div>

      <div className="scrollbar-thin overflow-y-auto p-6">
        {!result && !loading && (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Submit a profile to see prediction results.
          </div>
        )}
        {loading && (
          <div className="grid h-full place-items-center">
            <div className="dot-pulse"><span /><span /><span /></div>
          </div>
        )}
        {result && (
          <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-6">
            <div className="flex flex-wrap items-center gap-6">
              <Ring value={result.probability} />
              <div>
                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ring-1", riskStyles[result.risk])}>
                  {result.risk} risk
                </span>
                <h3 className="mt-3 text-lg font-semibold">Predicted outcome</h3>
                <p className="text-sm text-muted-foreground">Model-derived probability of course success.</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold">Recommendations</h4>
              <ul className="mt-2 space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/90">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground/70">
              Based on OULAD dataset · 22,000+ students
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

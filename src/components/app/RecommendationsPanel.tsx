import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Course = { code: string; name: string; level: string; description: string; match: number };

export function RecommendationsPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  async function submit() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await api.recommend(input);
      setCourses(r.courses);
    } catch (e: any) {
      toast.error("Recommendation failed", { description: e.message });
      setCourses([
        { code: "CS401", name: "Applied Machine Learning", level: "Advanced", description: "End-to-end ML pipelines on real datasets.", match: 94 },
        { code: "DS210", name: "Statistical Inference", level: "Intermediate", description: "Hypothesis testing, estimation, and Bayesian methods.", match: 88 },
        { code: "CS330", name: "Deep Learning Systems", level: "Advanced", description: "Neural network internals and training at scale.", match: 81 },
        { code: "MATH240", name: "Linear Algebra II", level: "Intermediate", description: "Eigenstructure and matrix decompositions.", match: 76 },
      ]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-8">
        {courses.length === 0 && !loading && (
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
        {courses.length > 0 && (
          <div className="animate-fade-in-up">
            <h2 className="text-sm font-medium text-muted-foreground">Matched courses</h2>
            <div className="scrollbar-thin -mx-1 mt-4 flex snap-x gap-4 overflow-x-auto px-1 pb-4">
              {courses.map((c) => (
                <article
                  key={c.code}
                  className="w-[280px] shrink-0 snap-start rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-medium text-primary ring-1 ring-primary/30">
                      {c.code}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.level}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug">{c.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.description}</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Match</span><span>{c.match}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${c.match}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
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

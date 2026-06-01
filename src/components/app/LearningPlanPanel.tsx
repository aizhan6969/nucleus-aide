import { useState } from "react";
import { Loader2, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Markdown } from "./Markdown";
import { toast } from "sonner";

type Week = { title: string; content: string };

function parseRoadmap(reply: string): { weeks: Week[]; career: string } {
  const lines = reply.split("\n");
  const headingRe = /^#{1,6}\s+(.+)$/;
  const weeks: Week[] = [];
  let career = "";
  let current: Week | null = null;
  let careerMode = false;

  for (const line of lines) {
    const m = line.match(headingRe);
    if (m) {
      const title = m[1].trim();
      const lower = title.toLowerCase();
      if (lower.includes("career") || lower.includes("карьер") || lower.includes("мансап")) {
        if (current) { weeks.push(current); current = null; }
        careerMode = true;
        continue;
      }
      if (/week|неделя|апта/i.test(title) || /^\d+\./.test(title)) {
        careerMode = false;
        if (current) weeks.push(current);
        current = { title, content: "" };
        continue;
      }
    }
    if (careerMode) career += line + "\n";
    else if (current) current.content += line + "\n";
  }
  if (current) weeks.push(current);

  if (weeks.length === 0 && !career) {
    // Fallback: split by "Week N" inline pattern
    const parts = reply.split(/(?=^|\n)(?:#+\s*)?(?:Week|Неделя|Апта)\s*\d+/i);
    parts.filter(Boolean).forEach((p, i) => weeks.push({ title: `Week ${i + 1}`, content: p.trim() }));
  }

  return { weeks, career: career.trim() };
}

export function LearningPlanPanel() {
  const { t } = useI18n();
  const [goal, setGoal] = useState("");
  const [skills, setSkills] = useState("");
  const [hours, setHours] = useState(10);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");

  async function run() {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const r = await api.learningPlan(goal.trim(), skills.trim(), hours);
      setReply(r.reply ?? "");
    } catch {
      toast.error(t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  const { weeks, career } = reply ? parseRoadmap(reply) : { weeks: [], career: "" };

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight">{t("learningPlanTitle")}</h2>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">{t("goal")}</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t("goalPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">{t("currentSkills")}</label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder={t("skillsPlaceholder")}
                className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">{t("hoursPerWeek")}</label>
              <input
                type="number"
                min={1}
                max={80}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={run}
            disabled={!goal.trim() || loading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("buildingPlan") : t("buildPlan")}
          </button>
        </div>

        {reply && !loading && (
          <div className="mt-10 animate-in fade-in duration-200">
            <div className="relative pl-8">
              <div className="absolute bottom-0 left-3 top-0 w-px bg-border" />
              {weeks.map((w, i) => (
                <div key={i} className="relative mb-5">
                  <span className="absolute -left-[22px] top-2 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                  <div className="rounded-lg border border-border bg-surface/40 p-4">
                    <div className="text-sm font-semibold text-foreground">{w.title}</div>
                    <div className="mt-2">
                      <Markdown content={w.content.trim()} />
                    </div>
                  </div>
                </div>
              ))}
              {weeks.length === 0 && (
                <div className="rounded-lg border border-border bg-surface/40 p-4">
                  <Markdown content={reply} />
                </div>
              )}
            </div>

            {career && (
              <div className="mt-6 rounded-lg border border-primary/40 bg-primary/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Briefcase className="h-4 w-4" />
                  {t("careerOpportunities")}
                </div>
                <div className="mt-3">
                  <Markdown content={career} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

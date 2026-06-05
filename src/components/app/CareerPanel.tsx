import { useState } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { Markdown } from "./Markdown";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function CareerPanel() {
  const { t } = useI18n();
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function build() {
    if (!role.trim()) return;
    setLoading(true);
    try {
      const r = await api.learningPlan(
        `Career roadmap for: ${role}`,
        skills,
        10,
      );
      setReply(r.reply);
    } catch (e: any) {
      toast.error(t("requestFailed"), { description: e.message });
    } finally { setLoading(false); }
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("careerTracker")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("careerTrackerHint")}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface/60 p-4">
          <Input label={t("desiredRole")} value={role} onChange={setRole} placeholder="e.g. Machine Learning Engineer" />
          <Input label={t("currentSkills")} value={skills} onChange={setSkills} placeholder="e.g. Python, SQL, basic stats" />
          <button onClick={build} disabled={loading || !role.trim()}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("buildRoadmap")}
          </button>
        </div>

        {reply && (
          <div className="mt-6 animate-fade-in-up rounded-xl border border-border bg-surface/60 p-5">
            <Markdown content={reply} />
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] font-medium text-muted-foreground">{label}</div>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}

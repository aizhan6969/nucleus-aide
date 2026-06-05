import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Goal = {
  id: string; title: string; description: string | null;
  deadline: string | null; progress: number; status: string;
};

export function GoalsPanel() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("goals").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setGoals((data ?? []) as Goal[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function add() {
    if (!user || !title.trim()) return;
    const { error } = await supabase.from("goals").insert({
      user_id: user.id, title: title.trim(),
      deadline: deadline || null, progress: 0, status: "active",
    });
    if (error) toast.error(error.message);
    else { setTitle(""); setDeadline(""); setAdding(false); load(); }
  }

  async function updateProgress(id: string, progress: number) {
    setGoals((g) => g.map((x) => x.id === id ? { ...x, progress } : x));
    await supabase.from("goals").update({
      progress, status: progress >= 100 ? "done" : "active",
    }).eq("id", id);
  }

  async function remove(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((g) => g.filter((x) => x.id !== id));
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("myGoals")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("myGoalsHint")}</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("addGoal")}
          </button>
        </div>

        {adding && (
          <div className="mt-4 animate-fade-in-up rounded-xl border border-border bg-surface/60 p-4">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t("goalTitlePlaceholder")}
              className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="mt-2 block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <button onClick={add} className="mt-3 h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("save")}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading && <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!loading && goals.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center text-sm text-muted-foreground">
              <Target className="mx-auto mb-2 h-6 w-6 opacity-60" />
              {t("noGoalsYet")}
            </div>
          )}
          {goals.map((g) => (
            <div key={g.id} className="animate-fade-in-up rounded-xl border border-border bg-surface/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold">{g.title}</h3>
                    {g.status === "done" && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/30">{t("done")}</span>}
                  </div>
                  {g.deadline && <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(g.deadline).toLocaleDateString()}</div>}
                </div>
                <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{t("progress")}</span><span>{g.progress}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={g.progress}
                  onChange={(e) => updateProgress(g.id, Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-primary)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

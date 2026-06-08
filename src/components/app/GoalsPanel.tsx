import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Loader2, ChevronDown, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Goal = {
  id: string; title: string; description: string | null;
  deadline: string | null; progress: number; status: string;
};
type Milestone = { id: string; goal_id: string; title: string; done: boolean; position: number };

export function GoalsPanel() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [newMs, setNewMs] = useState<Record<string, string>>({});

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

  async function loadMilestones(goalId: string) {
    const { data, error } = await supabase
      .from("goal_milestones").select("*")
      .eq("goal_id", goalId).order("position", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setMilestones((m) => ({ ...m, [goalId]: (data ?? []) as Milestone[] }));
  }

  function toggleOpen(goalId: string) {
    const next = !open[goalId];
    setOpen((o) => ({ ...o, [goalId]: next }));
    if (next && !milestones[goalId]) loadMilestones(goalId);
  }

  async function add() {
    if (!user || !title.trim()) return;
    const { error } = await supabase.from("goals").insert({
      user_id: user.id, title: title.trim(),
      deadline: deadline || null, progress: 0, status: "active",
    });
    if (error) toast.error(error.message);
    else { setTitle(""); setDeadline(""); setAdding(false); load(); }
  }

  async function recomputeProgress(goalId: string, list: Milestone[]) {
    let progress = 0;
    if (list.length > 0) {
      progress = Math.round((list.filter((m) => m.done).length / list.length) * 100);
    }
    setGoals((g) => g.map((x) => x.id === goalId ? {
      ...x, progress, status: progress >= 100 ? "done" : "active",
    } : x));
    await supabase.from("goals").update({
      progress, status: progress >= 100 ? "done" : "active",
    }).eq("id", goalId);
  }

  async function addMilestone(goalId: string) {
    const text = (newMs[goalId] ?? "").trim();
    if (!text) return;
    const existing = milestones[goalId] ?? [];
    const { data, error } = await supabase.from("goal_milestones").insert({
      goal_id: goalId, title: text, done: false, position: existing.length,
    }).select("*").single();
    if (error) { toast.error(error.message); return; }
    const updated = [...existing, data as Milestone];
    setMilestones((m) => ({ ...m, [goalId]: updated }));
    setNewMs((s) => ({ ...s, [goalId]: "" }));
    recomputeProgress(goalId, updated);
  }

  async function toggleMs(goalId: string, msId: string) {
    const list = milestones[goalId] ?? [];
    const updated = list.map((x) => x.id === msId ? { ...x, done: !x.done } : x);
    setMilestones((m) => ({ ...m, [goalId]: updated }));
    const target = updated.find((x) => x.id === msId)!;
    await supabase.from("goal_milestones").update({ done: target.done }).eq("id", msId);
    recomputeProgress(goalId, updated);
  }

  async function removeMs(goalId: string, msId: string) {
    const list = (milestones[goalId] ?? []).filter((x) => x.id !== msId);
    setMilestones((m) => ({ ...m, [goalId]: list }));
    await supabase.from("goal_milestones").delete().eq("id", msId);
    recomputeProgress(goalId, list);
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
          {goals.map((g) => {
            const isOpen = !!open[g.id];
            const list = milestones[g.id] ?? [];
            const completed = list.filter((m) => m.done).length;
            return (
              <div key={g.id} className="animate-fade-in-up rounded-xl border border-border bg-surface/60 p-4 transition hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => toggleOpen(g.id)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                    {isOpen ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14px] font-semibold">{g.title}</h3>
                        {g.status === "done" && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/30">{t("done")}</span>}
                        {list.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {completed}/{list.length} {t("milestones")}
                          </span>
                        )}
                      </div>
                      {g.deadline && <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(g.deadline).toLocaleDateString()}</div>}
                    </div>
                  </button>
                  <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("progress")}</span><span>{g.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                    <div className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {list.length === 0 && (
                      <p className="text-[12px] text-muted-foreground">{t("noMilestonesYet")}</p>
                    )}
                    {list.map((m) => (
                      <div key={m.id} className="group flex items-center gap-2">
                        <button
                          onClick={() => toggleMs(g.id, m.id)}
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${m.done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60"}`}
                        >
                          {m.done && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`flex-1 text-[13px] ${m.done ? "text-muted-foreground line-through" : ""}`}>{m.title}</span>
                        <button onClick={() => removeMs(g.id, m.id)} className="opacity-0 transition group-hover:opacity-100 text-muted-foreground hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        value={newMs[g.id] ?? ""}
                        onChange={(e) => setNewMs((s) => ({ ...s, [g.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") addMilestone(g.id); }}
                        placeholder={t("addMilestonePlaceholder")}
                        className="h-8 flex-1 rounded-md border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-primary/60"
                      />
                      <button onClick={() => addMilestone(g.id)} className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 hover:bg-primary/25">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

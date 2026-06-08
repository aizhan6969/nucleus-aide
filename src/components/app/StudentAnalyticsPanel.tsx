import { useEffect, useMemo, useState } from "react";
import { Flame, TrendingUp, MessageSquare, FileText, Target, Trophy, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getActivityDays, getStreak, type Streak } from "@/lib/dashboard-data";

type Counts = { chats: number; uploads: number; logins: number; plans: number };

export function StudentAnalyticsPanel() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [streak, setStreak] = useState<Streak>({ current: 0, best: 0, activeToday: false });
  const [days, setDays] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Counts>({ chats: 0, uploads: 0, logins: 0, plans: 0 });
  const [goals, setGoals] = useState<{ total: number; done: number }>({ total: 0, done: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [d, s, gRes] = await Promise.all([
        getActivityDays(user.id, 365),
        getStreak(user.id),
        supabase.from("goals").select("status").eq("user_id", user.id),
      ]);
      setDays(d); setStreak(s);
      const goalRows = (gRes.data ?? []) as { status: string }[];
      setGoals({ total: goalRows.length, done: goalRows.filter((x) => x.status === "done").length });

      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: act } = await supabase
        .from("student_activity")
        .select("action")
        .eq("student_id", user.id)
        .gte("created_at", since.toISOString());
      const c: Counts = { chats: 0, uploads: 0, logins: 0, plans: 0 };
      for (const row of (act ?? []) as { action: string }[]) {
        if (row.action === "chat") c.chats++;
        else if (row.action === "upload") c.uploads++;
        else if (row.action === "login") c.logins++;
        else if (row.action === "plan") c.plans++;
      }
      setCounts(c);
      setLoading(false);
    })();
  }, [user]);

  // 7-day weekday distribution
  const weekdayDist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const since = new Date(); since.setDate(since.getDate() - 90);
    for (const k of days) {
      const d = new Date(k);
      if (d >= since) counts[d.getDay()]++;
    }
    return counts;
  }, [days]);

  // Year heatmap: weeks x 7 days
  const heatmap = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDay = today.getDay(); // 0..6
    const weeks: { date: string; active: boolean }[][] = [];
    // start: 52 weeks back, aligned to Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - (52 * 7) - startDay);
    let cursor = new Date(start);
    for (let w = 0; w < 53; w++) {
      const col: { date: string; active: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const k = cursor.toISOString().slice(0, 10);
        col.push({ date: k, active: days.has(k) && cursor <= today });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(col);
    }
    return weeks;
  }, [days]);

  if (loading) {
    return <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const totalActiveDays = days.size;
  const completionRate = goals.total ? Math.round((goals.done / goals.total) * 100) : 0;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">{t("personalAnalytics")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("personalAnalyticsHint")}</p>
        </div>

        {/* Stat strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Flame} label={t("currentStreak")} value={`${streak.current}`} sub={`${t("best")} ${streak.best}`} accent="orange" />
          <Stat icon={TrendingUp} label={t("activeDays")} value={`${totalActiveDays}`} sub={t("last365Days")} />
          <Stat icon={MessageSquare} label={t("aiQuestions30")} value={`${counts.chats}`} sub={t("last30Days")} />
          <Stat icon={Target} label={t("goalCompletion")} value={`${completionRate}%`} sub={`${goals.done}/${goals.total}`} />
        </div>

        {/* Year heatmap */}
        <section className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold tracking-tight">{t("yearActivity")}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{t("less")}</span>
              <span className="h-2.5 w-2.5 rounded-sm bg-surface-elevated" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              <span>{t("more")}</span>
            </div>
          </div>
          <div className="scrollbar-thin overflow-x-auto">
            <div className="flex gap-[3px]">
              {heatmap.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((cell, di) => (
                    <div
                      key={di}
                      title={cell.date}
                      className={`h-2.5 w-2.5 rounded-sm ${cell.active ? "bg-primary" : "bg-surface-elevated"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Weekday distribution */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-5">
            <h3 className="mb-3 text-[13px] font-semibold tracking-tight">{t("weekdayPattern")}</h3>
            <div className="flex h-32 items-end gap-2">
              {weekdayDist.map((v, i) => {
                const max = Math.max(...weekdayDist, 1);
                const h = Math.max(6, Math.round((v / max) * 100));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary transition-all" style={{ height: `${h}%` }} />
                    <span className="text-[10px] text-muted-foreground">{["S","M","T","W","T","F","S"][i]}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">{t("last90Days")}</p>
          </div>

          <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-5">
            <h3 className="mb-3 text-[13px] font-semibold tracking-tight">{t("activityBreakdown")}</h3>
            <ActivityRow icon={MessageSquare} label={t("chat")} value={counts.chats} />
            <ActivityRow icon={FileText} label={t("documents")} value={counts.uploads} />
            <ActivityRow icon={Target} label={t("learningPlan")} value={counts.plans} />
            <ActivityRow icon={Trophy} label={t("logins")} value={counts.logins} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string; sub: string; accent?: "orange";
}) {
  const color = accent === "orange" ? "text-[oklch(0.72_0.18_55)]" : "text-primary";
  return (
    <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-primary/30">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/25">
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function ActivityRow({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <div className="flex items-center gap-2 text-[13px]">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <span className="font-mono text-[13px] tabular-nums">{value}</span>
    </div>
  );
}

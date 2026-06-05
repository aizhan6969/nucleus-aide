import { useEffect, useState } from "react";
import { Flame, Target, FileText, MessageSquare, Sparkles, TrendingUp, Calendar as CalIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getStreak, greeting, quoteOfTheDay, type Streak } from "@/lib/dashboard-data";
import { api, type Mode } from "@/lib/api";
import { gotoMode } from "@/lib/nav";

type RecentChat = { id: string; title: string; updated_at: string };
type Goal = { id: string; title: string; progress: number; deadline: string | null };
type Event = { id: string; title: string; type: string; starts_at: string };

export function DashboardPanel() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [streak, setStreak] = useState<Streak>({ current: 0, best: 0, activeToday: false });
  const [chats, setChats] = useState<RecentChat[]>([]);
  const [docs, setDocs] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setStreak(await getStreak(user.id));

      const { data: chatRows } = await supabase
        .from("chats").select("id, title, updated_at")
        .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4);
      if (chatRows) setChats(chatRows as RecentChat[]);

      api.myDocs().then((r) => setDocs(r.files.slice(0, 4))).catch(() => {});

      const { data: goalRows } = await supabase
        .from("goals").select("id, title, progress, deadline")
        .eq("user_id", user.id).neq("status", "done").order("created_at", { ascending: false }).limit(3);
      if (goalRows) setGoals(goalRows as Goal[]);

      const { data: evRows } = await supabase
        .from("calendar_events").select("id, title, type, starts_at")
        .eq("user_id", user.id).gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }).limit(3);
      if (evRows) setEvents(evRows as Event[]);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero */}
        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-7">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-wider text-muted-foreground">{t("dashboard")}</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {greeting(lang, user.name.split(" ")[0])}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">{quoteOfTheDay(lang)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated/60 px-4 py-3">
              <Flame className={streak.current > 0 ? "h-6 w-6 text-[oklch(0.72_0.18_55)]" : "h-6 w-6 text-muted-foreground/50"} />
              <div>
                <div className="text-2xl font-semibold leading-none">{streak.current}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("dayStreak")} · {t("best")} {streak.best}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card title={t("activeGoals")} icon={Target} onMore={() => gotoMode("goals")}>
            {goals.length === 0 ? (
              <Empty text={t("noGoalsYet")} cta={t("addGoal")} onClick={() => gotoMode("goals")} />
            ) : (
              <ul className="space-y-3">
                {goals.map((g) => (
                  <li key={g.id}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="truncate">{g.title}</span>
                      <span className="text-muted-foreground">{g.progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full bg-primary transition-all" style={{ width: `${g.progress}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("upcomingDeadlines")} icon={CalIcon} onMore={() => gotoMode("calendar")}>
            {events.length === 0 ? (
              <Empty text={t("noDeadlines")} cta={t("openCalendar")} onClick={() => gotoMode("calendar")} />
            ) : (
              <ul className="space-y-2.5">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-[13px]">
                    <span className="truncate">{e.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(e.starts_at).toLocaleDateString(lang === "kz" ? "kk" : lang, { month: "short", day: "numeric" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("recommendationOfTheDay")} icon={Sparkles} onMore={() => gotoMode("today")}>
            <p className="text-[13px] leading-relaxed text-foreground/90">
              {dailyTip(lang)}
            </p>
          </Card>

          <Card title={t("recentChats")} icon={MessageSquare} onMore={() => gotoMode("chat")}>
            {chats.length === 0 ? (
              <Empty text={t("noChatsYet")} cta={t("startChat")} onClick={() => gotoMode("chat")} />
            ) : (
              <ul className="space-y-2">
                {chats.map((c) => (
                  <li key={c.id} className="truncate text-[13px] text-foreground/90">· {c.title}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("recentDocuments")} icon={FileText} onMore={() => gotoMode("documents")}>
            {docs.length === 0 ? (
              <Empty text={t("noDocsYet")} cta={t("uploadDoc")} onClick={() => gotoMode("documents")} />
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => <li key={d} className="truncate text-[13px] text-foreground/90">· {d}</li>)}
              </ul>
            )}
          </Card>

          <Card title={t("learningProgress")} icon={TrendingUp} onMore={() => gotoMode("analytics")}>
            <div className="flex items-end gap-1">
              {[20, 35, 25, 60, 45, 80, streak.activeToday ? 100 : 30].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-primary/70 transition-all" style={{ height: `${Math.max(8, h)}px` }} />
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">{t("last7Days")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, onMore, children }: {
  title: string; icon: any; onMore?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="group animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-5 transition hover:border-primary/30">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/25">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
        </div>
        {onMore && (
          <button onClick={onMore} className="opacity-0 transition group-hover:opacity-100">
            <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
      </div>
      <div className="min-h-[80px]">{children}</div>
    </div>
  );
}

function Empty({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-start gap-2">
      <p className="text-[12px] text-muted-foreground">{text}</p>
      <button onClick={onClick} className="text-[12px] font-medium text-primary hover:underline">
        {cta} →
      </button>
    </div>
  );
}

function dailyTip(lang: "en" | "ru" | "kz") {
  const tips = [
    { en: "Review yesterday's notes for 5 minutes before starting today's study session.", ru: "Перечитай вчерашние заметки 5 минут перед сегодняшней учёбой.", kz: "Бүгінгі сабақ алдында кешегі жазбаларды 5 минут қарап шық." },
    { en: "Teach one concept you learned this week to someone else.", ru: "Объясни кому-нибудь одну концепцию, которую выучил на этой неделе.", kz: "Осы аптада үйренген бір ұғымды біреуге түсіндіріп бер." },
    { en: "Block 90 minutes today for deep focus on your hardest subject.", ru: "Выдели 90 минут на самый сложный предмет в режиме глубокой фокусировки.", kz: "Бүгін ең қиын пәнге 90 минут терең фокус бөл." },
    { en: "Write down three questions you can't answer yet — then find them.", ru: "Запиши три вопроса, на которые пока нет ответа — и найди их.", kz: "Әлі жауабы жоқ үш сұрақ жазып ал — содан жауабын тап." },
  ];
  return tips[Math.floor(Date.now() / 86400000) % tips.length][lang];
}

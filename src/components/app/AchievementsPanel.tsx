import { useEffect, useState } from "react";
import { Trophy, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getStreak } from "@/lib/dashboard-data";

type AchKey =
  | "first_chat" | "first_doc" | "first_plan" | "first_goal"
  | "ten_chats" | "fifty_chats" | "hundred_chats"
  | "streak_3" | "streak_7" | "streak_30"
  | "five_goals" | "ten_goals" | "first_completed_goal" | "first_event" | "early_adopter";

type Ach = {
  key: AchKey;
  titleEn: string; titleRu: string; titleKz: string;
  descEn: string; descRu: string; descKz: string;
  target: number;
  metric: (m: Metrics) => number;
};

type Metrics = {
  chats: number; uploads: number; plans: number; events: number;
  goals: number; goalsDone: number; streakBest: number;
};

const ALL: Ach[] = [
  { key: "first_chat", titleEn: "First Chat", titleRu: "Первый чат", titleKz: "Алғашқы чат", descEn: "Send your first message", descRu: "Отправь первое сообщение", descKz: "Алғашқы хабарламаңды жібер", target: 1, metric: (m) => m.chats },
  { key: "ten_chats", titleEn: "10 Questions", titleRu: "10 вопросов", titleKz: "10 сұрақ", descEn: "Ask the AI 10 times", descRu: "Задай ИИ 10 вопросов", descKz: "AI-ға 10 сұрақ қой", target: 10, metric: (m) => m.chats },
  { key: "fifty_chats", titleEn: "50 Questions", titleRu: "50 вопросов", titleKz: "50 сұрақ", descEn: "Ask the AI 50 times", descRu: "Задай ИИ 50 вопросов", descKz: "AI-ға 50 сұрақ қой", target: 50, metric: (m) => m.chats },
  { key: "hundred_chats", titleEn: "Power User", titleRu: "Опытный пользователь", titleKz: "Тәжірибелі қолданушы", descEn: "100 AI questions", descRu: "100 вопросов ИИ", descKz: "100 AI сұрақ", target: 100, metric: (m) => m.chats },
  { key: "first_doc", titleEn: "First Document", titleRu: "Первый документ", titleKz: "Алғашқы құжат", descEn: "Upload your first PDF", descRu: "Загрузи первый PDF", descKz: "Алғашқы PDF жүкте", target: 1, metric: (m) => m.uploads },
  { key: "first_plan", titleEn: "First Plan", titleRu: "Первый план", titleKz: "Алғашқы жоспар", descEn: "Build a learning roadmap", descRu: "Создай учебный план", descKz: "Оқу жоспарын құр", target: 1, metric: (m) => m.plans },
  { key: "first_goal", titleEn: "Goal Setter", titleRu: "Целеустремлённый", titleKz: "Мақсаткер", descEn: "Add your first goal", descRu: "Добавь первую цель", descKz: "Алғашқы мақсатыңды қос", target: 1, metric: (m) => m.goals },
  { key: "five_goals", titleEn: "5 Goals", titleRu: "5 целей", titleKz: "5 мақсат", descEn: "Track 5 goals", descRu: "Веди 5 целей", descKz: "5 мақсат жүргіз", target: 5, metric: (m) => m.goals },
  { key: "ten_goals", titleEn: "10 Goals", titleRu: "10 целей", titleKz: "10 мақсат", descEn: "Track 10 goals", descRu: "Веди 10 целей", descKz: "10 мақсат жүргіз", target: 10, metric: (m) => m.goals },
  { key: "first_completed_goal", titleEn: "Mission Complete", titleRu: "Цель достигнута", titleKz: "Мақсат орындалды", descEn: "Complete your first goal", descRu: "Заверши первую цель", descKz: "Алғашқы мақсатты аяқта", target: 1, metric: (m) => m.goalsDone },
  { key: "streak_3", titleEn: "3-Day Streak", titleRu: "3 дня подряд", titleKz: "3 күн қатарынан", descEn: "Active 3 days in a row", descRu: "3 дня активности", descKz: "Қатарынан 3 күн", target: 3, metric: (m) => m.streakBest },
  { key: "streak_7", titleEn: "Week Warrior", titleRu: "Неделя подряд", titleKz: "Апта қатарынан", descEn: "7-day streak", descRu: "7 дней подряд", descKz: "7 күн қатарынан", target: 7, metric: (m) => m.streakBest },
  { key: "streak_30", titleEn: "Monthly Discipline", titleRu: "Месяц подряд", titleKz: "Ай қатарынан", descEn: "30-day streak", descRu: "30 дней подряд", descKz: "30 күн қатарынан", target: 30, metric: (m) => m.streakBest },
  { key: "first_event", titleEn: "Planner", titleRu: "Планировщик", titleKz: "Жоспарлаушы", descEn: "Add first calendar event", descRu: "Добавь первое событие", descKz: "Алғашқы оқиғаны қос", target: 1, metric: (m) => m.events },
  { key: "early_adopter", titleEn: "Early Adopter", titleRu: "Ранний пользователь", titleKz: "Ертеден қолданушы", descEn: "Join MynDerek", descRu: "Присоединись к MynDerek", descKz: "MynDerek-ке қосыл", target: 1, metric: () => 1 },
];

export function AchievementsPanel() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [docsRes, plansRes, chatsRes, goalsRes, eventsRes, streak] = await Promise.all([
        supabase.from("student_activity").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("action", "upload"),
        supabase.from("student_activity").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("action", "plan"),
        supabase.from("student_activity").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("action", "chat"),
        supabase.from("goals").select("status").eq("user_id", user.id),
        supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        getStreak(user.id),
      ]);
      const goals = (goalsRes.data ?? []) as { status: string }[];
      setMetrics({
        chats: chatsRes.count ?? 0,
        uploads: docsRes.count ?? 0,
        plans: plansRes.count ?? 0,
        events: eventsRes.count ?? 0,
        goals: goals.length,
        goalsDone: goals.filter((g) => g.status === "done").length,
        streakBest: streak.best,
      });
    })();
  }, [user]);

  const title = (a: Ach) => lang === "ru" ? a.titleRu : lang === "kz" ? a.titleKz : a.titleEn;
  const desc = (a: Ach) => lang === "ru" ? a.descRu : lang === "kz" ? a.descKz : a.descEn;

  const unlockedCount = metrics ? ALL.filter((a) => a.metric(metrics) >= a.target).length : 0;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("achievements")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unlockedCount} {t("of")} {ALL.length} {t("unlocked")}
            </p>
          </div>
          <Trophy className="h-7 w-7 text-[oklch(0.75_0.16_85)]" />
        </div>

        {/* Overall progress bar */}
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all"
               style={{ width: `${(unlockedCount / ALL.length) * 100}%` }} />
        </div>

        {!metrics ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">…</div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL.map((a) => {
              const v = Math.min(a.metric(metrics), a.target);
              const pct = Math.round((v / a.target) * 100);
              const isUn = v >= a.target;
              return (
                <div key={a.key} className={`animate-fade-in-up rounded-xl border p-4 transition ${isUn ? "border-primary/30 bg-surface/60" : "border-border bg-surface/30"}`}>
                  <div className="flex items-center gap-2">
                    {isUn
                      ? <Trophy className="h-4 w-4 text-[oklch(0.78_0.16_85)]" />
                      : <Lock className="h-4 w-4 text-muted-foreground" />}
                    <div className={`text-[13px] font-semibold ${isUn ? "" : "text-foreground/80"}`}>{title(a)}</div>
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">{desc(a)}</p>
                  {a.target > 1 && (
                    <>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div className={`h-full transition-all ${isUn ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{v} / {a.target}</span>
                        {!isUn && pct >= 70 && <span className="text-primary">{t("almostThere")}</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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

const ALL: { key: AchKey; titleEn: string; titleRu: string; titleKz: string; descEn: string; descRu: string; descKz: string }[] = [
  { key: "first_chat", titleEn: "First Chat", titleRu: "Первый чат", titleKz: "Алғашқы чат", descEn: "Send your first message", descRu: "Отправь первое сообщение", descKz: "Алғашқы хабарламаңды жібер" },
  { key: "ten_chats", titleEn: "10 Questions", titleRu: "10 вопросов", titleKz: "10 сұрақ", descEn: "Ask the AI 10 times", descRu: "Задай ИИ 10 вопросов", descKz: "AI-ға 10 сұрақ қой" },
  { key: "fifty_chats", titleEn: "50 Questions", titleRu: "50 вопросов", titleKz: "50 сұрақ", descEn: "Ask the AI 50 times", descRu: "Задай ИИ 50 вопросов", descKz: "AI-ға 50 сұрақ қой" },
  { key: "hundred_chats", titleEn: "Power User", titleRu: "Опытный пользователь", titleKz: "Тәжірибелі қолданушы", descEn: "100 AI questions", descRu: "100 вопросов ИИ", descKz: "100 AI сұрақ" },
  { key: "first_doc", titleEn: "First Document", titleRu: "Первый документ", titleKz: "Алғашқы құжат", descEn: "Upload your first PDF", descRu: "Загрузи первый PDF", descKz: "Алғашқы PDF жүкте" },
  { key: "first_plan", titleEn: "First Plan", titleRu: "Первый план", titleKz: "Алғашқы жоспар", descEn: "Build a learning roadmap", descRu: "Создай учебный план", descKz: "Оқу жоспарын құр" },
  { key: "first_goal", titleEn: "Goal Setter", titleRu: "Целеустремлённый", titleKz: "Мақсаткер", descEn: "Add your first goal", descRu: "Добавь первую цель", descKz: "Алғашқы мақсатыңды қос" },
  { key: "five_goals", titleEn: "5 Goals", titleRu: "5 целей", titleKz: "5 мақсат", descEn: "Track 5 goals", descRu: "Веди 5 целей", descKz: "5 мақсат жүргіз" },
  { key: "ten_goals", titleEn: "10 Goals", titleRu: "10 целей", titleKz: "10 мақсат", descEn: "Track 10 goals", descRu: "Веди 10 целей", descKz: "10 мақсат жүргіз" },
  { key: "first_completed_goal", titleEn: "Mission Complete", titleRu: "Цель достигнута", titleKz: "Мақсат орындалды", descEn: "Complete your first goal", descRu: "Заверши первую цель", descKz: "Алғашқы мақсатты аяқта" },
  { key: "streak_3", titleEn: "3-Day Streak", titleRu: "3 дня подряд", titleKz: "3 күн қатарынан", descEn: "Active 3 days in a row", descRu: "3 дня активности", descKz: "Қатарынан 3 күн" },
  { key: "streak_7", titleEn: "Week Warrior", titleRu: "Неделя подряд", titleKz: "Апта қатарынан", descEn: "7-day streak", descRu: "7 дней подряд", descKz: "7 күн қатарынан" },
  { key: "streak_30", titleEn: "Monthly Discipline", titleRu: "Месяц подряд", titleKz: "Ай қатарынан", descEn: "30-day streak", descRu: "30 дней подряд", descKz: "30 күн қатарынан" },
  { key: "first_event", titleEn: "Planner", titleRu: "Планировщик", titleKz: "Жоспарлаушы", descEn: "Add first calendar event", descRu: "Добавь первое событие", descKz: "Алғашқы оқиғаны қос" },
  { key: "early_adopter", titleEn: "Early Adopter", titleRu: "Ранний пользователь", titleKz: "Ертеден қолданушы", descEn: "Join MynDerek", descRu: "Присоединись к MynDerek", descKz: "MynDerek-ке қосыл" },
];

export function AchievementsPanel() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [unlocked, setUnlocked] = useState<Set<AchKey>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const u = new Set<AchKey>(["early_adopter"]);

      const [chatsRes, docsRes, goalsRes, eventsRes, actRes] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("student_activity").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("action", "upload"),
        supabase.from("goals").select("id, status").eq("user_id", user.id),
        supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("student_activity").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("action", "chat"),
      ]);

      const chatCount = actRes.count ?? 0;
      if (chatCount >= 1) u.add("first_chat");
      if (chatCount >= 10) u.add("ten_chats");
      if (chatCount >= 50) u.add("fifty_chats");
      if (chatCount >= 100) u.add("hundred_chats");

      if ((docsRes.count ?? 0) >= 1) u.add("first_doc");
      if ((eventsRes.count ?? 0) >= 1) u.add("first_event");

      const goals = (goalsRes.data ?? []) as { id: string; status: string }[];
      if (goals.length >= 1) u.add("first_goal");
      if (goals.length >= 5) u.add("five_goals");
      if (goals.length >= 10) u.add("ten_goals");
      if (goals.some((g) => g.status === "done")) u.add("first_completed_goal");

      const streak = await getStreak(user.id);
      if (streak.best >= 3) u.add("streak_3");
      if (streak.best >= 7) u.add("streak_7");
      if (streak.best >= 30) u.add("streak_30");

      // first_plan: heuristic — student_activity with action='plan' OR any chat in 'plan' mode
      const { count: planCount } = await supabase
        .from("student_activity").select("id", { count: "exact", head: true })
        .eq("student_id", user.id).eq("action", "plan");
      if ((planCount ?? 0) >= 1) u.add("first_plan");

      setUnlocked(u);
      setLoading(false);
      void chatsRes;
    })();
  }, [user]);

  const title = (a: typeof ALL[number]) => lang === "ru" ? a.titleRu : lang === "kz" ? a.titleKz : a.titleEn;
  const desc = (a: typeof ALL[number]) => lang === "ru" ? a.descRu : lang === "kz" ? a.descKz : a.descEn;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("achievements")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unlocked.size} / {ALL.length} {t("unlocked")}
            </p>
          </div>
          <Trophy className="h-7 w-7 text-[oklch(0.75_0.16_85)]" />
        </div>

        {loading ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">…</div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL.map((a) => {
              const isUn = unlocked.has(a.key);
              return (
                <div key={a.key} className={`animate-fade-in-up rounded-xl border p-4 transition ${isUn ? "border-primary/30 bg-surface/60" : "border-border bg-surface/30 opacity-60"}`}>
                  <div className="flex items-center gap-2">
                    {isUn ? <Trophy className="h-4 w-4 text-[oklch(0.78_0.16_85)]" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    <div className="text-[13px] font-semibold">{title(a)}</div>
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">{desc(a)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

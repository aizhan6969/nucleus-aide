import { Sparkles, Flame, Coffee, Lightbulb, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getStreak, quoteOfTheDay, type Streak } from "@/lib/dashboard-data";

export function TodayPanel() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [streak, setStreak] = useState<Streak>({ current: 0, best: 0, activeToday: false });

  useEffect(() => {
    if (user) getStreak(user.id).then(setStreak);
  }, [user]);

  const today = new Date().toLocaleDateString(lang === "kz" ? "kk" : lang, {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="animate-fade-in-up">
          <div className="text-[12px] uppercase tracking-wider text-muted-foreground">{today}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("todayTitle")}</h1>
        </div>

        <Block icon={Flame} title={t("streakToday")} accent="orange">
          <div className="text-2xl font-semibold">{streak.current} {t("days")}</div>
          <p className="mt-1 text-[12px] text-muted-foreground">{t("best")}: {streak.best}</p>
        </Block>

        <Block icon={Sparkles} title={t("recommendationOfTheDay")}>
          <p>{recItem(lang)}</p>
        </Block>

        <Block icon={Lightbulb} title={t("microTaskOfTheDay")}>
          <p>{microTask(lang)}</p>
        </Block>

        <Block icon={Coffee} title={t("tipOfTheDay")}>
          <p>{tipItem(lang)}</p>
        </Block>

        <Block icon={Quote} title={t("motivationToday")}>
          <p className="italic text-foreground/90">"{quoteOfTheDay(lang)}"</p>
        </Block>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, accent, children }: { icon: any; title: string; accent?: "orange"; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={`grid h-7 w-7 place-items-center rounded-md ring-1 ${accent === "orange" ? "bg-[oklch(0.72_0.18_55/0.18)] ring-[oklch(0.72_0.18_55/0.35)]" : "bg-primary/15 ring-primary/25"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent === "orange" ? "text-[oklch(0.78_0.16_55)]" : "text-primary"}`} />
        </div>
        <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Date.now() / 86400000) % arr.length]; }
function recItem(lang: "en" | "ru" | "kz") {
  return pick([
    { en: "Spend 25 minutes reviewing your weakest topic from last week.", ru: "Уделите 25 минут самой слабой теме прошлой недели.", kz: "Өткен аптадағы әлсіз тақырыпқа 25 минут бөліңіз." },
    { en: "Read one academic article outside your major field.", ru: "Прочитайте одну академическую статью вне основной специальности.", kz: "Негізгі мамандығыңыздан тыс бір ғылыми мақала оқыңыз." },
    { en: "Build a tiny side project that uses something you just learned.", ru: "Сделайте маленький пет-проект, используя то, что только что выучили.", kz: "Жаңа үйренгенді қолданып, шағын жоба жасап көріңіз." },
  ])[lang];
}
function microTask(lang: "en" | "ru" | "kz") {
  return pick([
    { en: "Write a 3-sentence summary of your last lecture.", ru: "Напишите краткое содержание последней лекции в 3 предложения.", kz: "Соңғы дәрістің 3 сөйлемнен тұратын қысқаша мазмұнын жазыңыз." },
    { en: "Solve one practice problem you've been postponing.", ru: "Решите одну задачу, которую вы откладывали.", kz: "Кейінге қалдырған бір тапсырманы шешіңіз." },
    { en: "List 3 questions for your next class.", ru: "Запишите 3 вопроса для следующего занятия.", kz: "Келесі сабаққа 3 сұрақ дайындаңыз." },
  ])[lang];
}
function tipItem(lang: "en" | "ru" | "kz") {
  return pick([
    { en: "Active recall beats re-reading. Close the book and write what you remember.", ru: "Активное вспоминание сильнее перечитывания. Закройте конспект и запишите по памяти.", kz: "Қайта оқудан гөрі есте сақтап жазу әлдеқайда тиімді." },
    { en: "Sleep is part of studying. 7-8 hours consolidates what you learn.", ru: "Сон — часть учёбы. 7-8 часов закрепляют выученное.", kz: "Ұйқы — оқудың бір бөлігі. 7-8 сағат білімді бекітеді." },
    { en: "Walk for 10 minutes between focus sessions to recharge.", ru: "Прогуляйтесь 10 минут между сессиями фокуса.", kz: "Фокус сессиялары арасында 10 минут серуенге шығыңыз." },
  ])[lang];
}

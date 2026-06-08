import { supabase } from "./supabase";

export type Streak = { current: number; best: number; activeToday: boolean };

/** YYYY-MM-DD set of unique active days in the last `days` window. */
export async function getActivityDays(
  userId: string,
  days = 365,
): Promise<Set<string>> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("student_activity")
    .select("created_at")
    .eq("student_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  const set = new Set<string>();
  if (error || !data) return set;
  for (const row of data) {
    set.add(new Date(row.created_at as string).toISOString().slice(0, 10));
  }
  return set;
}

/** Compute consecutive-day streak from student_activity rows. */
export async function getStreak(userId: string): Promise<Streak> {
  const days = await getActivityDays(userId, 365);
  if (days.size === 0) return { current: 0, best: 0, activeToday: false };

  const today = new Date().toISOString().slice(0, 10);
  const activeToday = days.has(today);

  let current = 0;
  const cursor = new Date();
  if (!activeToday) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...days].sort();
  let best = 0, run = 0;
  let prev: Date | null = null;
  for (const s of sorted) {
    const d = new Date(s);
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best, activeToday };
}

/** Returns last N days as [{date, active}] oldest→newest. */
export function lastNDays(active: Set<string>, n: number) {
  const out: { date: string; active: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    out.push({ date: k, active: active.has(k) });
  }
  return out;
}

const QUOTES = [
  { en: "Small steps every day beat heroic effort once a month.", ru: "Маленькие шаги каждый день побеждают героические рывки.", kz: "Күн сайынғы шағын қадамдар бір реттік ерлікке тұрады." },
  { en: "You don't have to be great to start, but you have to start to be great.", ru: "Не нужно быть великим, чтобы начать — нужно начать, чтобы стать великим.", kz: "Бастау үшін ұлы болудың қажеті жоқ, ал ұлы болу үшін бастау керек." },
  { en: "Focus is saying no to a hundred good ideas.", ru: "Фокус — это умение сказать «нет» сотне хороших идей.", kz: "Фокус — жүздеген жақсы идеяға «жоқ» деу." },
  { en: "Knowledge compounds. Read today, decide better tomorrow.", ru: "Знания накапливаются. Читай сегодня — решай лучше завтра.", kz: "Білім жинақталады. Бүгін оқы — ертең жақсы шешім қабылда." },
  { en: "The expert in anything was once a beginner.", ru: "Каждый эксперт когда-то был новичком.", kz: "Әр сарапшы бір кездері жаңадан үйренуші болған." },
  { en: "Curiosity is the engine of achievement.", ru: "Любопытство — двигатель достижений.", kz: "Қызығушылық — жетістіктің қозғаушысы." },
  { en: "Done is better than perfect.", ru: "Сделанное лучше идеального.", kz: "Жасалғаны мінсізден артық." },
];

export function quoteOfTheDay(lang: "en" | "ru" | "kz") {
  const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
  return QUOTES[dayIndex][lang];
}

export function greeting(lang: "en" | "ru" | "kz", name: string) {
  const h = new Date().getHours();
  const slot = h < 6 ? 3 : h < 12 ? 0 : h < 18 ? 1 : 2;
  const en = ["Good morning", "Good afternoon", "Good evening", "Good night"];
  const ru = ["Доброе утро", "Добрый день", "Добрый вечер", "Доброй ночи"];
  const kz = ["Қайырлы таң", "Қайырлы күн", "Қайырлы кеш", "Қайырлы түн"];
  const g = lang === "ru" ? ru[slot] : lang === "kz" ? kz[slot] : en[slot];
  return `${g}, ${name}`;
}

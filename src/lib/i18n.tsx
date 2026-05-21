import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ru" | "kz";

const dict = {
  en: {
    appSubtitle: "University AI Assistant",
    signIn: "Sign in", signUp: "Sign up", signOut: "Sign out",
    email: "Email", password: "Password", fullName: "Full name", confirmPassword: "Confirm password",
    noAccount: "Don't have an account?", haveAccount: "Already have an account?",
    createAccount: "Create account",
    student: "Student", teacher: "Teacher",
    settings: "Settings",
    chat: "Chat", analytics: "Analytics", recommendations: "Recommendations",
    documents: "Documents", groupDashboard: "Group Dashboard",
    newChat: "New chat", recent: "Recent", noConversations: "No conversations yet",
    inputPlaceholder: "Message MynDerek…",
    emptyTitle: "How can I help you today?",
    emptySubtitle: "Ask anything about your courses, data, or documents.",
    suggestions: [
      "Explain Bayes' theorem",
      "Summarize lecture notes",
      "Recommend electives for ML",
    ],
    backendOffline: "Backend offline · localhost:8000",
    studentName: "Student name", riskLevel: "Risk level", activity: "Activity",
    lastSeen: "Last seen", low: "Low", medium: "Medium", high: "High",
    passwordMismatch: "Passwords do not match",
    invalidCredentials: "Invalid credentials",
  },
  ru: {
    appSubtitle: "Университетский AI-ассистент",
    signIn: "Войти", signUp: "Регистрация", signOut: "Выйти",
    email: "Email", password: "Пароль", fullName: "Полное имя", confirmPassword: "Подтвердите пароль",
    noAccount: "Нет аккаунта?", haveAccount: "Уже есть аккаунт?",
    createAccount: "Создать аккаунт",
    student: "Студент", teacher: "Преподаватель",
    settings: "Настройки",
    chat: "Чат", analytics: "Аналитика", recommendations: "Рекомендации",
    documents: "Документы", groupDashboard: "Группа",
    newChat: "Новый чат", recent: "Недавние", noConversations: "Пока нет диалогов",
    inputPlaceholder: "Написать сообщение…",
    emptyTitle: "Чем могу помочь?",
    emptySubtitle: "Спросите о курсах, данных или документах.",
    suggestions: [
      "Объясни теорему Байеса",
      "Суммируй лекцию",
      "Рекомендуй курсы по ML",
    ],
    backendOffline: "Бэкенд недоступен · localhost:8000",
    studentName: "Имя студента", riskLevel: "Риск", activity: "Активность",
    lastSeen: "Последний вход", low: "Низкий", medium: "Средний", high: "Высокий",
    passwordMismatch: "Пароли не совпадают",
    invalidCredentials: "Неверные данные",
  },
  kz: {
    appSubtitle: "Университеттік AI-көмекші",
    signIn: "Кіру", signUp: "Тіркелу", signOut: "Шығу",
    email: "Email", password: "Құпиясөз", fullName: "Толық аты", confirmPassword: "Құпиясөзді растаңыз",
    noAccount: "Тіркелгі жоқ па?", haveAccount: "Тіркелгіңіз бар ма?",
    createAccount: "Тіркелгі ашу",
    student: "Студент", teacher: "Оқытушы",
    settings: "Баптаулар",
    chat: "Чат", analytics: "Аналитика", recommendations: "Ұсыныстар",
    documents: "Құжаттар", groupDashboard: "Топ",
    newChat: "Жаңа чат", recent: "Соңғылары", noConversations: "Әзірге диалог жоқ",
    inputPlaceholder: "Хабарлама жазу…",
    emptyTitle: "Сізге қалай көмектесе аламын?",
    emptySubtitle: "Курстар, деректер немесе құжаттар туралы сұраңыз.",
    suggestions: [
      "Байес теоремасын түсіндір",
      "Дәрісті қысқаша баянда",
      "ML бойынша курстар ұсын",
    ],
    backendOffline: "Бэкенд қолжетімсіз · localhost:8000",
    studentName: "Студент аты", riskLevel: "Тәуекел", activity: "Белсенділік",
    lastSeen: "Соңғы кіру", low: "Төмен", medium: "Орташа", high: "Жоғары",
    passwordMismatch: "Құпиясөздер сәйкес емес",
    invalidCredentials: "Деректер қате",
  },
} as const;

type Keys = keyof typeof dict["en"];
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Keys) => any };
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const stored = localStorage.getItem("mynderek.lang") as Lang | null;
    if (stored && ["en","ru","kz"].includes(stored)) setLangState(stored);
  }, []);
  function setLang(l: Lang) {
    localStorage.setItem("mynderek.lang", l);
    setLangState(l);
  }
  const t = (k: Keys) => (dict[lang] as any)[k] ?? (dict.en as any)[k];
  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>;
}

export function useI18n() {
  const c = useContext(I18n);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

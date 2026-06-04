import { supabase } from './supabase';

export const API_BASE = "http://localhost:8000";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Mode = "chat" | "analytics" | "recommendations" | "documents" | "group";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || "anonymous";
}

async function jsonPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  // ── Чат с RAG ─────────────────────────────────────────────────────────────
  chat: async (message: string, mode: Mode, history: ChatMessage[], user_role?: string) => {
    const user_id = await getUserId();
    return jsonPost<{ reply: string; sources: string[]; used_rag: boolean }>(
      "/chat",
      { message, mode, history, user_role, user_id }
    );
  },

  // ── Прогноз успеваемости ──────────────────────────────────────────────────
  predict: (student_data: string) =>
    jsonPost<{ reply: string }>("/predict", { student_data }),

  // ── Рекомендации курсов ───────────────────────────────────────────────────
  recommend: (interests: string) =>
    jsonPost<{ reply: string }>("/recommend", { interests }),

  // ── Загрузка PDF ──────────────────────────────────────────────────────────
  upload: async (file: File) => {
    const user_id = await getUserId();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("user_id", user_id);
    const res = await fetch(`${API_BASE}/upload_doc`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json() as Promise<{ status: string; filename: string; chunks: number; message: string }>;
  },

  // ── Мои документы ─────────────────────────────────────────────────────────
  myDocs: async () => {
    const user_id = await getUserId();
    const res = await fetch(`${API_BASE}/my_docs/${user_id}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json() as Promise<{ files: string[]; count: number }>;
  },

  // ── AI ассистент преподавателя ────────────────────────────────────────────
  analyzeLecture: async (file: File) => {
    const user_id = await getUserId();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("user_id", user_id);
    const res = await fetch(`${API_BASE}/teacher/analyze_lecture`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json() as Promise<{ filename: string; reply: string }>;
  },

  // ── Задания разного уровня сложности ──────────────────────────────────────
  generateAssignments: (topic: string, subject?: string) =>
    jsonPost<{ reply: string }>("/teacher/generate_assignments", { topic, subject }),

  // ── Умная проверка заданий ────────────────────────────────────────────────
  checkAssignment: (data: {
    assignment_id: string;
    student_id: string;
    student_answer: string;
    assignment_title: string;
    assignment_description: string;
  }) => jsonPost<{ reply: string }>("/teacher/check_assignment", data),

  // ── Персональный план обучения ────────────────────────────────────────────
  learningPlan: (goal: string, current_skills: string, hours: number) =>
    jsonPost<{ reply: string }>("/student/learning_plan", {
      goal,
      current_skills,
      available_hours_per_week: hours
    }),

  // ── Расширенный анализ риска ──────────────────────────────────────────────
  riskAnalysis: (student_data: string) =>
    jsonPost<{ reply: string }>("/analytics/risk", { student_data }),

  // ── Проверка бэкенда ──────────────────────────────────────────────────────
  ping: async () => {
    const res = await fetch(`${API_BASE}/`, { method: "GET" }).catch(() => null);
    return !!res;
  },
};
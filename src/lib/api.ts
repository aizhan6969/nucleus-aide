export const API_BASE = "http://localhost:8000";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Mode = "chat" | "analytics" | "recommendations" | "documents" | "group";

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
  chat: (message: string, mode: Mode, history: ChatMessage[], user_role?: string) =>
    jsonPost<{ reply: string }>("/chat", { message, mode, history, user_role }),
  predict: (student_data: Record<string, unknown>) =>
    jsonPost<{ probability: number; risk: "low" | "medium" | "high"; recommendations: string[] }>("/predict", { student_data }),
  recommend: (interests: string) =>
    jsonPost<{ courses: { code: string; name: string; level: string; description: string; match: number }[] }>("/recommend", { interests }),
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json() as Promise<{ id: string; name: string }>;
  },
  ping: async () => {
    const res = await fetch(`${API_BASE}/`, { method: "GET" }).catch(() => null);
    return !!res;
  },
};

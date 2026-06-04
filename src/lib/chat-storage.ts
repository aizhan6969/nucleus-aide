import { supabase } from "./supabase";
import type { ChatMessage } from "./api";

export type StoredConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

// ── Загрузить все чаты пользователя ──────────────────────────────────────────
export async function loadConversations(email: string): Promise<StoredConversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: chats, error } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !chats) return [];

  // Загружаем сообщения для каждого чата
  const conversations: StoredConversation[] = await Promise.all(
    chats.map(async (chat) => {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });

      return {
        id: chat.id,
        title: chat.title || "Новый чат",
        messages: (messages || []) as ChatMessage[],
        updatedAt: new Date(chat.updated_at).getTime(),
      };
    })
  );

  return conversations;
}

// ── Сохранить / обновить чат ──────────────────────────────────────────────────
export async function saveConversation(
  email: string,
  conv: StoredConversation
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert чат
  const { error: chatError } = await supabase
    .from("chats")
    .upsert({
      id: conv.id,
      user_id: user.id,
      title: conv.title,
      updated_at: new Date(conv.updatedAt).toISOString(),
    });

  if (chatError) {
    console.error("Ошибка сохранения чата:", chatError);
    return;
  }

  // Удаляем старые сообщения и вставляем новые
  await supabase.from("messages").delete().eq("chat_id", conv.id);

  if (conv.messages.length > 0) {
    const { error: msgError } = await supabase.from("messages").insert(
      conv.messages.map((msg) => ({
        chat_id: conv.id,
        role: msg.role,
        content: msg.content,
      }))
    );
    if (msgError) console.error("Ошибка сохранения сообщений:", msgError);
  }
}

// ── Удалить чат ───────────────────────────────────────────────────────────────
export async function deleteConversation(
  email: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", id);

  if (error) console.error("Ошибка удаления чата:", error);
}

// ── Загрузить один чат по id ──────────────────────────────────────────────────
export async function loadConversation(
  id: string
): Promise<StoredConversation | null> {
  const { data: chat } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .eq("id", id)
    .single();

  if (!chat) return null;

  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  return {
    id: chat.id,
    title: chat.title || "Новый чат",
    messages: (messages || []) as ChatMessage[],
    updatedAt: new Date(chat.updated_at).getTime(),
  };
}

// ── Логировать активность студента ────────────────────────────────────────────
export async function trackActivity(
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("student_activity").insert({
    student_id: user.id,
    action,
    metadata: metadata || {},
  });
}

import type { ChatMessage } from "./api";

export type StoredConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

function key(email: string) { return `mynderek.chats.${email}`; }

export function loadConversations(email: string): StoredConversation[] {
  try {
    const raw = localStorage.getItem(key(email));
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredConversation[];
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch { return []; }
}

export function saveConversation(email: string, conv: StoredConversation) {
  const all = loadConversations(email).filter((c) => c.id !== conv.id);
  all.unshift(conv);
  localStorage.setItem(key(email), JSON.stringify(all.slice(0, 50)));
}

export function deleteConversation(email: string, id: string) {
  const all = loadConversations(email).filter((c) => c.id !== id);
  localStorage.setItem(key(email), JSON.stringify(all));
}

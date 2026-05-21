import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar, type Conversation } from "@/components/app/Sidebar";
import { ChatInput } from "@/components/app/ChatInput";
import { ChatThread, EmptyState } from "@/components/app/ChatThread";
import { AnalyticsPanel } from "@/components/app/AnalyticsPanel";
import { RecommendationsPanel } from "@/components/app/RecommendationsPanel";
import { DocumentsPanel } from "@/components/app/DocumentsPanel";
import { api, type ChatMessage, type Mode } from "@/lib/api";
import { toast } from "sonner";
import { AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: App });

const MODE_LABEL: Record<Mode, string> = {
  chat: "Chat",
  analytics: "Analytics",
  recommendations: "Recommendations",
  documents: "Documents",
};

function App() {
  const [mode, setMode] = useState<Mode>("chat");
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);

  // ping backend
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = await api.ping();
      if (!cancelled) setOnline(ok);
    };
    check();
    const t = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  async function streamReply(reply: string) {
    // simple character-by-character streaming for typing effect
    let acc = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    const chunkSize = Math.max(2, Math.floor(reply.length / 120));
    for (let i = 0; i < reply.length; i += chunkSize) {
      acc = reply.slice(0, i + chunkSize);
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
      await new Promise((r) => setTimeout(r, 12));
    }
    setMessages((m) => {
      const copy = m.slice();
      copy[copy.length - 1] = { role: "assistant", content: reply };
      return copy;
    });
  }

  async function send(text: string) {
    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    // create / rename conversation
    if (!activeConv) {
      const id = crypto.randomUUID();
      setActiveConv(id);
      setConversations((c) => [{ id, title: text.slice(0, 36) }, ...c].slice(0, 20));
    }

    try {
      const r = await api.chat(text, mode, next);
      setLoading(false);
      await streamReply(r.reply);
    } catch (e: any) {
      setLoading(false);
      const fallback = `I couldn't reach the backend at \`http://localhost:8000\`. Make sure the FastAPI server is running.\n\n**You sent:** ${text}`;
      await streamReply(fallback);
      toast.error("Backend unreachable");
    }
  }

  function newChat() {
    setMessages([]);
    setActiveConv(null);
    setInput("");
    setMode("chat");
  }

  const modeBadge = useMemo(() => {
    if (mode === "chat") return "Llama 3.1 · Groq";
    if (mode === "analytics") return "OULAD Predictor v2";
    if (mode === "recommendations") return "Course Matcher";
    return "PDF Retriever";
  }, [mode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        mode={mode}
        onMode={(m) => { setMode(m); }}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        conversations={conversations}
        activeId={activeConv}
        onSelectConversation={setActiveConv}
        onNewChat={newChat}
      />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold">{MODE_LABEL[mode]}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              {modeBadge}
            </span>
          </div>
          {!online && (
            <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1 text-[12px] text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Backend offline · localhost:8000
            </div>
          )}
        </header>

        {/* Body */}
        {mode === "chat" && (
          <>
            {messages.length === 0
              ? <EmptyState onSuggest={(s) => send(s)} />
              : <ChatThread messages={messages} loading={loading} />}
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => input.trim() && send(input.trim())}
              disabled={loading}
            />
          </>
        )}
        {mode === "analytics" && <AnalyticsPanel />}
        {mode === "recommendations" && <RecommendationsPanel />}
        {mode === "documents" && (
          <DocumentsPanel
            onAsk={(name) => {
              setMode("chat");
              setTimeout(() => send(`Summarize the key insights from "${name}".`), 50);
            }}
          />
        )}
      </main>
    </div>
  );
}

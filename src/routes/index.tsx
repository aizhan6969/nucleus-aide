import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar, type Conversation } from "@/components/app/Sidebar";
import { ChatInput } from "@/components/app/ChatInput";
import { ChatThread, EmptyState } from "@/components/app/ChatThread";
import { AnalyticsPanel } from "@/components/app/AnalyticsPanel";
import { RecommendationsPanel } from "@/components/app/RecommendationsPanel";
import { DocumentsPanel } from "@/components/app/DocumentsPanel";
import { GroupDashboard } from "@/components/app/GroupDashboard";
import { LectureAnalyzerPanel } from "@/components/app/LectureAnalyzerPanel";
import { GenerateTasksPanel } from "@/components/app/GenerateTasksPanel";
import { LearningPlanPanel } from "@/components/app/LearningPlanPanel";
import { HeaderControls } from "@/components/app/HeaderControls";
import { api, type ChatMessage, type Mode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  loadConversations, saveConversation, deleteConversation as storageDelete,
  type StoredConversation,
} from "@/lib/chat-storage";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user]);

  if (!ready || !user) {
    return <div className="grid h-screen place-items-center bg-background text-sm text-muted-foreground">…</div>;
  }

  return <Workspace />;
}

function Workspace() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const userEmail = user!.email;
  const defaultMode: Mode = user!.role === "teacher" ? "chat" : "chat";

  const modeLabel = (m: Mode) => ({
    chat: t("chat"),
    analytics: t("analytics"),
    recommendations: t("recommendations"),
    documents: t("documents"),
    group: t("groupDashboard"),
    lecture: t("lectureAnalyzer"),
    tasks: t("generateTasks"),
    plan: t("learningPlan"),
  })[m];

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const fullConvs = useRef<StoredConversation[]>([]);

  // Load conversations on mount / user change
  useEffect(() => {
    const all = loadConversations(userEmail);
    fullConvs.current = all;
    setConversations(all.map((c) => ({ id: c.id, title: c.title })));
  }, [userEmail]);

  // Persist active conversation whenever messages change
  useEffect(() => {
    if (!activeConv || messages.length === 0) return;
    const title = (messages.find((m) => m.role === "user")?.content ?? "New chat").slice(0, 30);
    const conv: StoredConversation = { id: activeConv, title, messages, updatedAt: Date.now() };
    saveConversation(userEmail, conv);
    fullConvs.current = loadConversations(userEmail);
    setConversations(fullConvs.current.map((c) => ({ id: c.id, title: c.title })));
  }, [messages, activeConv, userEmail]);

  // Ping backend
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

    let convId = activeConv;
    if (!convId) {
      convId = crypto.randomUUID();
      setActiveConv(convId);
    }

    try {
      const r = await api.chat(text, mode, next, user!.role);
      setLoading(false);
      await streamReply(r.reply);
    } catch {
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

  function selectConversation(id: string) {
    const c = fullConvs.current.find((x) => x.id === id);
    if (!c) return;
    setActiveConv(id);
    setMessages(c.messages);
    setMode("chat");
  }

  function deleteConv(id: string) {
    storageDelete(userEmail, id);
    fullConvs.current = loadConversations(userEmail);
    setConversations(fullConvs.current.map((c) => ({ id: c.id, title: c.title })));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
  }

  const suggestions = useMemo(() => t("suggestions") as string[], [lang]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        mode={mode}
        onMode={setMode}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        conversations={conversations}
        activeId={activeConv}
        onSelectConversation={selectConversation}
        onNewChat={newChat}
        onDeleteConversation={deleteConv}
      />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-5">
          <h1 className="text-sm font-semibold">{modeLabel(mode)}</h1>
          <div className="flex items-center gap-3">
            {!online && (
              <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1 text-[12px] text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("backendOffline")}
              </div>
            )}
            <HeaderControls />
          </div>
        </header>

        {mode === "chat" && (
          <>
            {messages.length === 0
              ? <EmptyState
                  onSuggest={(s) => send(s)}
                  title={t("emptyTitle")}
                  subtitle={t("emptySubtitle")}
                  suggestions={suggestions}
                />
              : <ChatThread messages={messages} loading={loading} />}
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => input.trim() && send(input.trim())}
              disabled={loading}
              placeholder={t("inputPlaceholder")}
            />
          </>
        )}
        {mode === "analytics" && <AnalyticsPanel />}
        {mode === "recommendations" && <RecommendationsPanel />}
        {mode === "group" && <GroupDashboard />}
        {mode === "lecture" && <LectureAnalyzerPanel />}
        {mode === "tasks" && <GenerateTasksPanel />}
        {mode === "plan" && <LearningPlanPanel />}
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

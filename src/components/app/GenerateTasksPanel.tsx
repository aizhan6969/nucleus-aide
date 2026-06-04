import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Markdown } from "./Markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function extractSection(reply: string, keys: string[]): string {
  const lines = reply.split("\n");
  const headingRe = /^#{1,6}\s+(.+)$/;
  let start = -1, end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (m && keys.some((k) => m[1].toLowerCase().includes(k))) { start = i; break; }
  }
  if (start === -1) return "";
  for (let i = start + 1; i < lines.length; i++) {
    if (headingRe.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n").trim();
}

function LevelCard({
  title, dot, content,
}: { title: string; dot: string; content: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-h-[260px] flex-col rounded-lg border border-border bg-surface/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
          {title}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <div className="mt-3 flex-1 overflow-auto">
        <Markdown content={content || "_—_"} />
      </div>
    </div>
  );
}

export function GenerateTasksPanel() {
  const { t } = useI18n();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");

  async function run() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const r = await api.generateAssignments(topic.trim(), subject.trim() || undefined);
      setReply(r.reply ?? "");
    } catch {
      toast.error(t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  const easy = reply ? extractSection(reply, ["easy", "лёгк", "легк", "жеңіл", "light", "low"]) : "";
  const medium = reply ? extractSection(reply, ["medium", "средн", "орташа", "middle"]) : "";
  const hard = reply ? extractSection(reply, ["hard", "сложн", "қиын", "difficult", "advanced"]) : "";

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-xl font-semibold tracking-tight">{t("generateTasksTitle")}</h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">{t("topic")}</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topicPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">{t("subject")}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={run}
            disabled={!topic.trim() || loading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("generating") : t("generate")}
          </button>
        </div>

        {reply && !loading && (
          <div className="mt-8 grid gap-4 animate-in fade-in duration-200 md:grid-cols-3">
            <LevelCard title={`🟢 ${t("easyLevel")}`}   dot="bg-emerald-500" content={easy} />
            <LevelCard title={`🟡 ${t("mediumLevel")}`} dot="bg-amber-500"   content={medium} />
            <LevelCard title={`🔴 ${t("hardLevel")}`}   dot="bg-red-500"     content={hard} />
          </div>
        )}
      </div>
    </div>
  );
}

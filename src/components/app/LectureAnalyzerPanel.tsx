import { useRef, useState } from "react";
import { Upload, FileText, Loader2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Markdown } from "./Markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Section = "summary" | "test" | "homework" | "exam";

function extractSection(reply: string, keys: string[]): string {
  // Try to find a heading containing any key and return content until next heading
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

export function LectureAnalyzerPanel() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>("");
  const [tab, setTab] = useState<Section>("summary");
  const [copied, setCopied] = useState(false);

  const sections: Record<Section, { label: string; keys: string[] }> = {
  summary:  { label: `📋 ${t("summary")}`,       keys: ["summary", "конспект", "обзор", "краткий"] },
  test:     { label: `📝 ${t("test")}`,          keys: ["test", "тест", "quiz"] },
  homework: { label: `🏠 ${t("homework")}`,      keys: ["homework", "домашн", "домашк", "үй"] },
  exam:     { label: `🎓 ${t("examQuestions")}`, keys: ["exam", "экзамен", "емтихан", "вопросы для"] },
  };

  async function run() {
    if (!file) return;
    setLoading(true);
    try {
      const r = await api.analyzeLecture(file);
      setReply(r.reply ?? "");
    } catch {
      toast.error(t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) { toast.error("PDF only"); return; }
    setFile(f);
  }

  const currentContent = reply
  ? extractSection(reply, sections[tab].keys)
  : "";
  
  function copy() {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight">{t("lectureAnalyzerTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("lectureAnalyzerSubtitle")}</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition",
            drag ? "border-primary bg-primary/5" : "border-primary/40 hover:border-primary/70 hover:bg-primary/5",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 text-primary" />
              <p className="mt-3 text-sm text-foreground">{t("dropPdfHere")}</p>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={run}
            disabled={!file || loading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("analyzing") : t("analyze")}
          </button>
        </div>

        {loading && (
          <div className="mt-6 overflow-hidden rounded-md bg-surface">
            <div className="h-1 w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        )}

        {reply && !loading && (
          <div className="mt-8 animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-1 border-b border-border">
              {(Object.keys(sections) as Section[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "relative px-3 py-2 text-sm transition",
                    tab === k ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {sections[k].label}
                  {tab === k && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-primary" />}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={copy}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-border bg-surface/40 p-5">
              <Markdown content={currentContent || "_No content_"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

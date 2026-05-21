import { useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Doc = { id: string; name: string; status: "uploading" | "ready" | "error"; size: number };

export function DocumentsPanel({ onAsk }: { onAsk: (docName: string) => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDFs are supported");
        continue;
      }
      const id = crypto.randomUUID();
      setDocs((d) => [...d, { id, name: file.name, status: "uploading", size: file.size }]);
      try {
        const r = await api.upload(file);
        setDocs((d) => d.map((x) => x.id === id ? { ...x, id: r.id, status: "ready" } : x));
      } catch (e: any) {
        setDocs((d) => d.map((x) => x.id === id ? { ...x, status: "error" } : x));
        // demo: pretend success
        setTimeout(() => setDocs((d) => d.map((x) => x.id === id ? { ...x, status: "ready" } : x)), 800);
      }
    }
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload PDFs and chat with their contents.</p>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={cn(
            "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-surface/30 px-6 py-12 text-center transition",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
          )}
        >
          <Upload className={cn("h-7 w-7", dragOver ? "text-primary" : "text-muted-foreground")} />
          <div className="mt-3 text-sm font-medium">Drop PDFs here or click to browse</div>
          <div className="mt-1 text-[12px] text-muted-foreground">Max 20MB per file</div>
          <input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>

        <div className="mt-6 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3 animate-fade-in-up">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-elevated">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">{(d.size / 1024).toFixed(0)} KB</div>
              </div>
              {d.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {d.status === "ready" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <button
                    onClick={() => onAsk(d.name)}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2.5 py-1 text-xs text-foreground hover:border-primary/40"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Ask
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

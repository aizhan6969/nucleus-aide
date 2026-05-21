import { useEffect, useRef } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput({
  value, onChange, onSubmit, onAttach, disabled, placeholder = "Message MynDerek…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const max = 24 * 6 + 24; // ~6 lines
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <div className="group relative rounded-2xl border border-border bg-surface/80 backdrop-blur transition focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_oklch(0.585_0.214_277_/_8%)]">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSubmit();
              }
            }}
            placeholder={placeholder}
            className="block w-full resize-none bg-transparent px-12 py-3.5 text-[14px] leading-6 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {/* attach */}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-2.5 left-2.5 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
            type="button"
            aria-label="Attach PDF"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && onAttach) onAttach(f);
              e.target.value = "";
            }}
          />
          {/* send */}
          <button
            onClick={onSubmit}
            disabled={!canSend}
            className={cn(
              "absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-lg transition",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                : "bg-surface-elevated text-muted-foreground/50",
            )}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-center text-[11px] text-muted-foreground/60">
          Shift + Enter for new line · Enter to send
        </div>
      </div>
    </div>
  );
}

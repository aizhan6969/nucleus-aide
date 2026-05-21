import { useEffect, useRef, useState } from "react";
import { Globe, Sun, Moon } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LANGS: { id: Lang; label: string; code: string; flag: string }[] = [
  { id: "ru", label: "Русский", code: "RU", flag: "🇷🇺" },
  { id: "kz", label: "Қазақша", code: "KZ", flag: "🇰🇿" },
  { id: "en", label: "English", code: "EN", flag: "🇬🇧" },
];

export function HeaderControls() {
  const { lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = LANGS.find((l) => l.id === lang)!;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[12px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Globe className="h-3.5 w-3.5" />
          {current.code}
        </button>
        {open && (
          <div className="absolute right-0 top-9 z-50 w-40 animate-fade-in-up overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => { setLang(l.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition hover:bg-surface-elevated",
                  l.id === lang ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={toggle}
        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

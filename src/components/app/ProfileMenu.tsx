import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
}

export function ProfileMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;
  const roleColor = user.role === "teacher"
    ? "bg-[oklch(0.55_0.22_300/_0.18)] text-[oklch(0.78_0.18_300)] ring-[oklch(0.55_0.22_300/_0.35)]"
    : "bg-[oklch(0.55_0.2_250/_0.18)] text-[oklch(0.78_0.16_250)] ring-[oklch(0.55_0.2_250/_0.35)]";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md border border-transparent p-1.5 transition hover:border-border hover:bg-surface-elevated",
          collapsed && "justify-center",
        )}
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-elevated text-xs font-medium ring-1 ring-border">
          {initials(user.name)}
        </div>
        {!collapsed && (
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{t(user.role === "teacher" ? "teacher" : "student")}</div>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-60 animate-fade-in-up overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="flex items-center gap-3 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-elevated text-sm font-medium ring-1 ring-border">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="px-3 pb-2">
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", roleColor)}>
              {t(user.role === "teacher" ? "teacher" : "student")}
            </span>
          </div>
          <div className="border-t border-border" />
          <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-elevated">
            <Settings className="h-4 w-4 text-muted-foreground" />
            {t("settings")}
          </button>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

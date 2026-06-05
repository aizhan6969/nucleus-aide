import { useState } from "react";
import { Download, Loader2, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function SettingsPanel() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { theme, toggle } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function exportData() {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, chats, messages, goals, events, activity] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("chats").select("*").eq("user_id", user.id),
        supabase.from("messages").select("*"),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("calendar_events").select("*").eq("user_id", user.id),
        supabase.from("student_activity").select("*").eq("student_id", user.id),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        profile: profile.data, chats: chats.data, messages: messages.data,
        goals: goals.data, calendar_events: events.data, student_activity: activity.data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `mynderek-data-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success(t("dataExported"));
    } catch (e: any) { toast.error(e.message); }
    finally { setExporting(false); }
  }

  async function deleteAccount() {
    if (!user) return;
    if (!confirm(t("deleteAccountConfirm"))) return;
    setDeleting(true);
    // Clean up user data (RLS protects what we don't own)
    await Promise.all([
      supabase.from("goals").delete().eq("user_id", user.id),
      supabase.from("calendar_events").delete().eq("user_id", user.id),
      supabase.from("chats").delete().eq("user_id", user.id),
      supabase.from("profiles").delete().eq("id", user.id),
    ]);
    await logout();
    toast.info(t("accountDeleted"));
    setDeleting(false);
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings")}</h1>

        <Section title={t("appearance")}>
          <Row label={t("theme")} hint={theme === "dark" ? t("darkTheme") : t("lightTheme")}>
            <button onClick={toggle} className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm hover:border-primary/40">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === "dark" ? t("switchToLight") : t("switchToDark")}
            </button>
          </Row>
        </Section>

        <Section title={t("language")}>
          <Row label={t("interfaceLanguage")}>
            <div className="flex gap-2">
              {(["en", "ru", "kz"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`h-9 rounded-md border px-3 text-sm uppercase transition ${lang === l ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:border-primary/40"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title={t("notifications")}>
          <Toggle label={t("dailyReminders")} />
          <Toggle label={t("deadlineAlerts")} />
          <Toggle label={t("weeklyDigest")} defaultChecked />
        </Section>

        <Section title={t("aiPreferences")}>
          <Row label={t("responseStyle")}>
            <select className="h-9 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60">
              <option>{t("balanced")}</option>
              <option>{t("concise")}</option>
              <option>{t("detailed")}</option>
            </select>
          </Row>
        </Section>

        <Section title={t("privacyAndData")}>
          <button onClick={exportData} disabled={exporting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm hover:border-primary/40 disabled:opacity-60">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("exportData")}
          </button>
          <button onClick={deleteAccount} disabled={deleting}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-danger/30 bg-danger/5 text-sm text-danger hover:bg-danger/10 disabled:opacity-60">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t("deleteAccount")}
          </button>
        </Section>

        <Section title={t("account")}>
          <Row label={t("email")} hint={user?.email ?? ""}><Monitor className="h-4 w-4 text-muted-foreground" /></Row>
          <Row label={t("role")} hint={user ? t(user.role as any) : ""} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ label, hint, children }: { label: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[13px]">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <Row label={label}>
      <button onClick={() => setOn((v) => !v)} className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary" : "bg-surface-elevated"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </Row>
  );
}

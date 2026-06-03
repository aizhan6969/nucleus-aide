import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError(t("passwordTooShort")); return; }
    if (password !== confirm) { setError(t("passwordMismatch")); return; }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success(t("passwordUpdated"));
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "Error");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-7">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <span className="font-mono text-sm font-semibold text-primary">M</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{t("setNewPassword")}</h1>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{t("password")}</div>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_2px_oklch(0.585_0.214_277_/_25%)]"
            />
          </label>
          <label className="block">
            <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{t("confirmPassword")}</div>
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_2px_oklch(0.585_0.214_277_/_25%)]"
            />
          </label>
          {error && <div className="text-[12px] text-danger">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}

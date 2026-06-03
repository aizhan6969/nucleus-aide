import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
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
          <h1 className="text-lg font-semibold tracking-tight">{t("forgotPasswordTitle")}</h1>
          <p className="text-center text-[12px] text-muted-foreground">{t("forgotPasswordHint")}</p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-3 text-[12px] text-foreground">
            {t("resetEmailSent")}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{t("email")}</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {t("sendResetLink")}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">{t("backToSignIn")}</Link>
        </p>
      </div>
    </div>
  );
}

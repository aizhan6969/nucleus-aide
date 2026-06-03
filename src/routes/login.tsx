import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { GoogleButton, OrDivider } from "@/components/app/GoogleButton";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? t("invalidCredentials"));
    } finally { setLoading(false); }
  }

  async function google() {
    setError("");
    setGoogleLoading(true);
    try { await loginWithGoogle(); }
    catch (err: any) { setError(err?.message ?? "Error"); setGoogleLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-7">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <span className="font-mono text-sm font-semibold text-primary">M</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">MynDerek</h1>
          <p className="text-[12px] text-muted-foreground">{t("appSubtitle")}</p>
        </div>

        <div className="mt-7">
          <GoogleButton onClick={google} loading={googleLoading} label={t("continueWithGoogle")} />
          <OrDivider label={t("or")} />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label={t("email")} type="email" value={email} onChange={setEmail} error={error} />
          <Field label={t("password")} type="password" value={password} onChange={setPassword} error={error} />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[12px] text-muted-foreground hover:text-primary">{t("forgotPassword")}</Link>
          </div>
          {error && <div className="text-[12px] text-danger">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("signIn")}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/register" className="text-primary hover:underline">{t("signUp")}</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, error }: {
  label: string; type: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_2px_oklch(0.585_0.214_277_/_25%)] ${error ? "border-danger/60" : "border-border"}`}
      />
    </label>
  );
}

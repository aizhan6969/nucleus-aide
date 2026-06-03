import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Users, Loader2, MailCheck } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { GoogleButton, OrDivider } from "@/components/app/GoogleButton";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { register, loginWithGoogle, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t("passwordMismatch")); return; }
    setLoading(true);
    try {
      const { needsConfirmation } = await register(name.trim(), email.trim(), password, role);
      if (needsConfirmation) setSent(true);
      else navigate({ to: "/" });
    } catch (err: any) { setError(err?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  async function google() {
    setError("");
    setGoogleLoading(true);
    try { await loginWithGoogle(); }
    catch (err: any) { setError(err?.message ?? "Error"); setGoogleLoading(false); }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <MailCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">{t("checkEmailToConfirm")}</h1>
          <p className="mt-2 text-[12px] text-muted-foreground">{email}</p>
          <Link to="/login" className="mt-6 inline-block text-[12px] text-primary hover:underline">{t("backToSignIn")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-surface/60 p-7">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <span className="font-mono text-sm font-semibold text-primary">M</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">MynDerek</h1>
          <p className="text-[12px] text-muted-foreground">{t("appSubtitle")}</p>
        </div>

        <div className="mt-6">
          <GoogleButton onClick={google} loading={googleLoading} label={t("continueWithGoogle")} />
          <OrDivider label={t("or")} />
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <Field label={t("fullName")} type="text" value={name} onChange={setName} />
          <Field label={t("email")} type="email" value={email} onChange={setEmail} />
          <Field label={t("password")} type="password" value={password} onChange={setPassword} />
          <Field label={t("confirmPassword")} type="password" value={confirm} onChange={setConfirm} error={!!error && password !== confirm} />

          <div>
            <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{t("chooseRole")}</div>
            <div className="grid grid-cols-2 gap-2">
              <RoleCard active={role === "student"} onClick={() => setRole("student")} icon={<GraduationCap className="h-4 w-4" />} label={t("student")} />
              <RoleCard active={role === "teacher"} onClick={() => setRole("teacher")} icon={<Users className="h-4 w-4" />} label={t("teacher")} />
            </div>
          </div>

          {error && <div className="text-[12px] text-danger">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("createAccount")}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline">{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, error }: {
  label: string; type: string; value: string; onChange: (v: string) => void; error?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "block h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_2px_oklch(0.585_0.214_277_/_25%)]",
          error ? "border-danger/60" : "border-border",
        )}
      />
    </label>
  );
}

function RoleCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border bg-surface px-3 py-3 text-sm transition",
        active
          ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_oklch(0.585_0.214_277_/_30%)]"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

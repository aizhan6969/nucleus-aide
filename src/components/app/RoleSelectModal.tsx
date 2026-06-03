import { useState } from "react";
import { GraduationCap, Users, Loader2 } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RoleSelectModal() {
  const { needsRole, setRoleForNewUser } = useAuth();
  const { t } = useI18n();
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);

  if (!needsRole) return null;

  async function submit() {
    setLoading(true);
    try {
      await setRoleForNewUser(role);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">{t("chooseRole")}</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">{t("chooseRoleHint")}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <RoleCard active={role === "student"} onClick={() => setRole("student")} icon={<GraduationCap className="h-4 w-4" />} label={t("student")} />
          <RoleCard active={role === "teacher"} onClick={() => setRole("teacher")} icon={<Users className="h-4 w-4" />} label={t("teacher")} />
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("continue")}
        </button>
      </div>
    </div>
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

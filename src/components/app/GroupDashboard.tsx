import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Row = { name: string; risk: "low" | "medium" | "high"; activity: number; lastSeen: string };

const ROWS: Row[] = [
  { name: "Aigerim Nurlanova", risk: "low", activity: 92, lastSeen: "2h ago" },
  { name: "Daulet Akhmetov", risk: "high", activity: 34, lastSeen: "5d ago" },
  { name: "Madina Sergazy", risk: "medium", activity: 67, lastSeen: "1d ago" },
  { name: "Eldar Khassenov", risk: "low", activity: 88, lastSeen: "4h ago" },
  { name: "Zarina Kuanysh", risk: "high", activity: 41, lastSeen: "3d ago" },
  { name: "Timur Bek", risk: "medium", activity: 71, lastSeen: "12h ago" },
];

export function GroupDashboard() {
  const { t } = useI18n();
  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="text-lg font-semibold">{t("groupDashboard")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Student risk overview · {ROWS.length} students</p>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface/50">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("studentName")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("riskLevel")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("activity")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("lastSeen")}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className="border-t border-border animate-fade-in-up">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3"><RiskPill risk={r.risk} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className={cn("h-full rounded-full",
                            r.activity >= 70 ? "bg-success" : r.activity >= 50 ? "bg-warning" : "bg-danger")}
                          style={{ width: `${r.activity}%` }}
                        />
                      </div>
                      <span className="font-mono text-[12px] text-muted-foreground">{r.activity}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RiskPill({ risk }: { risk: "low" | "medium" | "high" }) {
  const { t } = useI18n();
  const map = {
    low: { cls: "bg-success/15 text-success ring-success/30", dot: "bg-success", label: t("low") },
    medium: { cls: "bg-warning/15 text-warning ring-warning/30", dot: "bg-warning", label: t("medium") },
    high: { cls: "bg-danger/15 text-danger ring-danger/30", dot: "bg-danger", label: t("high") },
  }[risk];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", map.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", map.dot)} />
      {map.label}
    </span>
  );
}

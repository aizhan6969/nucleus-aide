import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Event = { id: string; title: string; type: string; starts_at: string; notes: string | null };

const TYPES = ["exam", "deadline", "meeting", "project"] as const;

export function CalendarPanel() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("deadline");

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_events").select("*")
      .eq("user_id", user.id).order("starts_at", { ascending: true });
    if (error) toast.error(error.message);
    else setEvents((data ?? []) as Event[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function add() {
    if (!user || !title.trim() || !date) return;
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id, title: title.trim(), type, starts_at: new Date(date).toISOString(),
    });
    if (error) toast.error(error.message);
    else { setTitle(""); setDate(""); setAdding(false); load(); }
  }

  async function remove(id: string) {
    await supabase.from("calendar_events").delete().eq("id", id);
    setEvents((e) => e.filter((x) => x.id !== id));
  }

  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date(Date.now() - 86400000));
  const weekAhead = upcoming.filter((e) => new Date(e.starts_at).getTime() - Date.now() < 7 * 86400000).length;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("smartCalendar")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("smartCalendarHint")}</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("addEvent")}
          </button>
        </div>

        {weekAhead >= 2 && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            ⚡ {t("aiAdvice").replace("{n}", String(weekAhead))}
          </div>
        )}

        {adding && (
          <div className="mt-4 animate-fade-in-up rounded-xl border border-border bg-surface/60 p-4 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("eventTitle")} className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60" />
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60" />
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60">
              {TYPES.map((tp) => <option key={tp} value={tp}>{t(tp as any)}</option>)}
            </select>
            <button onClick={add} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("save")}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {loading && <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!loading && upcoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center text-sm text-muted-foreground">
              {t("noEvents")}
            </div>
          )}
          {upcoming.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-elevated text-center">
                <div className="text-[10px] uppercase text-muted-foreground">{new Date(e.starts_at).toLocaleDateString(lang === "kz" ? "kk" : lang, { month: "short" })}</div>
                <div className="text-sm font-semibold leading-none">{new Date(e.starts_at).getDate()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="text-[11px] text-muted-foreground">{t(e.type as any) || e.type}</div>
              </div>
              <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

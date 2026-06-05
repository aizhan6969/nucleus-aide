import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Profile = {
  full_name: string; bio: string; university: string;
  major: string; year: string; interests: string[]; skills: string[];
};

export function ProfilePanel() {
  const { user, updateProfile } = useAuth();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [p, setP] = useState<Profile>({
    full_name: "", bio: "", university: "", major: "", year: "", interests: [], skills: [],
  });
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setP({
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          university: data.university ?? "",
          major: data.major ?? "",
          year: data.year ?? "",
          interests: (data.interests as string[] | null) ?? [],
          skills: (data.skills as string[] | null) ?? [],
        });
        setAvatar(data.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      await updateProfile({ full_name: p.full_name });
      toast.success(t("saved"));
    }
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}?t=${Date.now()}`;
    const cleanPath = path.split("?")[0];
    const { error: upErr } = await supabase.storage.from("avatars").upload(cleanPath, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(cleanPath);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setAvatar(url);
    setUploading(false);
    toast.success(t("saved"));
  }

  if (loading) return <div className="grid h-full place-items-center text-sm text-muted-foreground">…</div>;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("profile")}</h1>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface/60 p-4">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-surface-elevated text-lg font-medium ring-1 ring-border">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (p.full_name[0] ?? "U").toUpperCase()}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div>
            <div className="text-base font-semibold">{p.full_name || user?.email}</div>
            <div className="text-[12px] text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <Section title={t("aboutYou")}>
          <Field label={t("fullName")} value={p.full_name} onChange={(v) => setP({ ...p, full_name: v })} />
          <TextArea label={t("bio")} value={p.bio} onChange={(v) => setP({ ...p, bio: v })} />
        </Section>

        <Section title={t("education")}>
          <Field label={t("university")} value={p.university} onChange={(v) => setP({ ...p, university: v })} />
          <Field label={t("major")} value={p.major} onChange={(v) => setP({ ...p, major: v })} />
          <Field label={t("yearOfStudy")} value={p.year} onChange={(v) => setP({ ...p, year: v })} placeholder="e.g. 2nd year" />
        </Section>

        <Section title={t("interestsAndSkills")}>
          <TagsField label={t("interests")} values={p.interests} onChange={(v) => setP({ ...p, interests: v })} placeholder={t("addTag")} />
          <TagsField label={t("skills")} values={p.skills} onChange={(v) => setP({ ...p, skills: v })} placeholder={t("addTag")} />
        </Section>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </button>
        </div>
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
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] text-muted-foreground">{label}</div>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60" />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] text-muted-foreground">{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60" />
    </label>
  );
}
function TagsField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="mb-1 text-[12px] text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button key={v} onClick={() => onChange(values.filter((x) => x !== v))}
            className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[12px] text-primary ring-1 ring-primary/25 hover:bg-primary/25">
            {v} ×
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className="block h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60" />
        <button onClick={add} className="h-9 rounded-md border border-border bg-surface px-3 text-sm hover:border-primary/40">+</button>
      </div>
    </div>
  );
}

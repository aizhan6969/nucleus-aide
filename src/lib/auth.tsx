import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Role = "student" | "teacher";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  ready: boolean;
  needsRole: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ needsConfirmation: boolean }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (patch: { full_name?: string }) => Promise<void>;
  setRoleForNewUser: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function loadProfile(session: Session): Promise<{ user: User | null; needsRole: boolean }> {
  const authUser = session.user;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) console.warn("[auth] profile fetch error", error.message);

  const meta = (authUser.user_metadata ?? {}) as Record<string, any>;
  const fallbackName =
    meta.full_name ?? meta.name ?? authUser.email?.split("@")[0] ?? "User";
  const fallbackAvatar = (meta.avatar_url ?? meta.picture ?? null) as string | null;

  if (!profile) {
    // No profile row yet. If sign-up specified a role in metadata, create it now.
    const metaRole = (meta.role as Role | undefined);
    if (metaRole === "student" || metaRole === "teacher") {
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({
          id: authUser.id,
          full_name: fallbackName,
          role: metaRole,
          avatar_url: fallbackAvatar,
        })
        .select("id, full_name, role, avatar_url")
        .single();
      if (insErr) console.warn("[auth] profile create error", insErr.message);
      if (created) {
        return {
          user: {
            id: created.id,
            name: created.full_name ?? fallbackName,
            email: authUser.email ?? "",
            role: created.role as Role,
            avatarUrl: created.avatar_url,
          },
          needsRole: false,
        };
      }
    }
    // Google sign-in or unknown — needs role selection
    return {
      user: {
        id: authUser.id,
        name: fallbackName,
        email: authUser.email ?? "",
        role: "student",
        avatarUrl: fallbackAvatar,
      },
      needsRole: true,
    };
  }

  return {
    user: {
      id: profile.id,
      name: profile.full_name ?? fallbackName,
      email: authUser.email ?? "",
      role: (profile.role as Role) ?? "student",
      avatarUrl: profile.avatar_url ?? fallbackAvatar,
    },
    needsRole: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [needsRole, setNeedsRole] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      setSession(sess);
      if (sess) {
        // defer non-auth supabase calls
        setTimeout(async () => {
          const { user: u, needsRole: nr } = await loadProfile(sess);
          if (!active) return;
          setUser(u);
          setNeedsRole(nr);
        }, 0);
      } else {
        setUser(null);
        setNeedsRole(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        const { user: u, needsRole: nr } = await loadProfile(data.session);
        if (!active) return;
        setUser(u);
        setNeedsRole(nr);
      }
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function register(name: string, email: string, password: string, role: Role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name, role },
      },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async function updateProfile(patch: { full_name?: string }) {
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, name: patch.full_name ?? user.name });
  }

  async function setRoleForNewUser(role: Role) {
    if (!session) throw new Error("Not signed in");
    const authUser = session.user;
    const meta = (authUser.user_metadata ?? {}) as Record<string, any>;
    const fallbackName = meta.full_name ?? meta.name ?? authUser.email?.split("@")[0] ?? "User";
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: authUser.id,
        full_name: fallbackName,
        role,
        avatar_url: (meta.avatar_url ?? meta.picture ?? null) as string | null,
      })
      .select("id, full_name, role, avatar_url")
      .single();
    if (error) throw error;
    setUser({
      id: data.id,
      name: data.full_name ?? fallbackName,
      email: authUser.email ?? "",
      role: data.role as Role,
      avatarUrl: data.avatar_url,
    });
    setNeedsRole(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setNeedsRole(false);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        ready,
        needsRole,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        updatePassword,
        updateProfile,
        setRoleForNewUser,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

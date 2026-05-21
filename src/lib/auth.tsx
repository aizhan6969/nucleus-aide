import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "teacher";
export type User = { id: string; name: string; email: string; role: Role };

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: Role) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "mynderek.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  function persist(u: User | null) {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
    setUser(u);
  }

  async function login(email: string, password: string) {
    if (!email || !password) throw new Error("Missing credentials");
    // mock: try to reuse role from a previously registered user with same email
    let role: Role = "student";
    let name = email.split("@")[0];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const prev = JSON.parse(raw) as User;
        if (prev.email === email) { role = prev.role; name = prev.name; }
      }
    } catch {}
    const u: User = { id: crypto.randomUUID(), email, name, role };
    persist(u);
    return u;
  }

  async function register(name: string, email: string, password: string, role: Role) {
    if (!name || !email || !password) throw new Error("Missing fields");
    const u: User = { id: crypto.randomUUID(), name, email, role };
    persist(u);
    return u;
  }

  function logout() { persist(null); }

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

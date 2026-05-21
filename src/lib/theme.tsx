import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("mynderek.theme") as Theme | null) ?? "dark";
    apply(stored);
    setThemeState(stored);
  }, []);

  function apply(t: Theme) {
    const root = document.documentElement;
    root.classList.toggle("light", t === "light");
    root.classList.toggle("dark", t === "dark");
  }

  function setTheme(t: Theme) {
    localStorage.setItem("mynderek.theme", t);
    apply(t);
    setThemeState(t);
  }

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme outside provider");
  return c;
}

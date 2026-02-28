"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lightfeed-theme";
const ThemeContext = createContext(null);

function applyTheme(theme) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.setAttribute("data-theme", resolvedTheme);
  try {
    localStorage.setItem(STORAGE_KEY, resolvedTheme);
  } catch (_error) {
    // Ignore storage errors so theme toggling still works.
  }
}

function readInitialTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  if (document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        const resolvedTheme = nextTheme === "dark" ? "dark" : "light";
        setTheme(resolvedTheme);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}

"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(current);
    }
  }, []);

  function toggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      window.localStorage.setItem("pt-theme", next);
    } catch {
      // Storage blocked in private mode; DOM attribute remains active.
    }
  }

  const nextLabel =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      data-testid="theme-toggle"
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-pt-border bg-pt-surface text-pt-ink transition-colors hover:border-pt-border-strong hover:bg-pt-silver"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "dark"
            ? "scale-100 opacity-100 blur-0"
            : "pointer-events-none absolute scale-50 opacity-0 blur-[2px]"
        }`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "light"
            ? "scale-100 opacity-100 blur-0"
            : "pointer-events-none absolute scale-50 opacity-0 blur-[2px]"
        }`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
      </svg>
    </button>
  );
}

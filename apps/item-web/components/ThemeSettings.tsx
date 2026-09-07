"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let initial: Theme = "dark";
    try { initial = window.localStorage.getItem("aetimm-theme") === "light" ? "light" : "dark"; } catch { /* Keep appearance usable without storage. */ }
    setTheme(initial);
    document.documentElement.dataset.aetimmTheme = initial;
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.aetimmTheme = next;
    try { window.localStorage.setItem("aetimm-theme", next); } catch { /* Keep the in-session choice. */ }
  }

  return (
    <div className="theme-settings">
      <button type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          {theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 13.4A8.6 8.6 0 0 1 10.6 3.5a8.6 8.6 0 1 0 9.9 9.9Z" />}
        </svg>
      </button>
    </div>
  );
}

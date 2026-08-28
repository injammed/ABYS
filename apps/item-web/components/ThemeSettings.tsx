"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const LIGHT_CSS = `
html[data-aetimm-theme="light"] { color-scheme: light; --bg:#fff; --panel:#fff; --panel-2:#f7faff; --line:#cbdcf5; --text:#071426; --muted:#52657d; --gold:#1267d6; --gold-light:#0a55b5; --slime:#1267d6; }
html[data-aetimm-theme="light"] body { background:#fff !important; color:var(--text); }
html[data-aetimm-theme="light"] .site-header, html[data-aetimm-theme="light"] .primary-navigation, html[data-aetimm-theme="light"] .artifact-card, html[data-aetimm-theme="light"] .upload-panel { background:#fff !important; box-shadow:none !important; backdrop-filter:none !important; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:first-child { visibility:visible !important; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:not(:first-child) { visibility:hidden !important; }
html[data-aetimm-theme="light"] .feed-first-live, html[data-aetimm-theme="light"] .machine-gloss { display:none !important; }
html[data-aetimm-theme="light"] button, html[data-aetimm-theme="light"] a { text-shadow:none !important; }
.theme-settings { position:relative; }
.theme-settings > button { border:1px solid var(--line); background:transparent; color:var(--text); border-radius:999px; padding:.55rem .72rem; cursor:pointer; }
.theme-settings-panel { position:absolute; right:0; bottom:calc(100% + .55rem); display:flex; gap:.35rem; padding:.4rem; border:1px solid var(--line); border-radius:999px; background:var(--panel); z-index:80; }
.theme-settings-panel button { border:0; border-radius:999px; background:transparent; color:var(--muted); padding:.45rem .7rem; cursor:pointer; }
.theme-settings-panel button[aria-pressed="true"] { background:var(--text); color:var(--bg); }
`;

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("aetimm-theme");
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.dataset.aetimmTheme = initial;
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    setOpen(false);
    document.documentElement.dataset.aetimmTheme = next;
    window.localStorage.setItem("aetimm-theme", next);
  }

  return (
    <div className="theme-settings">
      <style>{LIGHT_CSS}</style>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Settings">⚙</button>
      {open && (
        <div className="theme-settings-panel" aria-label="Appearance">
          <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>DARK</button>
          <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>LIGHT</button>
        </div>
      )}
    </div>
  );
}

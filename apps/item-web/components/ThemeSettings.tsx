"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const LIGHT_CSS = `
:root { --ui-radius:18px; --ui-radius-sm:12px; --ui-ease:160ms cubic-bezier(.2,.8,.2,1); }
body { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
.site-header, .primary-navigation, .artifact-card, .upload-panel, .primary-mode-switch, .primary-utility-rail { transition:border-color var(--ui-ease), background var(--ui-ease), box-shadow var(--ui-ease); }
.site-header { border-bottom-color:rgba(255,255,255,.09); }
.artifact-card { border-radius:var(--ui-radius); border-color:rgba(255,255,255,.10); box-shadow:0 18px 55px rgba(0,0,0,.24); }
.artifact-body { padding:clamp(1rem,2vw,1.25rem); }
.primary-mode-switch, .primary-utility-rail { border-radius:var(--ui-radius); }
.primary-mode-link, .primary-navigation-link, .theme-settings > button, .upload-trigger, .submit-button { min-height:44px; border-radius:999px; transition:border-color var(--ui-ease), background var(--ui-ease), color var(--ui-ease), box-shadow var(--ui-ease); }
.primary-mode-link:hover, .primary-navigation-link:hover, .theme-settings > button:hover, .upload-trigger:hover { border-color:rgba(255,255,255,.30); }
.theme-settings { position:relative; }
.theme-settings > button { width:44px; border:1px solid var(--line); background:rgba(255,255,255,.025); color:var(--text); cursor:pointer; }
.theme-settings-panel { position:absolute; right:0; bottom:calc(100% + .65rem); display:flex; gap:.3rem; padding:.35rem; border:1px solid var(--line); border-radius:999px; background:color-mix(in srgb, var(--panel) 94%, transparent); box-shadow:0 18px 50px rgba(0,0,0,.28); backdrop-filter:blur(18px); z-index:80; }
.theme-settings-panel button { min-height:36px; border:0; border-radius:999px; background:transparent; color:var(--muted); padding:.45rem .75rem; cursor:pointer; font-size:.72rem; font-weight:700; letter-spacing:.08em; }
.theme-settings-panel button[aria-pressed="true"] { background:var(--text); color:var(--bg); }

html:not([data-aetimm-theme="light"]) .site-header { background:rgba(5,5,5,.76); backdrop-filter:blur(22px) saturate(120%); }
html:not([data-aetimm-theme="light"]) .primary-navigation { background:linear-gradient(180deg,rgba(5,5,5,.70),rgba(5,5,5,.92)); backdrop-filter:blur(24px) saturate(125%); }
html:not([data-aetimm-theme="light"]) .artifact-card { background:linear-gradient(180deg,rgba(16,16,16,.96),rgba(8,8,8,.98)); }
html:not([data-aetimm-theme="light"]) .artifact-card:hover { border-color:rgba(213,166,63,.26); box-shadow:0 24px 70px rgba(0,0,0,.34), 0 0 0 1px rgba(213,166,63,.04); }

html[data-aetimm-theme="light"] { color-scheme:light; --bg:#f8fbff; --panel:#fff; --panel-2:#f2f7fd; --line:#d9e5f3; --text:#081526; --muted:#60738a; --gold:#0b69e3; --gold-light:#0758c2; --slime:#0b69e3; }
html[data-aetimm-theme="light"] body { background:linear-gradient(#fbfdff,#f4f8fd) !important; color:var(--text); }
html[data-aetimm-theme="light"] body::before { content:""; position:fixed; inset:0; pointer-events:none; background:linear-gradient(rgba(11,105,227,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(11,105,227,.035) 1px,transparent 1px); background-size:48px 48px; mask-image:linear-gradient(to bottom,black,transparent 78%); }
html[data-aetimm-theme="light"] .site-header { background:rgba(255,255,255,.86) !important; border-bottom-color:#e3ebf5; box-shadow:0 1px 0 rgba(8,21,38,.02); backdrop-filter:blur(18px) saturate(125%) !important; }
html[data-aetimm-theme="light"] .primary-navigation { background:rgba(255,255,255,.92) !important; border-color:#dce7f3 !important; box-shadow:0 -10px 40px rgba(26,63,105,.08) !important; backdrop-filter:blur(20px) saturate(120%) !important; }
html[data-aetimm-theme="light"] .artifact-card { background:#fff !important; border-color:#dce6f1 !important; box-shadow:0 16px 44px rgba(33,73,118,.09) !important; outline:0; }
html[data-aetimm-theme="light"] .artifact-card:hover { border-color:#b8d2ef !important; box-shadow:0 20px 55px rgba(33,73,118,.13) !important; }
html[data-aetimm-theme="light"] .upload-panel { background:#fff !important; border-color:#dbe6f2 !important; box-shadow:0 24px 70px rgba(31,71,115,.14) !important; backdrop-filter:none !important; }
html[data-aetimm-theme="light"] .upload-panel input:not([type="checkbox"]), html[data-aetimm-theme="light"] .upload-panel textarea { background:#f9fbfe !important; color:var(--text) !important; border-color:var(--line) !important; }
html[data-aetimm-theme="light"] .upload-trigger, html[data-aetimm-theme="light"] .submit-button { background:#0b69e3 !important; border-color:#0b69e3 !important; color:#fff !important; box-shadow:0 7px 18px rgba(11,105,227,.18); }
html[data-aetimm-theme="light"] .primary-mode-link.active { background:#edf5ff !important; border-color:#bad5f4 !important; color:#0758c2 !important; }
html[data-aetimm-theme="light"] .primary-navigation-link, html[data-aetimm-theme="light"] .theme-settings > button { background:#fff; border-color:#dce6f1; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:first-child { visibility:visible !important; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:not(:first-child) { visibility:hidden !important; }
html[data-aetimm-theme="light"] .feed-first-live, html[data-aetimm-theme="light"] .machine-gloss { display:none !important; }
html[data-aetimm-theme="light"] button, html[data-aetimm-theme="light"] a { text-shadow:none !important; }
html[data-aetimm-theme="light"] .artifact-card h2, html[data-aetimm-theme="light"] .site-header h1 { letter-spacing:-.02em; font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
html[data-aetimm-theme="light"] .summary { color:#425870; }
html[data-aetimm-theme="light"] .provenance, html[data-aetimm-theme="light"] .judge { background:#f8fbff; border-color:#dde7f2; }

@media (prefers-reduced-motion: reduce) { .site-header, .primary-navigation, .artifact-card, .upload-panel, .primary-mode-switch, .primary-utility-rail, .primary-mode-link, .primary-navigation-link, .theme-settings > button, .upload-trigger, .submit-button { transition:none !important; } }
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

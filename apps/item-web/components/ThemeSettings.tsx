"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const LIGHT_CSS = `
:root { --ui-radius:18px; --ui-radius-sm:12px; --ui-ease:160ms cubic-bezier(.2,.8,.2,1); }
body { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
.site-header, .primary-navigation, .artifact-card, .upload-panel, .primary-mode-switch, .primary-utility-rail { transition:border-color var(--ui-ease), background var(--ui-ease), box-shadow var(--ui-ease); }
.site-header { border-bottom-color:rgba(255,255,255,.07); }
.artifact-card { border-radius:var(--ui-radius); border-color:rgba(255,255,255,.08); box-shadow:0 14px 44px rgba(0,0,0,.18); }
.artifact-body { padding:clamp(1rem,2vw,1.25rem); }
.primary-mode-switch, .primary-utility-rail { border-radius:var(--ui-radius); box-shadow:none; }
.primary-mode-link, .primary-navigation-link, .theme-settings > button, .upload-trigger, .submit-button { min-height:44px; border-radius:999px; transition:border-color var(--ui-ease), background var(--ui-ease), color var(--ui-ease), box-shadow var(--ui-ease), opacity var(--ui-ease); }
.primary-mode-link:not(.active), .primary-navigation-link { opacity:.76; }
.primary-mode-link:not(.active):hover, .primary-navigation-link:hover { opacity:1; }
.primary-mode-link:hover, .primary-navigation-link:hover, .theme-settings > button:hover, .upload-trigger:hover { border-color:rgba(255,255,255,.24); }
.theme-settings { position:relative; }
.theme-settings > button { width:44px; border:1px solid var(--line); background:rgba(255,255,255,.018); color:var(--text); cursor:pointer; }
.theme-settings-panel { position:absolute; right:0; bottom:calc(100% + .65rem); display:flex; gap:.3rem; padding:.35rem; border:1px solid var(--line); border-radius:999px; background:color-mix(in srgb, var(--panel) 96%, transparent); box-shadow:0 14px 36px rgba(0,0,0,.22); backdrop-filter:blur(18px); z-index:80; }
.theme-settings-panel button { min-height:36px; border:0; border-radius:999px; background:transparent; color:var(--muted); padding:.45rem .75rem; cursor:pointer; font-size:.72rem; font-weight:700; letter-spacing:.08em; }
.theme-settings-panel button[aria-pressed="true"] { background:var(--text); color:var(--bg); }

html:not([data-aetimm-theme="light"]) .site-header { background:rgba(5,5,5,.70); backdrop-filter:blur(20px) saturate(112%); }
html:not([data-aetimm-theme="light"]) .primary-navigation { background:rgba(5,5,5,.88); border-color:rgba(255,255,255,.08); backdrop-filter:blur(22px) saturate(115%); box-shadow:none; }
html:not([data-aetimm-theme="light"]) .artifact-card { background:linear-gradient(180deg,rgba(14,14,14,.97),rgba(8,8,8,.99)); }
html:not([data-aetimm-theme="light"]) .artifact-card:hover { border-color:rgba(213,166,63,.20); box-shadow:0 18px 52px rgba(0,0,0,.28); }
html:not([data-aetimm-theme="light"]) .primary-mode-link.active { border-color:rgba(213,166,63,.24); }

html[data-aetimm-theme="light"] { color-scheme:light; --bg:#f8fbff; --panel:#fff; --panel-2:#f2f7fd; --line:#e1e9f2; --text:#081526; --muted:#60738a; --gold:#0b69e3; --gold-light:#0758c2; --slime:#0b69e3; }
html[data-aetimm-theme="light"] body { background:#fbfdff !important; color:var(--text); }
html[data-aetimm-theme="light"] body::before { content:""; position:fixed; inset:0; pointer-events:none; background:linear-gradient(rgba(11,105,227,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,105,227,.022) 1px,transparent 1px); background-size:48px 48px; mask-image:linear-gradient(to bottom,black,transparent 72%); }
html[data-aetimm-theme="light"] .site-header { background:rgba(255,255,255,.90) !important; border-bottom-color:#e8eef5; box-shadow:none !important; backdrop-filter:blur(16px) saturate(115%) !important; }
html[data-aetimm-theme="light"] .primary-navigation { background:rgba(255,255,255,.94) !important; border-color:#e3ebf4 !important; box-shadow:0 -1px 0 rgba(20,50,85,.04) !important; backdrop-filter:blur(18px) saturate(112%) !important; }
html[data-aetimm-theme="light"] .artifact-card { background:#fff !important; border-color:#e3eaf2 !important; box-shadow:0 8px 24px rgba(33,73,118,.055) !important; outline:0; }
html[data-aetimm-theme="light"] .artifact-card:hover { border-color:#c9dced !important; box-shadow:0 12px 30px rgba(33,73,118,.075) !important; }
html[data-aetimm-theme="light"] .upload-panel { background:#fff !important; border-color:#dfe8f1 !important; box-shadow:0 18px 50px rgba(31,71,115,.10) !important; backdrop-filter:none !important; }
html[data-aetimm-theme="light"] .upload-panel input:not([type="checkbox"]), html[data-aetimm-theme="light"] .upload-panel textarea { background:#fbfdff !important; color:var(--text) !important; border-color:var(--line) !important; }
html[data-aetimm-theme="light"] .upload-trigger, html[data-aetimm-theme="light"] .submit-button { background:#0b69e3 !important; border-color:#0b69e3 !important; color:#fff !important; box-shadow:0 5px 14px rgba(11,105,227,.15); }
html[data-aetimm-theme="light"] .primary-mode-link.active { background:#f1f7ff !important; border-color:#c7dcf2 !important; color:#0758c2 !important; opacity:1; }
html[data-aetimm-theme="light"] .primary-navigation-link, html[data-aetimm-theme="light"] .theme-settings > button { background:transparent; border-color:#e2e9f1; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:first-child { visibility:visible !important; }
html[data-aetimm-theme="light"] [data-lexicon-flicker] [aria-hidden="true"] > span:not(:first-child) { visibility:hidden !important; }
html[data-aetimm-theme="light"] .feed-first-live, html[data-aetimm-theme="light"] .machine-gloss { display:none !important; }
html[data-aetimm-theme="light"] button, html[data-aetimm-theme="light"] a { text-shadow:none !important; }
html[data-aetimm-theme="light"] .artifact-card h2, html[data-aetimm-theme="light"] .site-header h1 { letter-spacing:-.02em; font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
html[data-aetimm-theme="light"] .summary { color:#425870; }
html[data-aetimm-theme="light"] .provenance, html[data-aetimm-theme="light"] .judge { background:#fbfdff; border-color:#e3eaf2; }

@media (max-width:760px) {
  .primary-navigation { left:.45rem !important; right:.45rem !important; bottom:calc(env(safe-area-inset-bottom) + .35rem) !important; width:auto !important; min-height:54px; display:grid !important; grid-template-columns:repeat(6,minmax(0,1fr)); align-items:stretch; gap:0 !important; padding:.28rem !important; border-radius:18px !important; overflow:visible !important; }
  .primary-mode-switch, .primary-utility-rail { display:contents !important; }
  .primary-mode-link, .primary-navigation-link, .primary-navigation-action, .theme-settings { min-width:0 !important; width:100% !important; height:48px !important; min-height:48px !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:13px !important; display:grid !important; place-items:center !important; }
  .primary-mode-link > span:last-child, .primary-navigation-link [data-lexicon-flicker] { display:none !important; }
  .primary-navigation-mark { margin:0 !important; font-size:1.25rem !important; line-height:1 !important; }
  .primary-navigation-submit .upload-trigger, .primary-navigation-account button, .primary-navigation-account a, .theme-settings > button { width:100% !important; height:48px !important; min-height:48px !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:13px !important; box-shadow:none !important; display:grid !important; place-items:center !important; background:transparent !important; }
  .primary-navigation-submit .upload-trigger { font-size:0 !important; color:var(--text) !important; }
  .primary-navigation-submit .upload-trigger::before { content:"＋"; font-size:1.45rem; line-height:1; font-weight:300; }
  .primary-navigation-account button, .primary-navigation-account a { font-size:0 !important; color:var(--text) !important; }
  .primary-navigation-account button::before, .primary-navigation-account a::before { content:"◯"; font-size:1.18rem; line-height:1; }
  .theme-settings-panel { right:0; bottom:calc(100% + .45rem); }
  .primary-mode-link.active { background:rgba(213,166,63,.10) !important; }
  html[data-aetimm-theme="light"] .primary-navigation { background:rgba(255,255,255,.97) !important; box-shadow:0 -1px 0 rgba(20,50,85,.05) !important; }
  html[data-aetimm-theme="light"] .primary-mode-link.active { background:#edf5ff !important; }
}

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

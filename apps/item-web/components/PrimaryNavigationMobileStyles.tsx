export function PrimaryNavigationMobileStyles() {
  return (
    <style>{`
      @media (max-width: 760px) {
        .primary-navigation {
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          min-height: calc(70px + env(safe-area-inset-bottom)) !important;
          display: grid !important;
          grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          align-items: start !important;
          gap: 0 !important;
          padding: 7px 6px calc(7px + env(safe-area-inset-bottom)) !important;
          border: 0 !important;
          border-top: 1px solid rgba(255,255,255,.10) !important;
          border-radius: 0 !important;
          overflow: visible !important;
          box-shadow: 0 -10px 30px rgba(0,0,0,.16) !important;
        }
        .primary-mode-switch, .primary-utility-rail { display: contents !important; }
        .primary-mode-link, .primary-navigation-link, .primary-navigation-action, .theme-settings {
          width:100% !important; min-width:0 !important; height:56px !important; min-height:56px !important;
          margin:0 !important; padding:0 !important; border:0 !important; border-radius:12px !important;
          background:transparent !important; box-shadow:none !important; display:grid !important; place-items:center !important; opacity:1 !important;
        }
        .primary-mode-link > span:last-child, .primary-navigation-link [data-lexicon-flicker], .primary-navigation-submit .upload-trigger > *, .primary-navigation-account button > *, .primary-navigation-account a > * { display:none !important; }
        .primary-navigation-mark, .primary-navigation-submit .upload-trigger, .primary-navigation-account button, .primary-navigation-account a, .theme-settings > button {
          width:100% !important; height:56px !important; min-height:56px !important; margin:0 !important; padding:0 !important; border:0 !important;
          border-radius:12px !important; background:transparent !important; box-shadow:none !important; color:var(--muted) !important;
          display:grid !important; grid-template-rows:30px 16px !important; place-items:center !important; font-size:0 !important; line-height:1 !important;
        }
        .primary-navigation-mark::after, .primary-navigation-submit .upload-trigger::after, .primary-navigation-account button::after, .primary-navigation-account a::after, .theme-settings > button::after {
          font-size:.62rem !important; font-weight:650 !important; letter-spacing:.03em !important; line-height:1 !important; color:currentColor !important;
        }
        .primary-mode-feed .primary-navigation-mark::before { content:"≋"; font-size:1.45rem; }
        .primary-mode-feed .primary-navigation-mark::after { content:"TROUGH"; }
        .primary-mode-museum .primary-navigation-mark::before { content:"◇"; font-size:1.45rem; }
        .primary-mode-museum .primary-navigation-mark::after { content:"MUSEUM"; }
        .primary-navigation-submit .upload-trigger::before {
          content:"+"; width:34px; height:28px; display:grid; place-items:center; border:1px solid currentColor; border-radius:9px;
          font-size:1.65rem; font-weight:300; line-height:1; color:var(--text);
        }
        .primary-navigation-submit .upload-trigger::after { content:"UPLOAD"; }
        .primary-navigation-link::before { content:"i"; font-family:Georgia,serif; font-size:1.45rem; line-height:1; color:currentColor; }
        .primary-navigation-link::after { content:"ABOUT"; font-size:.62rem; font-weight:650; letter-spacing:.03em; line-height:1; color:currentColor; }
        .theme-settings > button::before { content:"⚙"; font-size:1.28rem; line-height:1; }
        .theme-settings > button::after { content:"MODE"; }
        .primary-navigation-account button::before, .primary-navigation-account a::before { content:"○"; font-size:1.5rem; line-height:1; }
        .primary-navigation-account button::after, .primary-navigation-account a::after { content:"ACCOUNT"; }
        .primary-mode-link.active, .primary-navigation-submit .upload-trigger[aria-expanded="true"] { color:var(--text) !important; background:rgba(255,255,255,.055) !important; }
        .theme-settings-panel { right:.35rem !important; bottom:calc(100% + .55rem) !important; }
        html[data-aetimm-theme="light"] .primary-navigation { background:rgba(255,255,255,.97) !important; border-top-color:#e3ebf4 !important; box-shadow:0 -8px 24px rgba(31,71,115,.08) !important; }
        html[data-aetimm-theme="light"] .primary-mode-link.active, html[data-aetimm-theme="light"] .primary-navigation-submit .upload-trigger[aria-expanded="true"] { background:#edf5ff !important; color:#0758c2 !important; }
      }
    `}</style>
  );
}

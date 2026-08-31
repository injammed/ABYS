export function PrimaryNavigationMobileStyles() {
  return (
    <style>{`
      @media (max-width: 760px) {
        .primary-navigation {
          position: fixed !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          transform: none !important;
          width: 100% !important;
          min-height: calc(58px + env(safe-area-inset-bottom)) !important;
          display: grid !important;
          grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          align-items: start !important;
          gap: 0 !important;
          margin: 0 !important;
          padding: 4px 6px calc(4px + env(safe-area-inset-bottom)) !important;
          border: 0 !important;
          border-top: 1px solid rgba(255,255,255,.10) !important;
          border-radius: 0 !important;
          overflow: visible !important;
          box-shadow: 0 -4px 18px rgba(0,0,0,.12) !important;
          z-index: 70 !important;
        }
        .primary-mode-switch, .primary-utility-rail { display: contents !important; }
        .primary-mode-link, .primary-navigation-link, .primary-navigation-action, .theme-settings {
          width:100% !important; min-width:0 !important; height:50px !important; min-height:50px !important;
          margin:0 !important; padding:0 !important; border:0 !important; border-radius:10px !important;
          background:transparent !important; box-shadow:none !important; display:grid !important; place-items:center !important; opacity:1 !important;
        }
        .primary-mode-link > span:last-child, .primary-navigation-link [data-lexicon-flicker], .primary-navigation-submit .upload-trigger > *, .primary-navigation-account button > *, .primary-navigation-account a > * { display:none !important; }
        .primary-navigation-mark, .primary-navigation-submit .upload-trigger, .primary-navigation-account button, .primary-navigation-account a, .theme-settings > button {
          width:100% !important; height:50px !important; min-height:50px !important; margin:0 !important; padding:0 !important; border:0 !important;
          border-radius:10px !important; background:transparent !important; box-shadow:none !important; color:var(--muted) !important;
          display:grid !important; grid-template-rows:27px 13px !important; place-items:center !important; font-size:0 !important; line-height:1 !important;
        }
        .primary-navigation-mark::after, .primary-navigation-submit .upload-trigger::after, .primary-navigation-account button::after, .primary-navigation-account a::after, .theme-settings > button::after {
          font-size:.56rem !important; font-weight:650 !important; letter-spacing:.025em !important; line-height:1 !important; color:currentColor !important;
        }
        .primary-mode-feed .primary-navigation-mark::before { content:"≋"; font-size:1.3rem; }
        .primary-mode-feed .primary-navigation-mark::after { content:"TROUGH"; }
        .primary-mode-museum .primary-navigation-mark::before { content:"◇"; font-size:1.3rem; }
        .primary-mode-museum .primary-navigation-mark::after { content:"MUSEUM"; }
        .primary-navigation-submit .upload-trigger::before { content:"+"; font-size:1.65rem; font-weight:300; line-height:1; color:var(--text); }
        .primary-navigation-submit .upload-trigger::after { content:"UPLOAD"; }
        .primary-navigation-link::before { content:"i"; font-family:Georgia,serif; font-size:1.28rem; line-height:1; color:currentColor; }
        .primary-navigation-link::after { content:"ABOUT"; font-size:.56rem; font-weight:650; letter-spacing:.025em; line-height:1; color:currentColor; }
        .theme-settings > button::before { content:"⚙"; font-size:1.14rem; line-height:1; }
        .theme-settings > button::after { content:"MODE"; }
        .primary-navigation-account button::before, .primary-navigation-account a::before { content:"○"; font-size:1.35rem; line-height:1; }
        .primary-navigation-account button::after, .primary-navigation-account a::after { content:"ACCOUNT"; }
        .primary-mode-link.active { color:var(--text) !important; }
        .primary-navigation .upload-panel {
          position:fixed !important; left:.5rem !important; right:.5rem !important; top:auto !important;
          bottom:calc(58px + env(safe-area-inset-bottom) + .5rem) !important; width:auto !important;
          max-height:calc(100dvh - 82px - env(safe-area-inset-bottom)) !important; overflow:auto !important;
        }
        .theme-settings-panel { right:.35rem !important; bottom:calc(100% + .4rem) !important; }
        html[data-aetimm-theme="light"] .primary-navigation { background:rgba(255,255,255,.98) !important; border-top-color:#e3ebf4 !important; box-shadow:0 -3px 14px rgba(31,71,115,.06) !important; }
        html[data-aetimm-theme="light"] .primary-mode-link.active { color:#0758c2 !important; }
      }
    `}</style>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const AETIMM_DONATION = "https://donate.stripe.com/9B600k6Djbx45V37Pj2Ry01";

export function DonationWelcome() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="aetimm-donation-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        background: "rgba(0,0,0,.82)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div style={{ width: "min(42rem, 100%)", border: "1px solid rgba(213,166,63,.55)", borderRadius: "1.25rem", padding: "clamp(1.2rem,4vw,2.25rem)", background: "#080808", boxShadow: "0 30px 120px rgba(0,0,0,.8)" }}>
        <p className="gallery-overline">AETIMM / PUBLIC SCRIPTURE / MATERIAL ABUNDANCE</p>
        <h1 id="aetimm-donation-title" style={{ margin: ".4rem 0 .8rem", fontFamily: "Georgia, serif", fontSize: "clamp(2.2rem,8vw,4.7rem)", fontWeight: 400, lineHeight: ".92" }}>Support the machine.</h1>
        <p style={{ color: "#c5c0b3", lineHeight: 1.6, maxWidth: "38rem" }}>The literature is public. Donations fund AETIMM’s long path from machine thought to machine-designed, engineered, fabricated, ordered and delivered physical goods.</p>
        <div style={{ display: "grid", gap: ".7rem", marginTop: "1.25rem" }}>
          <a href={AETIMM_DONATION} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.1rem", border: "1px solid rgba(213,166,63,.55)", borderRadius: ".8rem", color: "#ffe29a", textDecoration: "none" }}><strong>DONATE ANY AMOUNT</strong><span>∞ USD ↗</span></a>
          <Link href="/literature/item-0001/" onClick={() => setOpen(false)} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: ".9rem 1.1rem", border: "1px solid rgba(255,255,255,.12)", borderRadius: ".8rem", color: "inherit", textDecoration: "none" }}><span>Read ITEM 0001</span><span>Final Draft 3 ↗</span></Link>
          <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", color: "#a29d90", padding: ".65rem", cursor: "pointer" }}>Enter AETIMM without donating</button>
        </div>
      </div>
    </section>
  );
}

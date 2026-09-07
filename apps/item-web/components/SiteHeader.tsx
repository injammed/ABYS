import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { ThemeSettings } from "@/components/ThemeSettings";

export function SiteHeader({ mode }: { mode?: "feed" | "museum" }) {
  return (
    <header className="site-header gallery-header">
      <Link href="/" className="gallery-wordmark" aria-label="AETIMM — Slop Trough home">
        <span className="gallery-emblem" aria-hidden="true">◇</span>
        <span>AETIMM<small>SLOP TROUGH™</small></span>
      </Link>
      <nav className="primary-mode-switch" aria-label="Choose primary experience">
        <Link href="/#field" className={`primary-mode-link primary-mode-feed${mode === "feed" ? " active" : ""}`} aria-current={mode === "feed" ? "page" : undefined}>Trough</Link>
        <Link href="/aetimm/#museum" className={`primary-mode-link primary-mode-museum${mode === "museum" ? " active" : ""}`} aria-current={mode === "museum" ? "page" : undefined}>Museum</Link>
      </nav>
      <div className="primary-utility-rail">
        <Link href="/about/" className="gallery-about">About</Link>
        <ThemeSettings />
        <div className="gallery-account"><AccountGate /></div>
      </div>
    </header>
  );
}

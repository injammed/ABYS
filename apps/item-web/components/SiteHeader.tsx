import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { ThemeSettings } from "@/components/ThemeSettings";

export function SiteHeader({ mode }: { mode?: "feed" | "museum" | "argus" }) {
  return (
    <header className="site-header gallery-header">
      <Link href="/" className="gallery-wordmark" aria-label="AETIMM — home of Árgos">
        <span className="gallery-emblem" aria-hidden="true">◇</span>
        <span>AETIMM<small>HOME OF ÁRGOS</small></span>
      </Link>
      <nav className="primary-mode-switch" aria-label="Choose primary experience">
        <Link href="/argus/" className={`primary-mode-link${mode === "argus" ? " active" : ""}`} aria-current={mode === "argus" ? "page" : undefined}>Árgos</Link>
        <Link href="/#field" className={`primary-mode-link primary-mode-feed${mode === "feed" ? " active" : ""}`} aria-current={mode === "feed" ? "page" : undefined}>Field</Link>
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

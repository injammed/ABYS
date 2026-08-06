import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";

export default function HomePage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1">
      <header className="site-header feed-first-header">
        <a className="brand-lockup feed-first-brand" href="#field" aria-label="Return to the live feed">
          <div className="brand-mark" aria-hidden="true">◇</div>
          <div>
            <p className="eyebrow">SLOP TROUGH™</p>
            <h1>LIVE FIELD</h1>
          </div>
        </a>

        <div className="feed-first-live" aria-label="Live public artifact field">
          <span className="signal-dot" aria-hidden="true" />
          <span>Upload · Scroll · Vote · Museum</span>
          <Link className="upload-trigger header-link" href="/about/">
            What is this?
          </Link>
        </div>
      </header>

      <section id="field" className="feed-first-field" aria-label="Live Slop Trough artifact field">
        <ArtifactFeed />
      </section>

      <PrimaryNavigation />
    </main>
  );
}

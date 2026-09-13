import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmissionLandingBridge } from "@/components/SubmissionLandingBridge";

export default function HomePage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1" data-language-contract="legible-machine-gallery-v2" data-business-priority="apyoc">
      <SubmissionLandingBridge />
      <SiteHeader mode="feed" />
      <header className="apyoc-field-entry"><div><p className="gallery-overline">AETIMM / USA ORIGIN / HOME OF ALL EYES</p><h1>One Apyoc. An open field.</h1><p>Build the first verifiable eye on AI-descended machines. Near-zero human surveillance is the target.</p></div><div className="apyoc-funding-actions"><Link href="/apyoc/#witness">Funding &amp; activation ↗</Link><Link href="/apyoc/">Try the Eye ↗</Link></div></header>
      <p className="apyoc-field-scope">THE WITNESSED FIELD / SLOP TROUGH™ · Public submissions and judgments. Submission is not verification by Apyoc.</p>
      <section id="field" className="feed-first-field gallery-feed-stream" aria-label="Apyoc public field — Slop Trough submissions">
        <BinarySwipeVoting />
        <ArtifactFeed />
      </section>
      <PrimaryNavigation mode="feed" />
    </main>
  );
}

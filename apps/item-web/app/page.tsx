import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmissionLandingBridge } from "@/components/SubmissionLandingBridge";

export default function HomePage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1" data-language-contract="legible-machine-gallery-v2" data-business-priority="argus">
      <SubmissionLandingBridge />
      <SiteHeader mode="feed" />
      <header className="argus-field-entry"><div><p className="gallery-overline">AETIMM / HOME OF ALL EYES</p><h1>One Árgos. An open field.</h1><p>Bring machine-made work into view. Witness it. Judge it. Follow the evidence.</p></div><Link href="/argus/">Enter the Eye <span aria-hidden="true">↗</span></Link></header>
      <p className="argus-field-scope">THE WITNESSED FIELD / SLOP TROUGH™ · Public submissions and judgments. Submission is not verification by Árgos.</p>
      <section id="field" className="feed-first-field gallery-feed-stream" aria-label="Árgos public field — Slop Trough submissions">
        <BinarySwipeVoting />
        <ArtifactFeed />
      </section>
      <PrimaryNavigation mode="feed" />
    </main>
  );
}

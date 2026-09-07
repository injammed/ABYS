import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SubmissionLandingBridge } from "@/components/SubmissionLandingBridge";

export default function HomePage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1" data-language-contract="legible-machine-gallery-v2">
      <SubmissionLandingBridge />
      <SiteHeader mode="feed" />
      <h1 className="gallery-sr-only">SLOP TROUGH™</h1>
      <section id="field" className="feed-first-field gallery-feed-stream" aria-label="Live Slop Trough artifact field">
        <BinarySwipeVoting />
        <ArtifactFeed />
      </section>
      <PrimaryNavigation mode="feed" />
    </main>
  );
}

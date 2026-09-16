import type { Metadata } from "next";
import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { BinarySwipeVoting } from "@/components/BinarySwipeVoting";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Slop Trough · AETIMM Library", description: "Throw it in. Look at slop. Vote. Find needles. The open field inside the AETIMM Library of Things." };

export default function SlopTroughPage() {
  return (
    <main className="feed-first-page" data-interface-contract="slop-feed-root-v1" data-language-contract="legible-machine-gallery-v2" data-library-room="slop-trough">
      <SiteHeader mode="feed" />
      <header className="apyoc-field-entry"><div><p className="gallery-overline">AETIMM LIBRARY / THE OPEN FIELD</p><h1>Slop Trough™</h1><p>Throw it in. Look at slop. Vote. Find needles.</p></div><Link href="/">Return to the library ↗</Link></header>
      <p className="apyoc-field-scope">Public submissions and judgments. Submission is not verification by Apyoc.</p>
      <section id="field" className="feed-first-field gallery-feed-stream" aria-label="Slop Trough submissions">
        <BinarySwipeVoting />
        <ArtifactFeed />
      </section>
      <PrimaryNavigation mode="feed" />
    </main>
  );
}

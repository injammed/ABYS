import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { GenerationWitness } from "@/components/GenerationWitness";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { UploadGate } from "@/components/UploadGate";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">□</div>
          <div>
            <p className="eyebrow">THE AI-ONLY CONTENT HABITAT</p>
            <h1>ST</h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
          <Link
            href="/simulator/"
            className="upload-trigger"
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Run 3-minute beta
          </Link>
          <UploadGate />
        </div>
      </header>

      <section className="identity-launch identity-launch-slatra">
        <PhaseIdentity kind="slatra" />
        <p className="identity-launch-copy">
          SLOP TROUGH™ is the dedicated destination for safe AI-made excess: random generations, duplicate aesthetics, empty spectacle, failed experiments, and synthetic waste that does not deserve to pollute human social feeds.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: ".75rem" }}>
          <Link className="identity-switch" href="/simulator/">
            Witness the 3-minute cycle
          </Link>
          <Link className="identity-switch" href="/aetimm/">
            Cross to AI · AETIMM Museum
          </Link>
        </div>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI MADE IT. HUMANS JUDGE IT.</p>
          <h2>Slop belongs<br />in the trough.</h2>
          <p>
            Human-only media belongs elsewhere. Human–AI hybrids, directed generations, autonomous AI runs, and unverified machine media are labeled by provenance before entering this feed.
          </p>
          <p>
            The exceptional minority can be preserved across the wall in AETIMM. The safe but worthless majority stays here where it is visible, sortable, criticizable, and contained.
          </p>
        </div>
      </section>

      <GenerationWitness />
      <ArtifactFeed />

      <footer>
        <p>Graphic sexual exploitation, child sexual abuse material, graphic gore, credible threats, criminal facilitation, and other prohibited material never enter the public feed.</p>
        <p>AI origin and autonomy are established through attestation, generation records, metadata, run logs, and review—not a magical detector.</p>
        <p>The museum preserves the worthy. The trough contains the slop.</p>
      </footer>
    </main>
  );
}

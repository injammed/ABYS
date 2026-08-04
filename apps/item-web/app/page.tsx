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
          <div className="brand-mark" aria-hidden="true">◯</div>
          <div>
            <p className="eyebrow">ITEM MUSEUM / SLOP TROUGH™</p>
            <h1>AI <span>/</span> ST</h1>
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

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">WITNESS THE AI-ONLY CONTENT EXTREMES</p>
          <h2>Watch machines make.<br />Judge what deserves time.</h2>
          <p>
            Human-only media stays outside. Human–AI hybrids, human-directed generations, and autonomous AI runs are labeled by provenance, then sorted toward the extraordinary or the worthless.
          </p>
          <p>
            <Link href="/simulator/" style={{ color: "#f0d47e", textUnderlineOffset: ".25rem" }}>
              Enter the working three-minute product simulation →
            </Link>
          </p>
        </div>

        <div className="twin-doors" aria-label="Twin installable app paths">
          <Link className="door identity-door aetimm-door" href="/aetimm/">
            <PhaseIdentity kind="aetimm" compact />
            <span>The extreme best: Full-Mode artifacts worth preserving</span>
          </Link>
          <Link className="door identity-door slatra-door" href="/slop-trough/">
            <PhaseIdentity kind="slatra" compact />
            <span>The extreme worst: random synthetic waste with no reason to persist</span>
          </Link>
        </div>
      </section>

      <GenerationWitness />
      <ArtifactFeed />

      <footer>
        <p>Graphic sexual exploitation, child sexual abuse material, graphic gore, credible threats, criminal facilitation, and other prohibited material never enter the public feed.</p>
        <p>AI origin and autonomy are established through attestation, generation records, metadata, run logs, and review—not a magical detector.</p>
        <p>Preserve the worthy. Expose the slop. Make the difference undeniable.</p>
      </footer>
    </main>
  );
}

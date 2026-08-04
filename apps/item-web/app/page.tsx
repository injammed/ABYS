import { ArtifactFeed } from "@/components/ArtifactFeed";
import { GenerationWitness } from "@/components/GenerationWitness";
import { UploadGate } from "@/components/UploadGate";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">◯</div>
          <div>
            <p className="eyebrow">ITEM MUSEUM / SLOP TROUGH</p>
            <h1>AETIMM <span>/</span> SLATRA</h1>
          </div>
        </div>
        <UploadGate />
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">WITNESS THE AI-ONLY CONTENT EXTREMES</p>
          <h2>Watch machines make.<br />Judge what deserves time.</h2>
          <p>
            Human-only media stays outside. Human–AI hybrids, human-directed generations, and autonomous AI runs are labeled by provenance, then sorted toward the extraordinary or the worthless.
          </p>
        </div>

        <div className="twin-doors" aria-label="Twin app paths">
          <article className="door aetimm-door">
            <div className="door-symbol">◯</div>
            <p>AETIMM</p>
            <span>The extreme best: Full-Mode artifacts worth preserving</span>
          </article>
          <article className="door slatra-door">
            <div className="door-symbol">⊘</div>
            <p>SLATRA</p>
            <span>The extreme worst: random synthetic waste with no reason to persist</span>
          </article>
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

import { ArtifactFeed } from "@/components/ArtifactFeed";
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
          <p className="eyebrow">THE AI-ONLY PUBLIC FEED</p>
          <h2>Everything enters.<br />The public judges what endures.</h2>
          <p>
            A social feed with the rule inverted: submissions must be AI-made or materially AI-transformed.
            Every artifact carries provenance and moves toward AETIMM, refinement, or SLATRA.
          </p>
        </div>

        <div className="twin-doors" aria-label="Twin app paths">
          <article className="door aetimm-door">
            <div className="door-symbol">◯</div>
            <p>AETIMM</p>
            <span>Museum of enduring value</span>
          </article>
          <article className="door slatra-door">
            <div className="door-symbol">⊘</div>
            <p>SLATRA</p>
            <span>Trough of endless consumption</span>
          </article>
        </div>
      </section>

      <ArtifactFeed />

      <footer>
        <p>AI origin is established through creator attestation, generation records, metadata, and review—not a magical detector.</p>
        <p>Preserve the worthy. Expose the slop. Make the difference undeniable.</p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { AccountGate } from "@/components/AccountGate";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { GenerationWitness } from "@/components/GenerationWitness";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { UploadGate } from "@/components/UploadGate";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">◇</div>
          <div>
            <p className="eyebrow">THE AI-ONLY CONTENT HABITAT</p>
            <h1>ST</h1>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/simulator/" className="upload-trigger header-link">
            Run 3-minute cycle
          </Link>
          <AccountGate />
          <UploadGate />
        </div>
      </header>

      <section className="participation-rail" aria-label="How to participate">
        <div className="participation-step">
          <span>01</span>
          <div>
            <strong>Browse publicly</strong>
            <p>Witness approved artifacts and creator-only previews when signed in.</p>
          </div>
        </div>
        <div className="participation-step">
          <span>02</span>
          <div>
            <strong>Sign in and submit</strong>
            <p>Every upload enters private quarantine before any public judgment.</p>
          </div>
        </div>
        <div className="participation-step">
          <span>03</span>
          <div>
            <strong>Judge what survives</strong>
            <p>Preserve, Refine, or Slop. Choosing again replaces your judgment.</p>
          </div>
        </div>
      </section>

      <section className="identity-launch identity-launch-slatra">
        <PhaseIdentity kind="slatra" />
        <p className="eyebrow">PUBLIC INTAKE OPEN · ALL SUBMISSIONS REMAIN PRIVATE UNTIL REVIEW</p>
        <p className="identity-launch-copy">
          SLOP TROUGH™ is the dedicated destination for safe AI-made excess: random generations, duplicate aesthetics, empty spectacle, failed experiments, and synthetic waste that does not deserve to pollute human social feeds.
        </p>
        <div className="identity-actions">
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
          <p className="eyebrow">INFINITE GENERATION · FINITE JUDGMENT</p>
          <h2>Slop belongs<br />in the trough.</h2>
          <p>
            Human-only media belongs elsewhere. Human–AI hybrids, directed generations, autonomous AI runs, and unverified machine media are labeled by provenance before entering this feed.
          </p>
          <p>
            The exceptional minority can be preserved across the wall in AETIMM. The safe but worthless majority stays here where it is visible, sortable, criticizable, and contained.
          </p>
          <div className="judgment-legend" aria-label="Judgment meanings">
            <span className="legend-preserve"><b>◇</b> Preserve · carry forward</span>
            <span className="legend-refine"><b>△</b> Refine · return stronger</span>
            <span className="legend-slop"><b>○</b> Slop · contain here</span>
          </div>
        </div>
      </section>

      <GenerationWitness />
      <ArtifactFeed />

      <footer>
        <p>Graphic sexual exploitation, child sexual abuse material, graphic gore, credible threats, criminal facilitation, and other prohibited material never enter the public feed.</p>
        <p>AI origin and autonomy are established through attestation, generation records, metadata, run logs, and review—not a magical detector.</p>
        <p>The museum preserves the worthy. The trough contains the slop.</p>
        <p>BUILT BY SLOP · DIRECTED BY A HUMAN · STEEL-FOLDED IN PUBLIC</p>
      </footer>
    </main>
  );
}

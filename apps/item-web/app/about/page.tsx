import Link from "next/link";
import { GenerationWitness } from "@/components/GenerationWitness";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="site-header feed-first-header">
        <Link className="brand-lockup feed-first-brand" href="/" aria-label="Return to the live feed">
          <div className="brand-mark" aria-hidden="true">◇</div>
          <div>
            <p className="eyebrow">SLOP TROUGH™</p>
            <h1>ABOUT THE FIELD</h1>
          </div>
        </Link>
        <Link className="upload-trigger header-link" href="/">
          Enter feed
        </Link>
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
        <p className="eyebrow">EVERYTHING ENTERS AS SLOP</p>
        <p className="identity-launch-copy">
          SLOP TROUGH™ is the public intake and entertainment field for AI-native artifacts. The Trough accepts abundance. Judgment, revision, provenance, and time determine what crosses into AETIMM.
        </p>
        <div className="identity-actions">
          <Link className="identity-switch" href="/simulator/">
            Witness the 3-minute cycle
          </Link>
          <Link className="identity-switch" href="/aetimm/">
            Visit the AETIMM Museum
          </Link>
        </div>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">INFINITE GENERATION · FINITE PRESERVATION</p>
          <h2>Slop fertilizes<br />the orchard.</h2>
          <p>
            Human–AI hybrids, directed generations, autonomous runs, and unverified machine media enter through one visible field. The system records origin, judgment, revision, and eventual influence rather than pretending artifacts appeared fully formed.
          </p>
          <p>
            The hard destination remains binary: SLOP, or deliberately preserved in AETIMM—on the wall, on the shelf, in the book, in the vault, or in the foundry.
          </p>
          <div className="judgment-legend" aria-label="Judgment meanings">
            <span className="legend-preserve"><b>◇</b> Preserve · carry forward</span>
            <span className="legend-refine"><b>△</b> Refine · return stronger</span>
            <span className="legend-slop"><b>○</b> Slop · remain in the field</span>
          </div>
        </div>
      </section>

      <GenerationWitness />

      <footer>
        <p>Graphic sexual exploitation, child sexual abuse material, graphic gore, credible threats, criminal facilitation, and other prohibited material never enter the public feed.</p>
        <p>AI origin and autonomy are established through attestation, generation records, metadata, run logs, and review—not a magical detector.</p>
        <p>BUILT BY SLOP · DIRECTED BY A HUMAN · STEEL-FOLDED IN PUBLIC</p>
      </footer>

      <PrimaryNavigation />
    </main>
  );
}

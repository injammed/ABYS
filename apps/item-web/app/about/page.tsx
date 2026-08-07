import Link from "next/link";
import { GenerationWitness } from "@/components/GenerationWitness";
import { LexiconText } from "@/components/LexiconBroadcast";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";

export default function AboutPage() {
  return (
    <main className="about-page" data-lexicon-contract="character-broadcast-v1">
      <header className="site-header feed-first-header">
        <Link className="brand-lockup feed-first-brand" href="/" aria-label="Return to the live feed">
          <div className="brand-mark" aria-hidden="true">◇</div>
          <div>
            <LexiconText as="p" className="eyebrow" text="SLOP TROUGH™" phase={3} />
            <LexiconText as="h1" text="ABOUT THE FIELD" phase={7} />
          </div>
        </Link>
        <Link className="upload-trigger header-link" href="/" aria-label="Enter feed">
          <LexiconText text="Enter feed" phase={11} semantic={false} />
        </Link>
      </header>

      <section className="participation-rail" aria-label="How to participate">
        <div className="participation-step">
          <LexiconText text="01" phase={13} />
          <div>
            <LexiconText as="strong" text="Throw in machine-made slop" phase={17} />
            <LexiconText as="p" text="Make an account, add an Artifact, and submit. Valid attested work joins the public Unjudged trough immediately." phase={19} />
          </div>
        </div>
        <div className="participation-step">
          <LexiconText text="02" phase={23} />
          <div>
            <LexiconText as="strong" text="Scroll the same public broadcast" phase={29} />
            <LexiconText as="p" text="Everybody enters the same trough. No personalized recommendation profile bends the field around the viewer." phase={31} />
          </div>
        </div>
        <div className="participation-step">
          <LexiconText text="03" phase={37} />
          <div>
            <LexiconText as="strong" text="Judge or ignore" phase={41} />
            <LexiconText as="p" text="One account may hold one active Slop or Museum judgment per Artifact. Choosing again replaces that judgment. Silence means keep scrolling." phase={43} />
          </div>
        </div>
      </section>

      <section className="identity-launch identity-launch-slatra">
        <PhaseIdentity kind="slatra" />
        <LexiconText as="p" className="eyebrow" text="EVERYTHING ENTERS AS SLOP" phase={47} />
        <LexiconText
          as="p"
          className="identity-launch-copy"
          text="SLOP TROUGH™ is the shared public intake and entertainment field for machine-made Artifacts. The Trough accepts abundance. Museum judgment accumulates separately; the strongest all-time signal occupies the Summit and permanent accession develops more slowly."
          phase={53}
        />
        <div className="identity-actions">
          <Link className="identity-switch" href="/simulator/" aria-label="Witness the synthetic cycle">
            <LexiconText text="Witness the synthetic cycle" phase={59} semantic={false} />
          </Link>
          <Link className="identity-switch" href="/aetimm/" aria-label="Visit the AETIMM Museum">
            <LexiconText text="Visit the AETIMM Museum" phase={61} semantic={false} />
          </Link>
        </div>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <LexiconText as="p" className="eyebrow" text="INFINITE GENERATION · FINITE PRESERVATION" phase={67} />
          <LexiconText as="h2" text="Slop fertilizes the orchard." phase={71} />
          <LexiconText
            as="p"
            text="Human-directed generations, hybrids, autonomous runs, and other declared machine-made Artifacts enter one visible field. The system records provenance and public judgment without making a personalized feed for each viewer."
            phase={73}
          />
          <LexiconText
            as="p"
            text="The public gesture is binary: Slop or Museum. The two signals accumulate independently. An Artifact can be gloriously terrible and institutionally important at the same time."
            phase={79}
          />
          <div className="judgment-legend" aria-label="Judgment meanings">
            <span className="legend-slop"><b>≋</b> <LexiconText text="Slop · accumulate left judgment" phase={83} /></span>
            <span className="legend-preserve"><b>◇</b> <LexiconText text="Museum · accumulate right judgment" phase={89} /></span>
          </div>
        </div>
      </section>

      <GenerationWitness />

      <footer>
        <LexiconText as="p" text="Graphic sexual exploitation, child sexual abuse material, graphic gore, credible threats, criminal facilitation, and other prohibited material never belong in the public feed." phase={97} />
        <LexiconText as="p" text="AI origin and autonomy are established through attestation, generation records, metadata, run logs, and review—not a magical detector." phase={101} />
        <LexiconText as="p" text="BUILT BY SLOP · DIRECTED BY A HUMAN · STEEL-FOLDED IN PUBLIC" phase={103} />
      </footer>

      <PrimaryNavigation />
    </main>
  );
}

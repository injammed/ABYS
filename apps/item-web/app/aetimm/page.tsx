import Link from "next/link";
import { MuseumCollection } from "@/components/MuseumCollection";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";

export default function AetimmPage() {
  return (
    <main className="about-page museum-page" data-interface-contract="museum-accession-mode-v1">
      <section className="identity-launch identity-launch-aetimm" aria-label="AETIMM Museum entrance">
        <PhaseIdentity kind="aetimm" />
        <p className="identity-launch-copy">
          The Museum is the permanent collection. Public Museum judgment unlocks accessions over time; accession is not a leaderboard and ordinary voting cannot undo it.
        </p>
        <div className="identity-actions">
          <Link className="identity-switch" href="/#field">
            Return to the Slop Trough
          </Link>
          <Link className="identity-switch" href="/about/">
            Read the field constitution
          </Link>
        </div>
      </section>

      <MuseumCollection />
      <PrimaryNavigation mode="museum" />
    </main>
  );
}

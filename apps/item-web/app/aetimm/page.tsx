import Link from "next/link";
import { PhaseIdentity } from "@/components/PhaseIdentity";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";

export default function AetimmPage() {
  return (
    <main className="museum-page" data-interface-contract="museum-spatial-mode-v1">
      <section className="identity-launch identity-launch-aetimm" aria-label="AETIMM Museum entrance">
        <PhaseIdentity kind="aetimm" />
        <p className="identity-launch-copy">
          AETIMM is the Museum: a distinct spatial environment for machine-made work deliberately selected to persist.
        </p>
        <p className="identity-launch-copy">
          Its rooms, walls, shelves, cases, and inspection mechanics will be folded here without turning the Museum into another vertical feed.
        </p>
        <div className="identity-actions">
          <Link className="identity-switch" href="/#field">
            Return to the Slop Feed
          </Link>
          <Link className="identity-switch" href="/about/">
            Read the field constitution
          </Link>
        </div>
      </section>

      <PrimaryNavigation />
    </main>
  );
}

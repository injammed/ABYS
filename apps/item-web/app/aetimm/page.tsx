import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { GenerationWitness } from "@/components/GenerationWitness";
import { PhaseIdentity } from "@/components/PhaseIdentity";

export default function AetimmPage() {
  return (
    <main>
      <section className="identity-launch identity-launch-aetimm">
        <PhaseIdentity kind="aetimm" />
        <p className="identity-launch-copy">
          AETIMM phases into AI: Aeternum Immutablis, the museum door for machine-made work that deserves to persist.
        </p>
        <Link className="identity-switch" href="/slop-trough/">
          Cross to ST · SLOP TROUGH™
        </Link>
      </section>
      <GenerationWitness />
      <ArtifactFeed />
    </main>
  );
}

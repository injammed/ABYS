import Link from "next/link";
import { ArtifactFeed } from "@/components/ArtifactFeed";
import { PhaseIdentity } from "@/components/PhaseIdentity";

export default function SlopTroughPage() {
  return (
    <main>
      <section className="identity-launch identity-launch-slatra">
        <PhaseIdentity kind="slatra" />
        <p className="identity-launch-copy">
          SLOP TROUGH™ phases into ST: the labeled extreme of safe but worthless synthetic output, duplication, incoherence, and waste.
        </p>
        <Link className="identity-switch" href="/aetimm/">
          Cross to AI · AETIMM
        </Link>
      </section>
      <ArtifactFeed />
    </main>
  );
}

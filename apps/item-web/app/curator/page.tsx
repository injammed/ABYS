import Link from "next/link";
import { CuratorQueue } from "@/components/CuratorQueue";
import { SelectionQueue } from "@/components/SelectionQueue";

export default function CuratorPage() {
  return (
    <main>
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">□</div>
          <div>
            <p className="eyebrow">AETIMM / SLOP TROUGH</p>
            <h1>CURATOR</h1>
          </div>
        </div>
        <Link className="upload-trigger" href="/" style={{ textDecoration: "none" }}>
          Return to feed
        </Link>
      </header>

      <section className="curator-intro">
        <p className="eyebrow">PRIVATE REVIEW + SELECTION SURFACE</p>
        <h2>Nothing publishes or enters the Museum by accident.</h2>
        <p>
          Quarantine review controls first publication. Public judgments create selection evidence. The algorithm nominates a cohort-relative top decile, and a separate curator decision controls Museum admission.
        </p>
      </section>

      <CuratorQueue />
      <SelectionQueue />
    </main>
  );
}

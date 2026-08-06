import Link from "next/link";
import { CuratorQueue } from "@/components/CuratorQueue";

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
        <p className="eyebrow">PRIVATE REVIEW SURFACE</p>
        <h2>Nothing publishes by accident.</h2>
        <p>
          Curator decisions execute through a database-authorized atomic transition. Approval publishes the artifact and records the note; revision and rejection keep the media private.
        </p>
      </section>

      <CuratorQueue />
    </main>
  );
}

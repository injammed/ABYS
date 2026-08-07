import Link from "next/link";
import { MuseumCollection } from "@/components/MuseumCollection";
import { MuseumSummit } from "@/components/MuseumSummit";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import styles from "./MuseumDestination.module.css";

export default function AetimmPage() {
  return (
    <main
      className={`${styles.page} about-page museum-page`}
      data-interface-contract="museum-spatial-mode-v1"
      data-accession-contract="museum-accession-v1"
      data-destination-contract="museum-arrival-always-v1"
      data-summit-contract="museum-summit-v1"
    >
      <section className={styles.threshold} aria-label="AETIMM Museum entrance">
        <div className={styles.architecture} aria-hidden="true">
          <span className={`${styles.ring} ${styles.ringOuter}`} />
          <span className={`${styles.ring} ${styles.ringMiddle}`} />
          <span className={`${styles.ring} ${styles.ringInner}`} />
          <span className={styles.core} />
          <span className={styles.axis} />
        </div>

        <div className={styles.entryCopy}>
          <p className={styles.eyebrow}>AETIMM · MACHINE MUSEUM</p>
          <h1>AETIMM MUSEUM</h1>
          <p className={styles.declaration}>The machine remembers selectively.</p>
          <p className={styles.rule}>
            Everything begins in the trough. The strongest all-time Museum signal holds the Summit; permanent accession is slower.
          </p>
          <div className={styles.entryActions}>
            <a className={styles.enter} href="#summit">Approach the Summit</a>
            <Link className={styles.return} href="/#field">Return to the Slop Trough</Link>
          </div>
        </div>

        <div className={styles.thresholdRail} aria-hidden="true">
          <span>SUMMIT</span>
          <span>ACCESSION</span>
          <span>PERMANENCE</span>
          <span>NO TRENDING</span>
        </div>
      </section>

      <MuseumSummit />
      <MuseumCollection />
      <PrimaryNavigation mode="museum" />
    </main>
  );
}

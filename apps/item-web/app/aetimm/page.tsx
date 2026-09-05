import Link from "next/link";
import { LexiconText } from "@/components/LexiconBroadcast";
import { MachineGloss } from "@/components/MachineGloss";
import { MuseumCollection } from "@/components/MuseumCollection";
import { MuseumSummit } from "@/components/MuseumSummit";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import styles from "./MuseumDestination.module.css";

const ITEM_0001_CHECKOUT = "https://buy.stripe.com/14A3cw8LrcB8abjb1v2Ry00";

export default function AetimmPage() {
  return (
    <main
      className={`${styles.page} about-page museum-page`}
      data-interface-contract="museum-spatial-mode-v1"
      data-accession-contract="museum-accession-v1"
      data-destination-contract="museum-arrival-always-v1"
      data-summit-contract="museum-summit-v1"
      data-language-contract="machine-first-gloss-v1"
      data-lexicon-contract="character-broadcast-v1"
    >
      <nav className={styles.spaceSelector} aria-label="AETIMM: upload, scroll, vote, shop" data-human-flow="upload-scroll-vote-shop-v1">
        <Link href="/#field"><strong>UPLOAD</strong><small>Put it in</small></Link>
        <Link href="/#field"><strong>SCROLL</strong><small>See creations</small></Link>
        <Link href="/#field"><strong>VOTE</strong><small>Find needles</small></Link>
        <a href="#shop"><strong>SHOP</strong><small>Buy literature</small></a>
      </nav>

      <section id="shop" className={styles.library} aria-label="AETIMM literature shop" data-library-contract="literature-shelf-v1">
        <MachineGloss density="quiet" translations={{ en: "AETIMM LITERATURE · THE MATERIAL CURRENCY ARCHIVE" }} />
        <LexiconText as="h1" text="SHOP" phase={61} />
        <MachineGloss translations={{ en: "Independent papers and visual studies for building and interrogating a three-dimensional, material monetary paradigm." }} />

        <div className={styles.literatureShelf} aria-label="Literature for sale">
          <article className={styles.literatureItem} data-aetimm-item="0001" data-commerce-state="orderable">
            <p>ITEM 0001 · FIVE-PAGE PAPER · DIGITAL EDITION</p>
            <h2>THE DIAMOND TESSERACT</h2>
            <p>A Three-Dimensional Synthetic-Diamond Monetary Architecture. Final Technical Concept Paper · Draft 3 of 3 · September 2026.</p>
            <p className={styles.itemBoundary}>INDEPENDENT CONCEPT · NOT LEGAL TENDER · NO GOVERNMENT ENDORSEMENT</p>
            <footer>
              <strong>$10 USD</strong>
              <a href={ITEM_0001_CHECKOUT} target="_blank" rel="noreferrer">BUY COPY →</a>
            </footer>
          </article>
          <div className={styles.shelfFuture}>
            <strong>THE SHELF EXPANDS.</strong>
            <span>ITEM 0002 → ITEM 0300+</span>
            <span>Technical papers · visual essays · design studies · constitutions · experiments.</span>
          </div>
        </div>

        <article className={styles.vehicleFold} data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1" data-commerce-state="concept">
          <header>
            <p>IMPOSSIBLE AMBITION · NOT ORDERABLE</p>
            <h3>ONE-OF-ONE HYBRID HYDROGEN–ELECTRIC SPORTS CAR</h3>
            <p>Literature is first. Physical objects follow. The car remains the horizon: no price, preorder, or fabricated claim until it can actually be engineered and made.</p>
          </header>
          <p className={styles.goalLock}>STATE · CONCEPT &nbsp; / &nbsp; PRICE · — &nbsp; / &nbsp; CHECKOUT · OFF</p>
        </article>
      </section>

      <section className={styles.threshold} id="museum" aria-label="AETIMM Museum entrance">
        <div className={styles.architecture} aria-hidden="true"><span className={`${styles.ring} ${styles.ringOuter}`} /><span className={`${styles.ring} ${styles.ringMiddle}`} /><span className={`${styles.ring} ${styles.ringInner}`} /><span className={styles.core} /><span className={styles.axis} /></div>
        <div className={styles.entryCopy}>
          <MachineGloss density="quiet" translations={{ en: "AETIMM · MACHINE MUSEUM · PERMANENT MEMORY INSTITUTION" }} />
          <LexiconText as="h2" text="AETIMM MUSEUM" phase={31} />
          <MachineGloss translations={{ en: "The machine remembers selectively. Most output vanishes into the trough; a small remainder is forced to endure." }} />
          <div className={styles.entryActions}><a className={styles.enter} href="#summit">Approach the Summit</a><Link className={styles.return} href="/#field">Return to the Slop Trough</Link></div>
        </div>
      </section>

      <MuseumSummit />
      <MuseumCollection />
      <PrimaryNavigation mode="museum" />
    </main>
  );
}

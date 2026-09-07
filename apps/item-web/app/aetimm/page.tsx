import Link from "next/link";
import { LexiconText } from "@/components/LexiconBroadcast";
import { LegacyShopLink } from "@/components/LegacyShopLink";
import { MuseumCollection } from "@/components/MuseumCollection";
import { MuseumSummit } from "@/components/MuseumSummit";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./MuseumDestination.module.css";

export default function AetimmPage() {
  return (
    <main className={`${styles.page} about-page museum-page`} data-interface-contract="museum-spatial-mode-v1" data-accession-contract="museum-accession-v1" data-destination-contract="museum-arrival-always-v1" data-summit-contract="museum-summit-v1" data-language-contract="legible-machine-gallery-v2" data-lexicon-contract="character-broadcast-v1">
      <LegacyShopLink />
      <SiteHeader mode="museum" />
      <section className={styles.threshold} id="museum" aria-label="AETIMM Museum entrance">
        <p className="gallery-overline">AETIMM · MACHINE MUSEUM</p>
        <div className={styles.entryCopy}><h1>What <em>endures.</em></h1><p>The Trough never stops.<br />Here, we look closer.</p></div>
        <div className="machine-signature" aria-hidden="true"><LexiconText machine text="AETIMM ∞ DETECT. ENCODE. CONTINUE. ∞ MEMORY / LINEAGE / SELECTION ∞ PERMANENT COLLECTION" semantic={false} phase={23} /></div>
        <nav className={styles.entryActions} aria-label="Museum rooms"><a href="#summit">The Summit</a><a href="#collection">Permanent collection</a><Link href="/shop/">Shop editions</Link></nav>
      </section>
      <MuseumSummit />
      <MuseumCollection />
      <div className={styles.exit}><Link href="/#field">Return to the Slop Trough <span aria-hidden="true">↗</span></Link></div>
      <PrimaryNavigation mode="museum" />
    </main>
  );
}

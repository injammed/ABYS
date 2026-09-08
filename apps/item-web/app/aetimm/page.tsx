import type { Metadata } from "next";
import Link from "next/link";
import { LexiconText } from "@/components/LexiconBroadcast";
import { LegacyShopLink } from "@/components/LegacyShopLink";
import { CurrencyMuseum } from "@/components/CurrencyMuseum";

import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./MuseumDestination.module.css";

export const metadata: Metadata = { title: "ITEM Museum — AETIMM", description: "The global 3D+ currency exhibition, searchable ITEM records and conditional 2027–2040 adoption scenarios." };

export default function AetimmPage() {
  return (
    <main className={`${styles.page} about-page museum-page`} data-interface-contract="museum-spatial-mode-v1" data-accession-contract="museum-accession-v1" data-destination-contract="museum-arrival-always-v1" data-currency-contract="global-forecast-library-v1" data-language-contract="legible-machine-gallery-v2" data-lexicon-contract="character-broadcast-v1">
      <LegacyShopLink />
      <SiteHeader mode="museum" />
      <CurrencyMuseum />
      <div className="machine-signature" aria-hidden="true"><LexiconText machine text="ITEM · DETECT. ENCODE. CONTINUE." semantic={false} phase={23} /></div>
      <div className={styles.exit}><Link href="/#field">Return to the Slop Trough <span aria-hidden="true">↗</span></Link></div>
      <PrimaryNavigation mode="museum" />
    </main>
  );
}

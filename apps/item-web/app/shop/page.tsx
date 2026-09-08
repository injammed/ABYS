import { CurrencyMuseum } from "@/components/CurrencyMuseum";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LexiconText } from "@/components/LexiconBroadcast";
import { PrimaryNavigation } from "@/components/PrimaryNavigation";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./Shop.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ITEM_0001_CHECKOUT = "https://buy.stripe.com/14A3cw8LrcB8abjb1v2Ry00";

export const metadata: Metadata = {
  title: "ITEM Library & Editions · AETIMM Shop",
  description: "Walk the global 3D+ currency library, explore conditional 2027–2040 adoption scenarios, and discover AETIMM digital editions.",
};

export default function ShopPage() {
  return (
    <main className={`about-page ${styles.page}`} data-library-contract="literature-shelf-v1">
      <SiteHeader />
      <CurrencyMuseum />
      <div className={styles.content}>
        <div className={styles.topline}><Link href="/#field">Back to the Trough</Link><span>AETIMM LITERATURE / THE EDITIONS</span></div>
        <header className={styles.heading}><h2>The Editions<span>.</span></h2><p>Papers. Objects of thought.<br />The beginnings of things.</p></header>
        <div className="machine-signature" aria-hidden="true"><LexiconText machine text="AETIMM ∞ DETECT. ENCODE. CONTINUE. ∞ ITEM 0001 ∞ MATERIAL / MEMORY / MATTER ∞ 10,000 YD" semantic={false} phase={31} /></div>

        <article id="shop" className={styles.product} data-aetimm-item="0001" data-commerce-state="orderable">
          <figure className={styles.artwork}>
            <Image src={`${basePath}/images/diamond-tesseract-concept.webp`} alt="Concept artwork: a clear faceted cuboid surrounding silver geometry, standing on polished obsidian" width={1086} height={1448} sizes="(max-width: 800px) 100vw, 50vw" priority />
            <figcaption>AI CONCEPT ARTWORK · DIGITAL PAPER SOLD BELOW</figcaption>
          </figure>
          <div className={styles.productCopy}>
            <p className="gallery-overline">ITEM 0001 / DIGITAL EDITION</p>
            <h2>The Diamond<br /><em>Tesseract.</em></h2>
            <p className={styles.subtitle}>A Three-Dimensional Synthetic-Diamond Monetary Architecture.</p>
            <p className={styles.description}>A five-page technical concept paper exploring currency as a physical, three-dimensional object. Materials, construction, American iconography, and the questions a new monetary form brings into view.</p>
            <dl className={styles.specifications}><div><dt>Format</dt><dd>Digital paper · 5 pages</dd></div><div><dt>Edition</dt><dd>Final concept · Draft 3 of 3</dd></div><div><dt>Published</dt><dd>September 2026</dd></div></dl>
            <div className={styles.purchase}><span className={styles.price}>$10 <small>USD</small></span><a href={ITEM_0001_CHECKOUT} target="_blank" rel="noreferrer">Buy digital copy <span aria-hidden="true">↗</span></a></div>
            <p className={styles.checkoutNote}>Opens secure checkout. This purchase is the digital paper.</p>
            <p className={styles.boundary}>Independent concept. Not legal tender. No government endorsement.</p>
          </div>
        </article>

        <section className={styles.horizon} data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1" data-commerce-state="concept" aria-labelledby="horizon-title">
          <div><p className="gallery-overline">ON THE HORIZON / CONCEPT</p><h2 id="horizon-title">From an idea<br />to <em>one of one.</em></h2></div>
          <div><h3>A machine-made hybrid hydrogen–electric sports car.</h3><p>Literature is first. Physical objects follow. The ambition is a unique machine-made car, purchasable here once it can actually be engineered and built.</p><span className={styles.conceptState}>In concept · Not available to order</span></div>
        </section>
        <nav className={styles.nextSteps} aria-label="Continue exploring"><Link href="/#field">Return to the Trough <span aria-hidden="true">↗</span></Link><Link href="/aetimm/#museum">Explore the Museum <span aria-hidden="true">◇</span></Link></nav>
      </div>
      <PrimaryNavigation mode="shop" />
    </main>
  );
}

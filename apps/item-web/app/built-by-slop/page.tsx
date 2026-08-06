import type { Metadata } from "next";
import Link from "next/link";
import { BuildProvenance } from "@/components/BuildProvenance";
import styles from "./built-by-slop.module.css";

export const metadata: Metadata = {
  title: "Built by Slop · AETIMM Build Provenance",
  description: "Public provenance for the human-directed, AI-assisted, steel-folded construction of aetimm.com.",
};

export default function BuiltBySlopPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.topbar} aria-label="Build provenance navigation">
        <Link className={styles.wordmark} href="/">AETIMM · SLOP TROUGH</Link>
        <Link href="/">Return to the field</Link>
      </nav>
      <BuildProvenance />
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { loadMuseumCollection, MuseumAccession } from "@/lib/museum";
import { LexiconText } from "./LexiconBroadcast";
import { MuseumArtifactRuntime } from "./MuseumArtifactRuntime";
import { useVisiblePublicRefresh } from "./useVisiblePublicRefresh";
import styles from "./MuseumCollection.module.css";

const COLLECTION_REFRESH_MS = 30000;
const COLLECTION_REFRESH_EVENTS = ["aetimm:vote-committed"] as const;

function accessionLabel(value: number): string {
  return `AETIMM ${String(value).padStart(6, "0")}`;
}

function placementFor(index: number): "pedestal" | "wall" | "case" {
  if (index === 0) return "pedestal";
  if (index < 4) return "wall";
  return "case";
}

export function MuseumCollection() {
  const [accessions, setAccessions] = useState<MuseumAccession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCollection = useCallback(async () => {
    const rows = await loadMuseumCollection();
    setAccessions(rows);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadMuseumCollection()
      .then((rows) => {
        if (!cancelled) {
          setAccessions(rows);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The collection register could not be opened.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useVisiblePublicRefresh(refreshCollection, COLLECTION_REFRESH_MS, COLLECTION_REFRESH_EVENTS);

  const state = loading ? "loading" : error && accessions.length === 0 ? "error" : accessions.length === 0 ? "empty" : "open";
  const registerState = loading
    ? "reading accession register"
    : error && accessions.length === 0
      ? "register unavailable"
      : `${accessions.length} accession${accessions.length === 1 ? "" : "s"}`;

  return (
    <section
      id="collection"
      className={styles.collection}
      aria-label="AETIMM permanent collection"
      data-collection-state={state}
      data-empty-museum-is-destination="true"
      data-lexicon-surface="true"
    >
      <div className={styles.roomHeader}>
        <LexiconText as="p" text="PERMANENT COLLECTION" phase={5} />
        <LexiconText text={registerState} phase={11} />
      </div>

      {loading && (
        <div className={styles.emptyChamber} aria-live="polite">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <LexiconText as="p" className={styles.accession} text="ACCESSION REGISTER" phase={17} />
          <LexiconText as="h2" text="Opening the collection." phase={19} />
          <LexiconText as="p" text="The room is already here. The register is being read." phase={23} />
        </div>
      )}

      {!loading && error && accessions.length === 0 && (
        <div className={styles.emptyChamber} role="alert" aria-label="The register is unavailable. The Museum remains open.">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <LexiconText as="p" className={styles.accession} text="PERMANENT COLLECTION" phase={29} semantic={false} />
          <LexiconText as="h2" text="The register is unavailable." phase={31} semantic={false} />
          <LexiconText as="p" text="The Museum remains open. No false collection is substituted." phase={37} semantic={false} />
        </div>
      )}

      {!loading && !error && accessions.length === 0 && (
        <div className={styles.emptyChamber} aria-label="Empty Museum collection">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <LexiconText as="p" className={styles.accession} text="ACCESSION 000000" phase={41} semantic={false} />
          <LexiconText as="h2" text="The hall is empty." phase={43} semantic={false} />
          <LexiconText as="p" text="No Artifact has crossed the permanent accession threshold yet." phase={47} semantic={false} />
        </div>
      )}

      {!loading && accessions.length > 0 && (
        <div className={styles.room} data-placement-law="all-time-museum-votes-no-trending">
          {accessions.map((accession, index) => {
            const placement = placementFor(index);
            const placementClass = placement === "pedestal"
              ? styles.pedestalCase
              : placement === "wall"
                ? styles.wallCase
                : styles.case;
            const phase = 53 + index * 13;
            const formText = `${accession.modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ")}${accession.parts.length > 0 ? ` · ${accession.parts.length} material${accession.parts.length === 1 ? "" : "s"}` : ""}`;

            return (
              <article
                className={`${styles.case} ${placementClass}`}
                data-museum-placement={placement}
                key={accession.accessionNumber}
              >
                <div className={styles.objectStage}>
                  <MuseumArtifactRuntime artifact={accession} />
                </div>

                <div className={styles.plaque}>
                  <LexiconText as="p" className={styles.accession} text={accessionLabel(accession.accessionNumber)} phase={phase} />
                  <LexiconText as="h2" text={accession.title} phase={phase + 1} />
                  <LexiconText as="p" className={styles.creator} text={accession.creator} phase={phase + 2} />
                  <LexiconText as="p" className={styles.summary} text={accession.summary} phase={phase + 3} />
                  <LexiconText as="p" className={styles.form} text={formText} phase={phase + 4} />
                  <LexiconText
                    as="p"
                    className={styles.date}
                    text={`Accessioned ${new Date(accession.admittedAt).toLocaleDateString()}`}
                    phase={phase + 5}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

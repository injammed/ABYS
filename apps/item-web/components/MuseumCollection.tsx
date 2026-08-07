"use client";

import { useEffect, useState } from "react";
import { loadMuseumCollection, MuseumAccession } from "@/lib/museum";
import styles from "./MuseumCollection.module.css";

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

  useEffect(() => {
    let cancelled = false;
    void loadMuseumCollection()
      .then((rows) => {
        if (!cancelled) setAccessions(rows);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The collection could not be opened.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className={styles.state}>Opening the Museum…</p>;
  }

  if (error) {
    return <p className={styles.state} role="alert">The Museum could not be opened.</p>;
  }

  if (accessions.length === 0) {
    return (
      <section className={styles.empty} aria-label="Empty Museum collection">
        <p className={styles.accession}>PERMANENT COLLECTION</p>
        <h2>Nothing yet.</h2>
        <p>The trough decides what survives. The Museum can wait.</p>
      </section>
    );
  }

  return (
    <section className={styles.collection} aria-label="AETIMM permanent collection">
      <div className={styles.roomHeader}>
        <p>PERMANENT COLLECTION</p>
        <span>{accessions.length} accession{accessions.length === 1 ? "" : "s"}</span>
      </div>

      <div className={styles.room} data-placement-law="all-time-museum-votes-no-trending">
        {accessions.map((accession, index) => {
          const placement = placementFor(index);
          const placementClass = placement === "pedestal"
            ? styles.pedestalCase
            : placement === "wall"
              ? styles.wallCase
              : styles.case;

          return (
            <article
              className={`${styles.case} ${placementClass}`}
              data-museum-placement={placement}
              key={accession.accessionNumber}
            >
              <div className={styles.objectStage}>
                {accession.mediaUrl ? (
                  <img src={accession.mediaUrl} alt="" loading="lazy" />
                ) : (
                  <div className={styles.noPreview} aria-label="No visual preview available">
                    {accession.modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ")}
                  </div>
                )}
              </div>

              <div className={styles.plaque}>
                <p className={styles.accession}>{accessionLabel(accession.accessionNumber)}</p>
                <h2>{accession.title}</h2>
                <p className={styles.creator}>{accession.creator}</p>
                <p className={styles.summary}>{accession.summary}</p>
                <p className={styles.date}>Accessioned {new Date(accession.admittedAt).toLocaleDateString()}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

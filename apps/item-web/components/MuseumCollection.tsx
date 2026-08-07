"use client";

import { useEffect, useState } from "react";
import { loadMuseumCollection, MuseumAccession } from "@/lib/museum";
import { MuseumArtifactRuntime } from "./MuseumArtifactRuntime";
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
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The collection register could not be opened.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const state = loading ? "loading" : error ? "error" : accessions.length === 0 ? "empty" : "open";

  return (
    <section
      id="collection"
      className={styles.collection}
      aria-label="AETIMM permanent collection"
      data-collection-state={state}
      data-empty-museum-is-destination="true"
    >
      <div className={styles.roomHeader}>
        <p>PERMANENT COLLECTION</p>
        <span>
          {loading
            ? "reading accession register"
            : error
              ? "register unavailable"
              : `${accessions.length} accession${accessions.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading && (
        <div className={styles.emptyChamber} aria-live="polite">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <p className={styles.accession}>ACCESSION REGISTER</p>
          <h2>Opening the collection.</h2>
          <p>The room is already here. The register is being read.</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.emptyChamber} role="alert">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <p className={styles.accession}>PERMANENT COLLECTION</p>
          <h2>The register is unavailable.</h2>
          <p>The Museum remains open. No false collection is substituted.</p>
        </div>
      )}

      {!loading && !error && accessions.length === 0 && (
        <div className={styles.emptyChamber} aria-label="Empty Museum collection">
          <div className={styles.voidPedestal} aria-hidden="true" />
          <p className={styles.accession}>ACCESSION 000000</p>
          <h2>The hall is empty.</h2>
          <p>No Artifact has crossed the permanent accession threshold yet.</p>
        </div>
      )}

      {!loading && !error && accessions.length > 0 && (
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
                  <MuseumArtifactRuntime artifact={accession} />
                </div>

                <div className={styles.plaque}>
                  <p className={styles.accession}>{accessionLabel(accession.accessionNumber)}</p>
                  <h2>{accession.title}</h2>
                  <p className={styles.creator}>{accession.creator}</p>
                  <p className={styles.summary}>{accession.summary}</p>
                  <p className={styles.form}>
                    {accession.modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ")}
                    {accession.parts.length > 0 ? ` · ${accession.parts.length} material${accession.parts.length === 1 ? "" : "s"}` : ""}
                  </p>
                  <p className={styles.date}>Accessioned {new Date(accession.admittedAt).toLocaleDateString()}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

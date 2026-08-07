"use client";

import { useEffect, useState } from "react";
import { loadMuseumSummit, MuseumSummitArtifact } from "@/lib/museum";
import { MuseumArtifactRuntime } from "./MuseumArtifactRuntime";
import styles from "./MuseumSummit.module.css";

export function MuseumSummit() {
  const [summit, setSummit] = useState<MuseumSummitArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadMuseumSummit()
      .then((artifact) => {
        if (!cancelled) setSummit(artifact);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The Summit register could not be read.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="summit"
      className={styles.summit}
      aria-label="Current Museum Summit"
      data-summit-law="all-time-museum-votes-only"
      data-summit-state={loading ? "loading" : error ? "error" : summit ? "occupied" : "vacant"}
    >
      <div className={styles.heading}>
        <div>
          <p>THE SUMMIT</p>
          <h2>Current Apex Artifact</h2>
        </div>
        <span>NO TRENDING · NO DECAY · NO SLOP SUBTRACTION</span>
      </div>

      <div className={styles.peak}>
        <div className={styles.mountain} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        {loading && (
          <div className={styles.vacant} aria-live="polite">
            <span>SUMMIT REGISTER</span>
            <strong>Locating the current apex.</strong>
          </div>
        )}

        {!loading && error && (
          <div className={styles.vacant} role="alert">
            <span>SUMMIT REGISTER</span>
            <strong>The peak remains, but its register is unavailable.</strong>
          </div>
        )}

        {!loading && !error && !summit && (
          <div className={styles.vacant}>
            <span>THE PEAK IS UNCLAIMED</span>
            <strong>One Museum vote can crown the first Artifact.</strong>
          </div>
        )}

        {!loading && !error && summit && (
          <article className={styles.apex} data-current-summit-artifact={summit.artifactId}>
            <div className={styles.crown} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>

            <div className={styles.objectStage}>
              <MuseumArtifactRuntime artifact={summit} />
            </div>

            <div className={styles.plaque}>
              <p>CURRENT SUMMIT · ALL-TIME MUSEUM SIGNAL {summit.museumVotes.toLocaleString()}</p>
              <h3>{summit.title}</h3>
              <span>{summit.creator}</span>
              <small>
                Holds the peak until another public Artifact accumulates more Museum judgments.
              </small>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

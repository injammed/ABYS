"use client";

import { useEffect, useState } from "react";
import { LexiconText } from "./LexiconBroadcast";
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
      data-lexicon-surface="true"
    >
      <div className={styles.heading}>
        <div>
          <LexiconText as="p" text="THE SUMMIT" phase={7} />
          <LexiconText as="h2" text="Current Apex Artifact" phase={13} />
        </div>
        <LexiconText text="NO TRENDING · NO DECAY · NO SLOP SUBTRACTION" phase={19} />
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
            <LexiconText text="SUMMIT REGISTER" phase={23} />
            <LexiconText as="strong" text="Locating the current apex." phase={29} />
          </div>
        )}

        {!loading && error && (
          <div className={styles.vacant} role="alert" aria-label="The peak remains, but its register is unavailable.">
            <LexiconText text="SUMMIT REGISTER" phase={31} semantic={false} />
            <LexiconText as="strong" text="The peak remains, but its register is unavailable." phase={37} semantic={false} />
          </div>
        )}

        {!loading && !error && !summit && (
          <div className={styles.vacant}>
            <LexiconText text="THE PEAK IS UNCLAIMED" phase={41} />
            <LexiconText as="strong" text="One Museum vote can crown the first Artifact." phase={43} />
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
              <LexiconText
                as="p"
                text={`CURRENT SUMMIT · ALL-TIME MUSEUM SIGNAL ${summit.museumVotes.toLocaleString()}`}
                phase={47}
              />
              <LexiconText as="h3" text={summit.title} phase={53} />
              <LexiconText text={summit.creator} phase={59} />
              <LexiconText
                as="small"
                text="Holds the peak until another public Artifact accumulates more Museum judgments."
                phase={61}
              />
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

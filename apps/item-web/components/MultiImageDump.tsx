"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArtifactPart } from "@/lib/feed";
import { InitialLeaseArtifactMedia } from "./InitialLeaseArtifactMedia";
import styles from "./ArtifactRuntime.module.css";

export function MultiImageDump({ parts }: { parts: ArtifactPart[] }) {
  const images = useMemo(
    () => parts
      .filter((part) => part.mode === "image" && part.partKind === "file")
      .sort((a, b) => a.position - b.position),
    [parts],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= images.length) setIndex(Math.max(0, images.length - 1));
  }, [images.length, index]);

  if (images.length < 2) return null;

  const current = images[index];
  const previous = () => setIndex((value) => (value - 1 + images.length) % images.length);
  const next = () => setIndex((value) => (value + 1) % images.length);

  return (
    <div
      className={styles.dump}
      data-image-dump="true"
      tabIndex={0}
      role="group"
      aria-label={`Image dump · ${images.length} images`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          previous();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        }
      }}
    >
      <InitialLeaseArtifactMedia
        kind="image"
        className={styles.image}
        initialUrl={current.signedUrl}
        partId={current.id}
        ariaLabel={`Artifact image ${index + 1} of ${images.length}`}
      />

      <button
        className={`${styles.dumpNav} ${styles.dumpPrev}`}
        type="button"
        onClick={previous}
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        className={`${styles.dumpNav} ${styles.dumpNext}`}
        type="button"
        onClick={next}
        aria-label="Next image"
      >
        ›
      </button>

      <div className={styles.dumpCounter} aria-live="polite">
        {index + 1} / {images.length}
      </div>

      <div className={styles.dumpDots} aria-label="Choose image">
        {images.map((part, dotIndex) => (
          <button
            key={part.id}
            type="button"
            className={dotIndex === index ? styles.dumpDotActive : styles.dumpDot}
            onClick={() => setIndex(dotIndex)}
            aria-label={`Show image ${dotIndex + 1}`}
            aria-current={dotIndex === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export function SubmissionLandingBridge() {
  useEffect(() => {
    const landOnPublishedArtifact = (event: Event) => {
      const artifactId = event instanceof CustomEvent
        ? String(event.detail?.artifactId ?? "").trim()
        : "";

      const target = new URL("/", window.location.origin);
      if (artifactId) target.searchParams.set("published", artifactId);
      target.hash = "field";

      // A full navigation is deliberately boring and reliable: it clears the
      // submission panel, rehydrates auth, reloads the newest feed page, and
      // makes the just-published Artifact the first public object without a
      // second client-side state machine.
      window.setTimeout(() => window.location.assign(target.toString()), 180);
    };

    window.addEventListener("aetimm:submission-created", landOnPublishedArtifact);
    return () => window.removeEventListener("aetimm:submission-created", landOnPublishedArtifact);
  }, []);

  return null;
}

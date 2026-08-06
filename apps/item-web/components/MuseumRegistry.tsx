"use client";

import { useEffect, useMemo, useState } from "react";
import { loadMuseumRegistry } from "@/lib/museum";
import type { MuseumArtifact } from "@/lib/museum";
import { socialBackendEnabled } from "@/lib/supabase-browser";

export function MuseumRegistry() {
  const [artifacts, setArtifacts] = useState<MuseumArtifact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(socialBackendEnabled);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!socialBackendEnabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadMuseumRegistry()
      .then((entries) => {
        if (cancelled) return;
        setArtifacts(entries);
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "The Museum registry could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => artifacts.find((artifact) => artifact.id === selectedId) ?? null,
    [artifacts, selectedId],
  );

  return (
    <section className="museum-registry" aria-label="AETIMM admitted artifact registry">
      <div className="museum-registry-heading">
        <div>
          <p className="eyebrow">FINITE ROOM · SELECTION RECEIPTS</p>
          <h2>Admitted works remain in place.</h2>
        </div>
        <p>{artifacts.length} of 24 room positions occupied</p>
      </div>

      {loading && <p className="museum-state">Opening the room…</p>}
      {message && <p className="museum-state" role="alert">{message}</p>}
      {!loading && !message && artifacts.length === 0 && (
        <p className="museum-state">No artifact has completed selection review and Museum admission yet.</p>
      )}

      {artifacts.length > 0 && (
        <div className="museum-rail" aria-label="Slide sideways through admitted artifacts">
          {artifacts.map((artifact) => (
            <button
              className={selectedId === artifact.id ? "museum-object selected" : "museum-object"}
              type="button"
              key={artifact.id}
              onClick={() => setSelectedId(artifact.id)}
              aria-pressed={selectedId === artifact.id}
            >
              <span className="museum-object-media">
                {artifact.mediaUrl ? <img src={artifact.mediaUrl} alt="" /> : <span>Preview unavailable</span>}
              </span>
              <strong>{artifact.title}</strong>
              <small>{artifact.creatorName}</small>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="museum-inspection" role="dialog" aria-modal="false" aria-label={`Inspect ${selected.title}`}>
          <button className="museum-close" type="button" onClick={() => setSelectedId(null)}>
            Close inspection
          </button>
          <div className="museum-inspection-media">
            {selected.mediaUrl ? <img src={selected.mediaUrl} alt="" /> : <span>Preview unavailable</span>}
          </div>
          <div>
            <p className="eyebrow">PUBLICATION RECORD · {new Date(selected.publishedAt).toLocaleDateString()}</p>
            <h3>{selected.title}</h3>
            <p className="creator">by {selected.creatorName}</p>
            <p>{selected.summary}</p>
            <p className="museum-receipt-note">
              This object reached the room through public publication, judgment evidence, algorithmic nomination, and explicit curator admission. A later fold will expose the immutable admission timestamp and full selection receipt here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

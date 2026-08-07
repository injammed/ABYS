"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";
import {
  CuratorArtifact,
  loadCurrentRole,
  loadCuratorQueue,
  reviewArtifact,
} from "@/lib/moderation";

type ReviewDraft = { note: string };
const DEFAULT_DRAFT: ReviewDraft = { note: "" };

function reviewError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("CURATOR_ROLE_REQUIRED")) return "This account does not have curator authority.";
  if (raw.includes("CURATOR_NOTE_REQUIRED")) return "Every decision requires a note of at least three characters.";
  if (raw.includes("INITIAL_PUBLICATION_REQUIRES_UNJUDGED")) return "Release must return the Artifact to public Unjudged.";
  if (raw.includes("ARTIFACT_NOT_REVIEWABLE")) return "This Artifact changed state and is no longer held. Refresh the queue.";
  return raw || "The hold decision failed.";
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CuratorQueue() {
  const [session, setSession] = useState<Session | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<CuratorArtifact[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [busyArtifact, setBusyArtifact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const artifacts = await loadCuratorQueue();
      setQueue(artifacts);
      setDrafts((current) => {
        const next = { ...current };
        for (const artifact of artifacts) {
          if (!next[artifact.id]) next[artifact.id] = { ...DEFAULT_DRAFT };
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The exceptional hold queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setAuthorized(false);
      return;
    }

    let mounted = true;

    const resolveSession = async (activeSession: Session | null) => {
      if (!mounted) return;
      setSession(activeSession);
      setQueue([]);
      setMessage(null);

      if (!activeSession) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const role = await loadCurrentRole(activeSession.user.id);
        if (!mounted) return;
        const canReview = role === "curator" || role === "admin";
        setAuthorized(canReview);
        if (canReview) await refreshQueue();
        else setLoading(false);
      } catch (error) {
        if (!mounted) return;
        setAuthorized(false);
        setLoading(false);
        setMessage(error instanceof Error ? error.message : "Curator authorization could not be checked.");
      }
    };

    void client.auth.getSession().then(({ data }) => void resolveSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      void resolveSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [refreshQueue]);

  function updateDraft(artifactId: string, note: string) {
    setDrafts((current) => ({ ...current, [artifactId]: { note } }));
  }

  async function decide(
    artifact: CuratorArtifact,
    decision: "approve" | "request_revision" | "reject",
  ) {
    const draft = drafts[artifact.id] ?? DEFAULT_DRAFT;
    if (draft.note.trim().length < 3) {
      setMessage("Write a review note before making a decision.");
      return;
    }

    setBusyArtifact(artifact.id);
    setMessage(null);

    try {
      await reviewArtifact({
        artifactId: artifact.id,
        decision,
        lane: decision === "approve" ? "unjudged" : null,
        note: draft.note.trim(),
      });
      const success = decision === "approve"
        ? `${artifact.title} released to public Unjudged.`
        : decision === "request_revision"
          ? `Revision requested for ${artifact.title}.`
          : `${artifact.title} rejected.`;
      await refreshQueue();
      setMessage(success);
    } catch (error) {
      setMessage(reviewError(error));
    } finally {
      setBusyArtifact(null);
    }
  }

  if (!socialBackendEnabled) {
    return <p className="curator-state">Supabase is not configured for this build.</p>;
  }

  if (loading && authorized === null) {
    return <p className="curator-state">Checking curator authority…</p>;
  }

  if (!session) {
    return <p className="curator-state">Sign in with a curator account to open exceptional holds.</p>;
  }

  if (!authorized) {
    return (
      <div className="curator-state">
        <strong>Curator access denied.</strong>
        <p>This account can submit Artifacts but cannot inspect another creator&apos;s exceptional private hold.</p>
        {message && <p role="alert">{message}</p>}
      </div>
    );
  }

  return (
    <section className="curator-shell" aria-label="Exceptional Artifact hold review queue">
      <div className="curator-toolbar">
        <div>
          <p className="eyebrow">EXCEPTIONAL HOLD · COMPLETE MANIFEST REVIEW</p>
          <h2>{queue.length} held</h2>
          <p>Ordinary uploads do not wait here. This queue exists for safety, legal, integrity, revision, or technical exceptions—not Museum admission.</p>
        </div>
        <button className="upload-trigger" type="button" onClick={() => void refreshQueue()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh holds"}
        </button>
      </div>

      {message && <p className="curator-message" role="status">{message}</p>}

      {!loading && queue.length === 0 && (
        <div className="curator-state">
          <strong>No exceptional holds.</strong>
          <p>That is the normal state. New Artifacts publish directly to the trough after bounded submission checks.</p>
        </div>
      )}

      <div className="curator-list">
        {queue.map((artifact) => {
          const draft = drafts[artifact.id] ?? DEFAULT_DRAFT;
          const busy = busyArtifact === artifact.id;
          return (
            <article className="curator-card" key={artifact.id}>
              <div className="curator-media">
                {artifact.mediaUrl ? (
                  <img src={artifact.mediaUrl} alt="" />
                ) : (
                  <div className="curator-media-missing">No image lead · inspect manifest below</div>
                )}
                <span>EXCEPTIONAL HOLD</span>
              </div>

              <div className="curator-content">
                <div className="artifact-kicker">
                  <span>{artifact.id}</span>
                  <span>{new Date(artifact.created_at).toLocaleString()}</span>
                </div>
                <h3>{artifact.title}</h3>
                <p className="creator">by {artifact.creatorName}</p>
                <p className="summary">{artifact.summary}</p>

                <dl className="curator-facts">
                  <div><dt>Modes</dt><dd>{(artifact.artifact_modes ?? ["image"]).join(" · ")}</dd></div>
                  <div><dt>True nature</dt><dd>{artifact.artifact_description ?? artifact.summary}</dd></div>
                  <div><dt>Origin</dt><dd>{artifact.origin_class}</dd></div>
                  <div><dt>Generator</dt><dd>{artifact.generator}</dd></div>
                  <div><dt>Human role</dt><dd>{artifact.human_role}</dd></div>
                  <div><dt>Provenance</dt><dd>{artifact.provenance_note}</dd></div>
                  <div>
                    <dt>Attestations</dt>
                    <dd>
                      origin {artifact.ai_origin_attested ? "yes" : "no"} · safety {artifact.safety_attested ? "yes" : "no"} · rights {artifact.rights_attested ? "yes" : "no"}
                    </dd>
                  </div>
                </dl>

                <div className="curator-history">
                  <p className="eyebrow">ARTIFACT MANIFEST · {artifact.parts.length || 1} PART{(artifact.parts.length || 1) === 1 ? "" : "S"}</p>
                  {artifact.parts.length === 0 ? (
                    <p>Legacy single-image Artifact. The original media path remains its implicit first part.</p>
                  ) : (
                    artifact.parts.map((part) => (
                      <div key={part.id} className="curator-part">
                        <p>
                          <strong>#{part.position + 1} · {part.mode.toUpperCase()} · {part.part_kind}</strong>
                          {part.original_filename ? ` · ${part.original_filename}` : ""}
                          {part.byte_size !== null ? ` · ${formatBytes(part.byte_size)}` : ""}
                        </p>
                        {part.part_kind === "file" && part.mode === "image" && part.mediaUrl && (
                          <img src={part.mediaUrl} alt="" style={{ maxWidth: "100%", maxHeight: "28rem", objectFit: "contain" }} />
                        )}
                        {part.part_kind === "file" && part.mode !== "image" && part.mediaUrl && (
                          <p><a href={part.mediaUrl} target="_blank" rel="noreferrer">Open private file part</a> · {part.mime_type ?? "unknown MIME"}</p>
                        )}
                        {part.part_kind === "text" && (
                          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{part.text_content}</pre>
                        )}
                        {part.part_kind === "reference" && (
                          <p><strong>Reference recorded, not fetched:</strong> {part.reference_url}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="curator-history">
                  <p className="eyebrow">LIFECYCLE HISTORY</p>
                  {artifact.events.length === 0 ? (
                    <p>No lifecycle events recorded.</p>
                  ) : (
                    artifact.events.map((event) => (
                      <p key={event.id}>
                        <strong>{event.event_type.replaceAll("_", " ")}</strong> · {new Date(event.created_at).toLocaleString()}<br />
                        {event.note}
                      </p>
                    ))
                  )}
                </div>

                <div className="curator-decision">
                  <p className="submission-note"><strong>This is not Museum selection.</strong> Release returns the held Artifact to the public trough. Museum accession is a separate vote-paced institutional record.</p>
                  <label>
                    Required review note
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateDraft(artifact.id, event.target.value)}
                      minLength={3}
                      maxLength={1200}
                      placeholder="State why the Artifact should be released, revised, or rejected."
                      disabled={busy}
                    />
                  </label>

                  <div className="curator-actions">
                    <button type="button" disabled={busy} onClick={() => void decide(artifact, "approve")}>Release → public Unjudged</button>
                    <button type="button" disabled={busy} onClick={() => void decide(artifact, "request_revision")}>Request revision</button>
                    <button type="button" disabled={busy} onClick={() => void decide(artifact, "reject")}>Reject</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

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

type ReviewDraft = {
  note: string;
};

const DEFAULT_DRAFT: ReviewDraft = {
  note: "",
};

function reviewError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("CURATOR_ROLE_REQUIRED")) return "This account does not have curator authority.";
  if (raw.includes("CURATOR_NOTE_REQUIRED")) return "Every decision requires a note of at least three characters.";
  if (raw.includes("INITIAL_PUBLICATION_REQUIRES_UNJUDGED")) return "First publication must enter Unjudged before selection review.";
  if (raw.includes("ARTIFACT_NOT_REVIEWABLE")) return "This artifact changed state and is no longer reviewable. Refresh the queue.";
  return raw || "The curator decision failed.";
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
      setMessage(error instanceof Error ? error.message : "The curator queue could not be loaded.");
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

  function updateDraft(artifactId: string, patch: Partial<ReviewDraft>) {
    setDrafts((current) => ({
      ...current,
      [artifactId]: {
        ...(current[artifactId] ?? DEFAULT_DRAFT),
        ...patch,
      },
    }));
  }

  async function decide(
    artifact: CuratorArtifact,
    decision: "approve" | "request_revision" | "reject",
  ) {
    const draft = drafts[artifact.id] ?? DEFAULT_DRAFT;
    if (draft.note.trim().length < 3) {
      setMessage("Write a curator note before making a decision.");
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
      setMessage(
        decision === "approve"
          ? `${artifact.title} published to Unjudged. Selection begins after public judgments accumulate.`
          : decision === "request_revision"
            ? `Revision requested for ${artifact.title}.`
            : `${artifact.title} rejected.`,
      );
      await refreshQueue();
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
    return <p className="curator-state">Sign in with a curator account to open the review queue.</p>;
  }

  if (!authorized) {
    return (
      <div className="curator-state">
        <strong>Curator access denied.</strong>
        <p>This account can submit artifacts but cannot inspect or publish other creators&apos; private work.</p>
        {message && <p role="alert">{message}</p>}
      </div>
    );
  }

  return (
    <section className="curator-shell" aria-label="Private artifact review queue">
      <div className="curator-toolbar">
        <div>
          <p className="eyebrow">DATABASE-ENFORCED AUTHORITY</p>
          <h2>{queue.length} waiting for quarantine judgment</h2>
          <p>Approval publishes to Unjudged only. Museum admission happens later through the selection queue.</p>
        </div>
        <button className="upload-trigger" type="button" onClick={() => void refreshQueue()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh queue"}
        </button>
      </div>

      {message && <p className="curator-message" role="status">{message}</p>}

      {!loading && queue.length === 0 && (
        <div className="curator-state">
          <strong>The quarantine queue is empty.</strong>
          <p>New submissions will appear here oldest first.</p>
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
                  <div className="curator-media-missing">Private preview unavailable</div>
                )}
                <span>PRIVATE QUARANTINE</span>
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
                  <p className="submission-note">
                    First publication destination: <strong>UNJUDGED</strong>. Preserve, Refine, and Slop judgments then produce selection evidence.
                  </p>

                  <label>
                    Required curator note
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateDraft(artifact.id, { note: event.target.value })}
                      minLength={3}
                      maxLength={1200}
                      placeholder="State why this should enter public judgment, return for revision, or be rejected."
                      disabled={busy}
                    />
                  </label>

                  <div className="curator-actions">
                    <button type="button" disabled={busy} onClick={() => void decide(artifact, "approve")}>Approve → publish Unjudged</button>
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

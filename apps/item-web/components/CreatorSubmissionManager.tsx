"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { OriginClass } from "@/lib/feed";
import {
  CreatorArtifact,
  CreatorRevision,
  loadCreatorArtifacts,
  resubmitArtifact,
  saveCreatorRevision,
} from "@/lib/moderation";

function statusLabel(artifact: CreatorArtifact): string {
  if (artifact.status === "approved") {
    if (artifact.lane === "aetimm") return "Published · AETIMM";
    if (artifact.lane === "slatra") return "Published · SLOP TROUGH";
    return "Published · Unjudged";
  }
  if (artifact.status === "needs_revision") return "Revision requested";
  if (artifact.status === "quarantine") return "Private quarantine · awaiting review";
  if (artifact.status === "rejected") return "Rejected · remains private";
  return "Removed";
}

function latestDecision(artifact: CreatorArtifact) {
  return artifact.events.find((event) =>
    ["request_revision", "approve", "reject", "remove", "restore"].includes(event.event_type)
  );
}

function revisionFromArtifact(artifact: CreatorArtifact): CreatorRevision {
  return {
    title: artifact.title,
    summary: artifact.summary,
    origin_class: artifact.origin_class,
    generator: artifact.generator,
    human_role: artifact.human_role,
    provenance_note: artifact.provenance_note,
  };
}

function lifecycleError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("ARTIFACT_NOT_READY_FOR_RESUBMISSION")) {
    return "This artifact is no longer waiting for revision. Refresh your lifecycle.";
  }
  if (raw.includes("ARTIFACT_OWNER_REQUIRED")) return "This account does not own the artifact.";
  if (raw.toLowerCase().includes("row-level security")) {
    return "The lifecycle update was rejected by the database security policy.";
  }
  return raw || "The submission could not be updated.";
}

export function CreatorSubmissionManager({ session }: { session: Session }) {
  const [artifacts, setArtifacts] = useState<CreatorArtifact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CreatorRevision>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadCreatorArtifacts(session.user.id);
      setArtifacts(next);
      setDrafts((current) => {
        const updated = { ...current };
        for (const artifact of next) {
          if (!updated[artifact.id]) updated[artifact.id] = revisionFromArtifact(artifact);
        }
        return updated;
      });
    } catch (error) {
      setMessage(lifecycleError(error));
    } finally {
      setLoading(false);
    }
  }, [session.user.id]);

  useEffect(() => {
    void refresh();
    const refreshFromEvent = () => void refresh();
    window.addEventListener("aetimm:submission-created", refreshFromEvent);
    window.addEventListener("aetimm:lifecycle-updated", refreshFromEvent);
    return () => {
      window.removeEventListener("aetimm:submission-created", refreshFromEvent);
      window.removeEventListener("aetimm:lifecycle-updated", refreshFromEvent);
    };
  }, [refresh]);

  function updateDraft(artifactId: string, patch: Partial<CreatorRevision>) {
    setDrafts((current) => ({
      ...current,
      [artifactId]: {
        ...current[artifactId],
        ...patch,
      },
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>, artifact: CreatorArtifact, resubmit: boolean) {
    event.preventDefault();
    const draft = drafts[artifact.id] ?? revisionFromArtifact(artifact);
    setBusyId(artifact.id);
    setMessage(null);

    try {
      await saveCreatorRevision(artifact.id, session.user.id, draft);
      if (resubmit) await resubmitArtifact(artifact.id);

      setMessage(
        resubmit
          ? `${draft.title} resubmitted to private quarantine.`
          : `${draft.title} updated while remaining private.`,
      );
      setEditingId(null);
      window.dispatchEvent(new CustomEvent("aetimm:lifecycle-updated"));
      window.dispatchEvent(new CustomEvent("aetimm:submission-created"));
      await refresh();
    } catch (error) {
      setMessage(lifecycleError(error));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && artifacts.length === 0) {
    return <p className="submission-note">Loading artifact lifecycle…</p>;
  }

  return (
    <section className="creator-lifecycle" aria-label="My artifact lifecycle">
      <div className="creator-lifecycle-heading">
        <p className="eyebrow">MY ARTIFACTS</p>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {message && <p className="submission-note" role="status">{message}</p>}

      {artifacts.length === 0 ? (
        <p className="submission-note">No artifacts submitted yet.</p>
      ) : (
        artifacts.map((artifact) => {
          const decision = latestDecision(artifact);
          const editable = artifact.status === "quarantine" || artifact.status === "needs_revision";
          const editing = editingId === artifact.id;
          const busy = busyId === artifact.id;
          const draft = drafts[artifact.id] ?? revisionFromArtifact(artifact);

          return (
            <article className={`creator-artifact creator-artifact-${artifact.status}`} key={artifact.id}>
              <div className="creator-artifact-header">
                <div>
                  <strong>{artifact.title}</strong>
                  <span>{statusLabel(artifact)}</span>
                </div>
                {editable && !editing && (
                  <button type="button" onClick={() => setEditingId(artifact.id)}>
                    {artifact.status === "needs_revision" ? "Revise" : "Edit"}
                  </button>
                )}
              </div>

              <p className="creator-artifact-time">
                Submitted {new Date(artifact.created_at).toLocaleString()}
                {artifact.published_at ? ` · published ${new Date(artifact.published_at).toLocaleString()}` : ""}
              </p>

              {decision && (
                <div className="creator-decision-note">
                  <b>{decision.event_type.replace("_", " ")}</b>
                  <span>{new Date(decision.created_at).toLocaleString()}</span>
                  <p>{decision.note}</p>
                </div>
              )}

              {editing && (
                <form className="creator-revision-form" onSubmit={(event) => void save(event, artifact, artifact.status === "needs_revision")}>
                  <label>
                    Artifact title
                    <input
                      value={draft.title}
                      onChange={(event) => updateDraft(artifact.id, { title: event.target.value })}
                      required
                      maxLength={100}
                      disabled={busy}
                    />
                  </label>

                  <label>
                    Summary
                    <textarea
                      value={draft.summary}
                      onChange={(event) => updateDraft(artifact.id, { summary: event.target.value })}
                      required
                      minLength={10}
                      maxLength={600}
                      disabled={busy}
                    />
                  </label>

                  <label>
                    Origin class
                    <select
                      value={draft.origin_class}
                      onChange={(event) => updateDraft(artifact.id, { origin_class: event.target.value as OriginClass })}
                      disabled={busy}
                    >
                      <option value="human_ai_hybrid">Human–AI hybrid</option>
                      <option value="ai_directed">Human-directed AI</option>
                      <option value="autonomous_ai_run">Autonomous AI run</option>
                      <option value="ai_origin_unverified">AI origin unverified</option>
                    </select>
                  </label>

                  <label>
                    Generator / model
                    <input
                      value={draft.generator}
                      onChange={(event) => updateDraft(artifact.id, { generator: event.target.value })}
                      required
                      minLength={2}
                      maxLength={120}
                      disabled={busy}
                    />
                  </label>

                  <label>
                    Human role
                    <textarea
                      value={draft.human_role}
                      onChange={(event) => updateDraft(artifact.id, { human_role: event.target.value })}
                      required
                      minLength={15}
                      maxLength={800}
                      disabled={busy}
                    />
                  </label>

                  <label>
                    Provenance note
                    <textarea
                      value={draft.provenance_note}
                      onChange={(event) => updateDraft(artifact.id, { provenance_note: event.target.value })}
                      required
                      minLength={30}
                      maxLength={1600}
                      disabled={busy}
                    />
                  </label>

                  <p className="submission-note">
                    Image replacement is not part of this fold. Metadata and provenance may be revised without changing the private source file.
                  </p>

                  <div className="creator-revision-actions">
                    <button className="submit-button" type="submit" disabled={busy}>
                      {busy
                        ? "Saving…"
                        : artifact.status === "needs_revision"
                          ? "Save + resubmit for review"
                          : "Save private changes"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              )}

              <details className="creator-history">
                <summary>Lifecycle history · {artifact.events.length} events</summary>
                {artifact.events.length === 0 ? (
                  <p>Lifecycle history activates after migration 002 is applied.</p>
                ) : (
                  artifact.events.map((event) => (
                    <p key={event.id}>
                      <b>{event.event_type.replace("_", " ")}</b> · {new Date(event.created_at).toLocaleString()}<br />
                      {event.note}
                    </p>
                  ))
                )}
              </details>
            </article>
          );
        })
      )}
    </section>
  );
}

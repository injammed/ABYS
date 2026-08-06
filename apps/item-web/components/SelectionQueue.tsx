"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadSelectionReviewQueue,
  nominateTopDecile,
  reviewSelectionCandidate,
  SelectionDecision,
  SelectionReview,
} from "@/lib/selection";

function selectionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("CURATOR_ROLE_REQUIRED")) return "This account does not have curator authority.";
  if (raw.includes("NO_ELIGIBLE_SELECTION_COHORT")) return "No approved Unjudged artifacts have enough judgments yet.";
  if (raw.includes("INVALID_MINIMUM_JUDGMENTS")) return "Minimum judgments must be between 1 and 1,000.";
  if (raw.includes("SELECTION_NOTE_REQUIRED")) return "Every selection decision requires a note of at least three characters.";
  if (raw.includes("SELECTION_CANDIDATE_REQUIRED")) return "Mark the nomination as a candidate before admitting it to the Museum.";
  if (raw.includes("MUSEUM_ADMISSION_REQUIRES_UNJUDGED")) return "Only a published Unjudged artifact can enter the Museum through this fold.";
  if (raw.includes("SELECTION_REVIEW_FINALIZED")) return "This selection review is already final.";
  if (raw.includes("get_selection_review_queue") || raw.includes("nominate_top_decile")) {
    return "Selection Fold S-00 is not active in the database yet.";
  }
  return raw || "Selection action failed.";
}

export function SelectionQueue() {
  const [queue, setQueue] = useState<SelectionReview[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [minJudgments, setMinJudgments] = useState(3);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const reviews = await loadSelectionReviewQueue();
      setQueue(reviews);
      setNotes((current) => {
        const next = { ...current };
        for (const review of reviews) {
          if (next[review.selection_id] === undefined) next[review.selection_id] = "";
        }
        return next;
      });
    } catch (error) {
      setQueue([]);
      setMessage(selectionError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runNomination() {
    setBusy("nominate");
    setMessage(null);
    try {
      const runId = await nominateTopDecile(minJudgments);
      setMessage(`Top-decile nomination recorded in run ${runId}.`);
      await refresh();
    } catch (error) {
      setMessage(selectionError(error));
    } finally {
      setBusy(null);
    }
  }

  async function decide(review: SelectionReview, decision: SelectionDecision) {
    const note = (notes[review.selection_id] ?? "").trim();
    if (note.length < 3) {
      setMessage("Write a selection note before making a decision.");
      return;
    }

    setBusy(`${review.selection_id}:${decision}`);
    setMessage(null);
    try {
      await reviewSelectionCandidate({
        selectionId: review.selection_id,
        decision,
        note,
      });
      setMessage(
        decision === "museum_admit"
          ? `${review.title} admitted to the AETIMM Museum.`
          : `${review.title} routed to ${decision}.`,
      );
      await refresh();
    } catch (error) {
      setMessage(selectionError(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="curator-shell" aria-label="Caechat top-decile selection review">
      <div className="curator-toolbar">
        <div>
          <p className="eyebrow">CAECHAT SELECTION REHEARSAL · V0</p>
          <h2>Top decile nominates. Curators decide.</h2>
          <p>
            Only approved Unjudged artifacts enter this cohort. The displayed score is a Wilson lower bound on Preserve judgments, not a claim of objective quality or automatic Canon.
          </p>
        </div>

        <div className="curator-actions">
          <label>
            Minimum judgments
            <input
              type="number"
              min={1}
              max={1000}
              value={minJudgments}
              onChange={(event) => setMinJudgments(Number(event.target.value))}
              disabled={busy !== null}
            />
          </label>
          <button type="button" onClick={() => void runNomination()} disabled={busy !== null}>
            {busy === "nominate" ? "Nominating…" : "Run top-decile nomination"}
          </button>
          <button className="upload-trigger" type="button" onClick={() => void refresh()} disabled={loading || busy !== null}>
            {loading ? "Refreshing…" : "Refresh selection queue"}
          </button>
        </div>
      </div>

      {message && <p className="curator-message" role="status">{message}</p>}

      {!loading && queue.length === 0 && !message && (
        <div className="curator-state">
          <strong>No active selection nominations.</strong>
          <p>Publish artifacts to Unjudged, collect judgments, then run the top-decile nomination.</p>
        </div>
      )}

      <div className="curator-list">
        {queue.map((review) => {
          const active = busy?.startsWith(`${review.selection_id}:`) ?? false;
          return (
            <article className="curator-card" key={review.selection_id}>
              <div className="curator-media">
                {review.mediaUrl ? (
                  <img src={review.mediaUrl} alt="" />
                ) : (
                  <div className="curator-media-missing">Selection preview unavailable</div>
                )}
                <span>{review.selection_status.toUpperCase()}</span>
              </div>

              <div className="curator-content">
                <div className="artifact-kicker">
                  <span>RANK {review.cohort_rank} / {review.cohort_size}</span>
                  <span>{review.algorithm_version}</span>
                </div>
                <h3>{review.title}</h3>
                <p className="creator">by {review.creator_name}</p>

                <dl className="curator-facts">
                  <div><dt>Confidence-adjusted Preserve</dt><dd>{(review.selection_score * 100).toFixed(2)}%</dd></div>
                  <div><dt>Preserve</dt><dd>{review.preserve_count}</dd></div>
                  <div><dt>Refine</dt><dd>{review.refine_count}</dd></div>
                  <div><dt>Slop</dt><dd>{review.slop_count}</dd></div>
                  <div><dt>Total judgments</dt><dd>{review.total_judgments}</dd></div>
                  <div><dt>Nomination evidence</dt><dd>{review.selection_note}</dd></div>
                </dl>

                <div className="curator-decision">
                  <label>
                    Required selection note
                    <textarea
                      value={notes[review.selection_id] ?? ""}
                      onChange={(event) => setNotes((current) => ({
                        ...current,
                        [review.selection_id]: event.target.value,
                      }))}
                      minLength={3}
                      maxLength={1200}
                      placeholder="Explain why this should advance, return for refinement, be archived, rejected, or admitted to the Museum."
                      disabled={active}
                    />
                  </label>

                  <div className="curator-actions">
                    <button type="button" disabled={active} onClick={() => void decide(review, "candidate")}>Mark candidate</button>
                    <button type="button" disabled={active} onClick={() => void decide(review, "refinement")}>Request refinement</button>
                    <button type="button" disabled={active} onClick={() => void decide(review, "archive")}>Archive</button>
                    <button type="button" disabled={active} onClick={() => void decide(review, "reject")}>Reject selection</button>
                    {review.selection_status === "candidate" && (
                      <button type="button" disabled={active} onClick={() => void decide(review, "museum_admit")}>Admit to Museum</button>
                    )}
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

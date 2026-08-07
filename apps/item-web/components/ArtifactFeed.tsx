"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { FeedArtifact, makeFeedBatch, originClassLabels } from "@/lib/feed";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";
import {
  Judgment,
  loadOwnQuarantinePreviews,
  loadOwnVotes,
  loadPublicFeedPage,
  saveVote,
} from "@/lib/social-feed";
import {
  didVoteOwnerChange,
  replaceHydratedVotes,
  shouldApplyVoteHydration,
} from "@/lib/vote-state";
import styles from "./ArtifactFeed.module.css";

type VoteRequestState = {
  state: "saving" | "saved" | "error";
  message: string;
};

function SlopGlyph() {
  return (
    <svg className={styles.voteGlyph} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 17c8-7 17-8 27-3l9 5-13 20c-3 5-8 7-13 4l-7-4c-5-3-7-9-4-14l1-2" />
      <path d="M31 38c0 7-2 12-5 12s-4-5-2-10" />
      <path d="M42 29c4 8 3 15-1 16-3 1-5-3-4-8" />
      <path d="M13 50c8 4 18 4 28 0 5-2 10-2 14 1" />
    </svg>
  );
}

function MuseumGlyph() {
  return (
    <svg className={styles.voteGlyph} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="33" rx="23" ry="8" />
      <ellipse cx="32" cy="33" rx="18" ry="15" transform="rotate(24 32 33)" />
      <ellipse cx="32" cy="33" rx="18" ry="15" transform="rotate(-24 32 33)" />
      <path d="M32 48V15" />
      <path d="m25 22 7-8 7 8" />
      <circle cx="32" cy="33" r="3" />
    </svg>
  );
}

function appendUnique(current: FeedArtifact[], incoming: FeedArtifact[]): FeedArtifact[] {
  const existing = new Set(current.map((artifact) => artifact.id));
  return [...current, ...incoming.filter((artifact) => !existing.has(artifact.id))];
}

export function ArtifactFeed() {
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>(() =>
    socialBackendEnabled ? [] : makeFeedBatch(0)
  );
  const [privatePreviews, setPrivatePreviews] = useState<FeedArtifact[]>([]);
  const [judgments, setJudgments] = useState<Record<string, Judgment>>({});
  const [voteStates, setVoteStates] = useState<Record<string, VoteRequestState>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [batch, setBatch] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(socialBackendEnabled);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const voteOwnerRef = useRef<string | null>(null);
  const voteHydrationVersionRef = useRef(0);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const applySession = (nextSession: Session | null) => {
      const nextOwnerId = nextSession?.user.id ?? null;

      if (didVoteOwnerChange(voteOwnerRef.current, nextOwnerId)) {
        voteOwnerRef.current = nextOwnerId;
        voteHydrationVersionRef.current += 1;
        setJudgments({});
        setVoteStates({});
        setVoteMessage(null);
      }

      setSession(nextSession);
    };

    void client.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!socialBackendEnabled) return;
    let cancelled = false;

    setLoading(true);
    setFeedError(null);
    setArtifacts([]);
    setCursor(null);
    setHasMore(true);

    void loadPublicFeedPage()
      .then((page) => {
        if (cancelled) return;
        setArtifacts(page.artifacts);
        setCursor(page.nextCursor);
        setHasMore(Boolean(page.nextCursor));
      })
      .catch((error) => {
        if (cancelled) return;
        setFeedError(error instanceof Error ? error.message : "The trough could not be loaded.");
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socialBackendEnabled) return;

    const userId = session?.user.id;
    if (!userId) {
      setPrivatePreviews([]);
      return;
    }

    let cancelled = false;

    const refreshPreviews = () => {
      void loadOwnQuarantinePreviews(userId)
        .then((previews) => {
          if (!cancelled) setPrivatePreviews(previews);
        })
        .catch(() => {
          if (!cancelled) setPrivatePreviews([]);
        });
    };

    refreshPreviews();
    window.addEventListener("aetimm:submission-created", refreshPreviews);

    return () => {
      cancelled = true;
      window.removeEventListener("aetimm:submission-created", refreshPreviews);
    };
  }, [session?.user.id]);

  useEffect(() => {
    if (!socialBackendEnabled) return;

    const userId = session?.user.id ?? null;
    const publicArtifactIds = artifacts.map((artifact) => artifact.id);

    if (!userId || publicArtifactIds.length === 0) {
      setJudgments({});
      return;
    }

    let cancelled = false;
    const requestVersion = voteHydrationVersionRef.current + 1;
    voteHydrationVersionRef.current = requestVersion;

    void loadOwnVotes(userId, publicArtifactIds)
      .then((votes) => {
        if (cancelled) return;

        if (
          !shouldApplyVoteHydration({
            requestOwnerId: userId,
            currentOwnerId: voteOwnerRef.current,
            requestVersion,
            currentVersion: voteHydrationVersionRef.current,
          })
        ) {
          return;
        }

        setJudgments(replaceHydratedVotes(votes));
      })
      .catch(() => {
        // The public trough remains usable if personal vote hydration fails.
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, artifacts]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loading) return;

        if (!socialBackendEnabled) {
          setArtifacts((current) => [...current, ...makeFeedBatch(batch)]);
          setBatch((value) => value + 1);
          return;
        }

        if (!hasMore || !cursor) return;
        setLoading(true);
        void loadPublicFeedPage({ cursor })
          .then((page) => {
            setArtifacts((current) => appendUnique(current, page.artifacts));
            setCursor(page.nextCursor);
            setHasMore(Boolean(page.nextCursor));
          })
          .catch((error) => {
            setFeedError(error instanceof Error ? error.message : "More slop could not be loaded.");
            setHasMore(false);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: "500px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batch, cursor, hasMore, loading]);

  const visible = useMemo(
    () => socialBackendEnabled ? appendUnique(privatePreviews, artifacts) : artifacts,
    [artifacts, privatePreviews],
  );

  async function judge(id: string, judgment: Judgment) {
    setVoteMessage(null);

    const artifact = visible.find((entry) => entry.id === id);
    if (artifact?.visibility === "creator_preview") {
      setVoteMessage("Judgment unlocks when this Artifact enters the public trough.");
      return;
    }

    if (!socialBackendEnabled) {
      setJudgments((current) => ({ ...current, [id]: judgment }));
      setVoteStates((current) => ({
        ...current,
        [id]: { state: "saved", message: judgment === "preserve" ? "Museum." : "Slop." },
      }));
      return;
    }

    const voterId = session?.user.id;
    if (!voterId) {
      setVoteMessage("Sign in to vote. Or keep scrolling.");
      return;
    }

    if (voteStates[id]?.state === "saving") return;

    voteHydrationVersionRef.current += 1;
    const prior = judgments[id];
    setJudgments((current) => ({ ...current, [id]: judgment }));
    setVoteStates((current) => ({
      ...current,
      [id]: { state: "saving", message: "Saving…" },
    }));

    try {
      await saveVote(id, voterId, judgment);
      if (voteOwnerRef.current !== voterId) return;

      setVoteStates((current) => ({
        ...current,
        [id]: {
          state: "saved",
          message: judgment === "preserve" ? "Museum." : "Slop.",
        },
      }));
    } catch (error) {
      if (voteOwnerRef.current !== voterId) return;

      setJudgments((current) => {
        const next = { ...current };
        if (prior) next[id] = prior;
        else delete next[id];
        return next;
      });
      setVoteStates((current) => ({
        ...current,
        [id]: {
          state: "error",
          message: error instanceof Error ? error.message : "Vote could not be saved.",
        },
      }));
    }
  }

  return (
    <section className="feed-shell" aria-label="Infinite machine-made Artifact feed">
      <div className="feed-rule">
        <span className="signal-dot" aria-hidden="true" />
        MACHINE-MADE ONLY · SCROLL · VOTE OR IGNORE
      </div>

      {privatePreviews.length > 0 && (
        <p className="private-feed-notice" role="status">
          PRIVATE HOLD · Exceptional held Artifacts appear only to their creator until released or removed.
        </p>
      )}

      {voteMessage && <p className="judgment-confirmation" role="status">{voteMessage}</p>}
      {feedError && <p className="judgment-confirmation" role="alert">{feedError}</p>}

      <div className="artifact-list">
        {visible.map((artifact) => {
          const judgment = judgments[artifact.id];
          const voteState = voteStates[artifact.id];
          const votePending = voteState?.state === "saving";
          const autonomous = artifact.aiOrigin.originClass === "autonomous_ai_run";
          const creatorPreview = artifact.visibility === "creator_preview";
          const museumAdmitted = artifact.lane === "aetimm" && !creatorPreview;

          return (
            <article
              className={creatorPreview ? "artifact-card private-preview-card" : "artifact-card"}
              key={artifact.id}
              data-swipe-voting={creatorPreview ? undefined : "enabled"}
              data-museum-admitted={museumAdmitted ? "true" : undefined}
            >
              <div className="artifact-visual" style={{ background: artifact.gradient }}>
                {artifact.mediaUrl && (
                  <img
                    src={artifact.mediaUrl}
                    alt=""
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <div className="visual-noise" />

                <div className={styles.statusMarks} aria-label="Artifact status">
                  {creatorPreview && <span className={styles.privateMark}>PRIVATE HOLD</span>}
                  {museumAdmitted && <span className={styles.museumMark}>MUSEUM</span>}
                  {!creatorPreview && artifact.slopRank && (
                    <span className={styles.slopRankScar} aria-label={`Top Slop rank ${artifact.slopRank}`}>
                      TOP SLOP #{artifact.slopRank}
                    </span>
                  )}
                </div>
              </div>

              <div className="artifact-body">
                <div className="artifact-kicker">
                  <span>{artifact.id.split("-").slice(0, 3).join("-")}</span>
                  <span>{artifact.modalLead}</span>
                </div>
                <h2>{artifact.title}</h2>
                <p className="creator">by {artifact.creator}</p>
                <p className="summary">{artifact.summary}</p>

                {creatorPreview && (
                  <p className="private-preview-note">
                    Visible only to you. This Artifact has not entered public judgment.
                  </p>
                )}

                <details className={styles.details}>
                  <summary>Provenance</summary>
                  <div className="origin-strip">
                    <span className={autonomous ? "origin-pill autonomous" : "origin-pill"}>
                      {originClassLabels[artifact.aiOrigin.originClass]}
                    </span>
                    <span>{artifact.aiOrigin.confidence}</span>
                  </div>
                  <div className="provenance">
                    <strong>AI provenance</strong>
                    <span>{artifact.aiOrigin.generator ?? "Generator undisclosed"}</span>
                    <p>{artifact.aiOrigin.provenanceNote}</p>
                    <p><b>Human role:</b> {artifact.aiOrigin.humanRole}</p>
                    {artifact.aiOrigin.automationManifest && (
                      <p>
                        <b>Automation manifest:</b> {artifact.aiOrigin.automationManifest.trigger}; run log {artifact.aiOrigin.automationManifest.runLogAvailable ? "available" : "missing"}; human intervention after trigger {artifact.aiOrigin.automationManifest.humanInterventionAfterTrigger ? "reported" : "not reported"}.
                      </p>
                    )}
                  </div>
                </details>

                {creatorPreview ? (
                  <div className="preview-judgment-lock">Voting locked while held.</div>
                ) : (
                  <div
                    className={`${styles.ballot} judgment-row`}
                    data-vote-contract="binary-slop-museum-v3-glyph"
                    aria-label="Vote Slop or Museum"
                    aria-busy={votePending}
                  >
                    <button
                      className={`${styles.voteButton} ${styles.slopVote} judge slop${judgment === "slop" ? " selected" : ""}`}
                      data-binary-vote="slop"
                      onClick={() => void judge(artifact.id, "slop")}
                      disabled={votePending}
                      aria-label="Vote Slop"
                      aria-pressed={judgment === "slop"}
                    >
                      <SlopGlyph />
                      <span className={styles.srOnly}>Slop</span>
                    </button>
                    <button
                      className={`${styles.voteButton} ${styles.museumVote} judge museum${judgment === "preserve" ? " selected" : ""}`}
                      data-binary-vote="museum"
                      onClick={() => void judge(artifact.id, "preserve")}
                      disabled={votePending}
                      aria-label="Vote Museum"
                      aria-pressed={judgment === "preserve"}
                    >
                      <MuseumGlyph />
                      <span className={styles.srOnly}>Museum</span>
                    </button>
                  </div>
                )}

                {!creatorPreview && voteState && (
                  <p className={`vote-status ${voteState.state}`} role={voteState.state === "error" ? "alert" : "status"} aria-live="polite">
                    {voteState.message}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {socialBackendEnabled && !loading && visible.length === 0 && !feedError && (
        <p className="judgment-confirmation">The trough is empty. Disturbing.</p>
      )}

      <div ref={sentinel} className="feed-sentinel" aria-hidden="true">
        {loading ? "Loading slop…" : hasMore || !socialBackendEnabled ? "More…" : "You reached the bottom. For now."}
      </div>
    </section>
  );
}

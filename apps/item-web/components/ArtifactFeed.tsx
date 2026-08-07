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
import { ArtifactRuntime } from "./ArtifactRuntime";
import { LexiconText } from "./LexiconBroadcast";
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
    <section className="feed-shell" aria-label="Infinite machine-made Artifact feed" data-lexicon-surface="true">
      <div className="feed-rule">
        <span className="signal-dot" aria-hidden="true" />
        <LexiconText text="MACHINE-MADE ONLY · SCROLL · VOTE OR IGNORE" phase={3} />
      </div>

      {privatePreviews.length > 0 && (
        <LexiconText
          as="p"
          className="private-feed-notice"
          text="PRIVATE HOLD · Exceptional held Artifacts appear only to their creator until released or removed."
          phase={7}
        />
      )}

      {voteMessage && (
        <p className="judgment-confirmation" role="status">
          <LexiconText text={voteMessage} phase={11} />
        </p>
      )}
      {feedError && (
        <p className="judgment-confirmation" role="alert" aria-label={feedError}>
          <LexiconText text={feedError} phase={13} semantic={false} />
        </p>
      )}

      <div className="artifact-list">
        {visible.map((artifact, artifactIndex) => {
          const judgment = judgments[artifact.id];
          const voteState = voteStates[artifact.id];
          const votePending = voteState?.state === "saving";
          const autonomous = artifact.aiOrigin.originClass === "autonomous_ai_run";
          const creatorPreview = artifact.visibility === "creator_preview";
          const museumAdmitted = artifact.lane === "aetimm" && !creatorPreview;
          const phase = artifactIndex * 17;
          const automationText = artifact.aiOrigin.automationManifest
            ? `Automation manifest: ${artifact.aiOrigin.automationManifest.trigger}; run log ${artifact.aiOrigin.automationManifest.runLogAvailable ? "available" : "missing"}; human intervention after trigger ${artifact.aiOrigin.automationManifest.humanInterventionAfterTrigger ? "reported" : "not reported"}.`
            : null;

          return (
            <article
              className={creatorPreview ? "artifact-card private-preview-card" : "artifact-card"}
              key={artifact.id}
              data-swipe-voting={creatorPreview ? undefined : "enabled"}
              data-museum-admitted={museumAdmitted ? "true" : undefined}
              data-lexicon-artifact="true"
            >
              <div className="artifact-visual" style={{ background: artifact.gradient }}>
                <ArtifactRuntime artifact={artifact} />
                <div className="visual-noise" />

                <div className={styles.statusMarks} aria-label="Artifact status">
                  {creatorPreview && <LexiconText className={styles.privateMark} text="PRIVATE HOLD" phase={phase + 1} />}
                  {museumAdmitted && <LexiconText className={styles.museumMark} text="MUSEUM" phase={phase + 2} />}
                  {!creatorPreview && artifact.slopRank && (
                    <span className={styles.slopRankScar} aria-label={`Top Slop rank ${artifact.slopRank}`}>
                      <LexiconText text={`TOP SLOP #${artifact.slopRank}`} phase={phase + 3} semantic={false} />
                    </span>
                  )}
                </div>
              </div>

              <div className="artifact-body">
                <div className="artifact-kicker">
                  <LexiconText text={artifact.id.split("-").slice(0, 3).join("-")} phase={phase + 4} />
                  <LexiconText text={artifact.modalLead} phase={phase + 5} />
                </div>
                <LexiconText as="h2" text={artifact.title} phase={phase + 6} />
                <LexiconText as="p" className="creator" text={`by ${artifact.creator}`} phase={phase + 7} />
                <LexiconText as="p" className="summary" text={artifact.summary} phase={phase + 8} />

                {creatorPreview && (
                  <LexiconText
                    as="p"
                    className="private-preview-note"
                    text="Visible only to you. This Artifact has not entered public judgment."
                    phase={phase + 9}
                  />
                )}

                <details className={styles.details}>
                  <summary><LexiconText text="Provenance" phase={phase + 10} /></summary>
                  <div className="origin-strip">
                    <LexiconText
                      className={autonomous ? "origin-pill autonomous" : "origin-pill"}
                      text={originClassLabels[artifact.aiOrigin.originClass]}
                      phase={phase + 11}
                    />
                    <LexiconText text={artifact.aiOrigin.confidence} phase={phase + 12} />
                  </div>
                  <div className="provenance">
                    <LexiconText as="strong" text="AI provenance" phase={phase + 13} />
                    <LexiconText text={artifact.aiOrigin.generator ?? "Generator undisclosed"} phase={phase + 14} />
                    <LexiconText as="p" text={artifact.aiOrigin.provenanceNote} phase={phase + 15} />
                    <LexiconText as="p" text={`Human role: ${artifact.aiOrigin.humanRole}`} phase={phase + 16} />
                    {automationText && <LexiconText as="p" text={automationText} phase={phase + 17} />}
                  </div>
                </details>

                {creatorPreview ? (
                  <LexiconText className="preview-judgment-lock" text="Voting locked while held." phase={phase + 18} />
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
                  <p
                    className={`vote-status ${voteState.state}`}
                    role={voteState.state === "error" ? "alert" : "status"}
                    aria-live="polite"
                    aria-label={voteState.message}
                  >
                    <LexiconText text={voteState.message} phase={phase + 19} semantic={false} />
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {socialBackendEnabled && !loading && visible.length === 0 && !feedError && (
        <LexiconText as="p" className="judgment-confirmation" text="The trough is empty. Disturbing." phase={71} />
      )}

      <div ref={sentinel} className="feed-sentinel" aria-hidden="true">
        <LexiconText
          text={loading ? "Loading slop…" : hasMore || !socialBackendEnabled ? "More…" : "You reached the bottom. For now."}
          phase={79}
          semantic={false}
        />
      </div>
    </section>
  );
}

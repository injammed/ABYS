"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { FeedArtifact, FeedLane, makeFeedBatch, originClassLabels } from "@/lib/feed";
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

function laneLabel(lane: FeedLane): string {
  if (lane === "aetimm") return "AETIMM";
  if (lane === "slatra") return "SLATRA";
  return "UNJUDGED";
}

function appendUnique(current: FeedArtifact[], incoming: FeedArtifact[]): FeedArtifact[] {
  const existing = new Set(current.map((artifact) => artifact.id));
  return [...current, ...incoming.filter((artifact) => !existing.has(artifact.id))];
}

export function ArtifactFeed() {
  const [lane, setLane] = useState<FeedLane | "all">("all");
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>(() =>
    socialBackendEnabled ? [] : makeFeedBatch(0)
  );
  const [privatePreviews, setPrivatePreviews] = useState<FeedArtifact[]>([]);
  const [judgments, setJudgments] = useState<Record<string, Judgment>>({});
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

    void loadPublicFeedPage({ lane })
      .then((page) => {
        if (cancelled) return;
        setArtifacts(page.artifacts);
        setCursor(page.nextCursor);
        setHasMore(Boolean(page.nextCursor));
      })
      .catch((error) => {
        if (cancelled) return;
        setFeedError(error instanceof Error ? error.message : "The public feed could not be loaded.");
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lane]);

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
    const publicArtifactIds = artifacts
      .filter((artifact) => artifact.visibility !== "creator_preview")
      .map((artifact) => artifact.id);

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
        // Public feed remains usable even if personal vote hydration fails.
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
        void loadPublicFeedPage({ cursor, lane })
          .then((page) => {
            setArtifacts((current) => appendUnique(current, page.artifacts));
            setCursor(page.nextCursor);
            setHasMore(Boolean(page.nextCursor));
          })
          .catch((error) => {
            setFeedError(error instanceof Error ? error.message : "More artifacts could not be loaded.");
            setHasMore(false);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: "500px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batch, cursor, hasMore, lane, loading]);

  const visible = useMemo(() => {
    if (!socialBackendEnabled) {
      return artifacts.filter((artifact) => lane === "all" || artifact.lane === lane);
    }

    const previewsForLane = lane === "all" || lane === "unjudged" ? privatePreviews : [];
    return appendUnique(previewsForLane, artifacts);
  }, [artifacts, lane, privatePreviews]);

  async function judge(id: string, judgment: Judgment) {
    setVoteMessage(null);

    const artifact = visible.find((entry) => entry.id === id);
    if (artifact?.visibility === "creator_preview") {
      setVoteMessage("Public judgment unlocks after curator publication.");
      return;
    }

    if (!socialBackendEnabled) {
      setJudgments((current) => ({ ...current, [id]: judgment }));
      return;
    }

    const voterId = session?.user.id;
    if (!voterId) {
      setVoteMessage("Sign in to record a public judgment.");
      return;
    }

    voteHydrationVersionRef.current += 1;
    const prior = judgments[id];
    setJudgments((current) => ({ ...current, [id]: judgment }));

    try {
      await saveVote(id, voterId, judgment);
    } catch (error) {
      if (voteOwnerRef.current !== voterId) return;

      setJudgments((current) => {
        const next = { ...current };
        if (prior) next[id] = prior;
        else delete next[id];
        return next;
      });
      setVoteMessage(error instanceof Error ? error.message : "Vote could not be saved.");
    }
  }

  return (
    <section className="feed-shell" aria-label="AI artifact judgment feed">
      <div className="lane-tabs" role="tablist" aria-label="Feed lanes">
        {(["all", "aetimm", "slatra", "unjudged"] as const).map((value) => (
          <button
            className={lane === value ? "tab active" : "tab"}
            key={value}
            onClick={() => setLane(value)}
            role="tab"
            aria-selected={lane === value}
          >
            {value === "all" ? "Everything AI" : laneLabel(value)}
          </button>
        ))}
      </div>

      <div className="feed-rule">
        <span className="signal-dot" />
        Human-only media is outside the feed. Hybrid, directed, and autonomous AI runs remain visibly separated by provenance.
      </div>

      {privatePreviews.length > 0 && (lane === "all" || lane === "unjudged") && (
        <p className="private-feed-notice" role="status">
          PRIVATE CREATOR PREVIEW · Your quarantined submissions appear here only for your account. They are not public until curator publication.
        </p>
      )}

      {voteMessage && <p className="judgment-confirmation" role="status">{voteMessage}</p>}
      {feedError && <p className="judgment-confirmation" role="alert">{feedError}</p>}

      <div className="artifact-list">
        {visible.map((artifact) => {
          const judgment = judgments[artifact.id];
          const autonomous = artifact.aiOrigin.originClass === "autonomous_ai_run";
          const creatorPreview = artifact.visibility === "creator_preview";

          return (
            <article className={creatorPreview ? "artifact-card private-preview-card" : "artifact-card"} key={artifact.id}>
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
                <div className="lane-badge">
                  {creatorPreview ? "UNJUDGED · PRIVATE PREVIEW" : laneLabel(artifact.lane)}
                </div>
                <div className="score-ring" aria-label={creatorPreview ? "Private preview" : `Score ${artifact.score}`}>
                  {creatorPreview ? "PVT" : artifact.score}
                </div>
              </div>

              <div className="artifact-body">
                <div className="origin-strip">
                  <span className={autonomous ? "origin-pill autonomous" : "origin-pill"}>
                    {originClassLabels[artifact.aiOrigin.originClass]}
                  </span>
                  <span>{artifact.aiOrigin.confidence}</span>
                </div>

                <div className="artifact-kicker">
                  <span>{artifact.id.split("-").slice(0, 3).join("-")}</span>
                  <span>{artifact.modalLead}</span>
                </div>
                <h2>{artifact.title}</h2>
                <p className="creator">by {artifact.creator}</p>
                <p className="summary">{artifact.summary}</p>

                {creatorPreview && (
                  <p className="private-preview-note">
                    Visible only to you. The media remains in private quarantine and has not entered public judgment.
                  </p>
                )}

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

                {creatorPreview ? (
                  <div className="preview-judgment-lock">
                    Preserve · Refine · Slop unlock after curator publication.
                  </div>
                ) : (
                  <div className="judgment-row" aria-label="Judge artifact">
                    <button
                      className={judgment === "preserve" ? "judge preserve selected" : "judge preserve"}
                      onClick={() => void judge(artifact.id, "preserve")}
                    >
                      Preserve
                    </button>
                    <button
                      className={judgment === "refine" ? "judge refine selected" : "judge refine"}
                      onClick={() => void judge(artifact.id, "refine")}
                    >
                      Refine
                    </button>
                    <button
                      className={judgment === "slop" ? "judge slop selected" : "judge slop"}
                      onClick={() => void judge(artifact.id, "slop")}
                    >
                      Slop
                    </button>
                  </div>
                )}

                {judgment && !creatorPreview && (
                  <p className="judgment-confirmation">
                    {socialBackendEnabled ? "Judgment recorded" : "Judgment recorded locally"}: <strong>{judgment}</strong>.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {socialBackendEnabled && !loading && visible.length === 0 && !feedError && (
        <p className="judgment-confirmation">No approved artifacts or private previews are in this lane yet.</p>
      )}

      <div ref={sentinel} className="feed-sentinel" aria-hidden="true">
        {loading ? "Loading synthetic media…" : hasMore || !socialBackendEnabled ? "Scroll for more synthetic media…" : "End of the current feed."}
      </div>
    </section>
  );
}

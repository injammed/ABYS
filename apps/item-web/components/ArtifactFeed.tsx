"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FeedArtifact, FeedLane, makeFeedBatch } from "@/lib/feed";

type Judgment = "preserve" | "slop" | "refine";

function laneLabel(lane: FeedLane): string {
  if (lane === "aetimm") return "AETIMM";
  if (lane === "slatra") return "SLATRA";
  return "UNJUDGED";
}

export function ArtifactFeed() {
  const [lane, setLane] = useState<FeedLane | "all">("all");
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>(() => makeFeedBatch(0));
  const [judgments, setJudgments] = useState<Record<string, Judgment>>({});
  const [batch, setBatch] = useState(1);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArtifacts((current) => [...current, ...makeFeedBatch(batch)]);
        setBatch((value) => value + 1);
      },
      { rootMargin: "500px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batch]);

  const visible = useMemo(
    () => artifacts.filter((artifact) => lane === "all" || artifact.lane === lane),
    [artifacts, lane]
  );

  function judge(id: string, judgment: Judgment) {
    setJudgments((current) => ({ ...current, [id]: judgment }));
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
        AI-made content only. Creator attestation is required; automated detection is advisory, not proof.
      </div>

      <div className="artifact-list">
        {visible.map((artifact) => {
          const judgment = judgments[artifact.id];
          return (
            <article className="artifact-card" key={artifact.id}>
              <div className="artifact-visual" style={{ background: artifact.gradient }}>
                <div className="visual-noise" />
                <div className="lane-badge">{laneLabel(artifact.lane)}</div>
                <div className="score-ring" aria-label={`Score ${artifact.score}`}>
                  {artifact.score}
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

                <div className="provenance">
                  <strong>AI provenance</strong>
                  <span>{artifact.aiOrigin.confidence}</span>
                  <p>{artifact.aiOrigin.provenanceNote}</p>
                </div>

                <div className="judgment-row" aria-label="Judge artifact">
                  <button
                    className={judgment === "preserve" ? "judge preserve selected" : "judge preserve"}
                    onClick={() => judge(artifact.id, "preserve")}
                  >
                    Preserve
                  </button>
                  <button
                    className={judgment === "refine" ? "judge refine selected" : "judge refine"}
                    onClick={() => judge(artifact.id, "refine")}
                  >
                    Refine
                  </button>
                  <button
                    className={judgment === "slop" ? "judge slop selected" : "judge slop"}
                    onClick={() => judge(artifact.id, "slop")}
                  >
                    Slop
                  </button>
                </div>

                {judgment && (
                  <p className="judgment-confirmation">
                    Judgment recorded locally: <strong>{judgment}</strong>. Persistence and reputation arrive with the backend.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div ref={sentinel} className="feed-sentinel" aria-hidden="true">
        Loading more synthetic media…
      </div>
    </section>
  );
}

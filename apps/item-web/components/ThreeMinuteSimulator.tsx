"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ThreeMinuteSimulator.module.css";

type Judgment = "preserve" | "refine" | "slop";
type Speed = 1 | 3 | 10;

type TimelineStage = {
  start: number;
  end: number;
  label: string;
  headline: string;
  detail: string;
};

const TOTAL_SECONDS = 180;

const timeline: TimelineStage[] = [
  {
    start: 0,
    end: 12,
    label: "00:00 — LAUNCH",
    headline: "AETIMM contracts into AI.",
    detail: "The installed square opens as a full name, then resolves into its phone-screen identity: AI — Aeternum Immutablis."
  },
  {
    start: 12,
    end: 28,
    label: "00:12 — ORIENTATION",
    headline: "Two extremes. No human-only feed.",
    detail: "The user enters an AI-only environment and chooses to witness a live autonomous generation run. Hybrid and autonomous provenance remain visibly separate."
  },
  {
    start: 28,
    end: 80,
    label: "00:28 — MACHINE WITNESS",
    headline: "A Full-Mode artifact assembles in public.",
    detail: "Concept, visual field, language, sound structure, simulation logic, interface behavior, and symbolic compression emerge as one observable run."
  },
  {
    start: 80,
    end: 102,
    label: "01:20 — QUARANTINE",
    headline: "Safety and provenance interrupt publication.",
    detail: "The artifact is held while prohibited-content checks, source disclosures, run logs, model versions, and autonomy evidence are inspected."
  },
  {
    start: 102,
    end: 134,
    label: "01:42 — HUMAN JUDGMENT",
    headline: "The user must choose: preserve, refine, or slop.",
    detail: "The system supplies evidence; the person supplies judgment. Silence defaults to refine rather than manufacturing consensus."
  },
  {
    start: 134,
    end: 158,
    label: "02:14 — ROUTING",
    headline: "The judgment changes the artifact’s public trajectory.",
    detail: "Museum-grade work rises toward AETIMM. Safe but worthless residue falls toward SLOP TROUGH™. Nothing unsafe becomes entertainment."
  },
  {
    start: 158,
    end: 176,
    label: "02:38 — LEADERBOARD",
    headline: "The extreme lists oscillate in real time.",
    detail: "AETIMM ranks preservation potential. SLOP TROUGH™ ranks failure patterns and synthetic waste — never the worth of a person."
  },
  {
    start: 176,
    end: 180,
    label: "02:56 — RETURN",
    headline: "One cycle ends. The machine keeps making.",
    detail: "The user can continue into the infinite feed, inspect provenance, or replay the three-minute demonstration."
  }
];

const modalities = [
  { name: "Concept", at: 28 },
  { name: "Visual", at: 36 },
  { name: "Language", at: 44 },
  { name: "Sound", at: 52 },
  { name: "Simulation", at: 60 },
  { name: "Interface", at: 68 },
  { name: "Symbol", at: 76 }
];

function formatTime(totalSeconds: number): string {
  const value = Math.max(0, Math.min(TOTAL_SECONDS, Math.floor(totalSeconds)));
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function currentStage(elapsed: number): TimelineStage {
  return timeline.find((stage) => elapsed >= stage.start && elapsed < stage.end) ?? timeline[timeline.length - 1];
}

export function ThreeMinuteSimulator() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [cycle, setCycle] = useState(1);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      lastTick.current = null;
      return;
    }

    const interval = window.setInterval(() => {
      const now = performance.now();
      const previous = lastTick.current ?? now;
      lastTick.current = now;
      const delta = ((now - previous) / 1000) * speed;

      setElapsed((current) => {
        const next = current + delta;
        if (next >= TOTAL_SECONDS) {
          setRunning(false);
          return TOTAL_SECONDS;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [running, speed]);

  useEffect(() => {
    if (elapsed >= 126 && !judgment) setJudgment("refine");
  }, [elapsed, judgment]);

  const stage = currentStage(elapsed);
  const progress = (elapsed / TOTAL_SECONDS) * 100;
  const safetyPassed = elapsed >= 96;
  const route = judgment === "preserve" ? "AETIMM" : judgment === "slop" ? "SLOP TROUGH™" : "REFINEMENT";
  const routeScore = judgment === "preserve" ? 97 : judgment === "slop" ? 4 : 68;

  const visibleModalities = useMemo(
    () => modalities.map((modality) => ({ ...modality, active: elapsed >= modality.at })),
    [elapsed]
  );

  function start() {
    if (elapsed >= TOTAL_SECONDS) {
      setElapsed(0);
      setJudgment(null);
      setCycle((value) => value + 1);
    }
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    setJudgment(null);
    setCycle((value) => value + 1);
  }

  function seek(value: number) {
    setElapsed(value);
    if (value < 102) setJudgment(null);
  }

  return (
    <section className={styles.simulator} aria-label="Three-minute ITEM beta simulator">
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>WORKING BETA SIMULATOR · CYCLE {cycle.toString().padStart(2, "0")}</p>
          <h1>Three minutes inside AI / ST</h1>
        </div>
        <div className={styles.clock} aria-live="polite">
          <strong>{formatTime(elapsed)}</strong>
          <span>/ 03:00</span>
        </div>
      </header>

      <div className={styles.controls}>
        <button type="button" onClick={running ? () => setRunning(false) : start}>
          {running ? "Pause cycle" : elapsed > 0 && elapsed < TOTAL_SECONDS ? "Resume cycle" : "Start 3-minute cycle"}
        </button>
        <button type="button" className={styles.secondary} onClick={reset}>Replay</button>
        <label>
          Demonstration speed
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as Speed)}>
            <option value={1}>1× — true three minutes</option>
            <option value={3}>3× — one minute</option>
            <option value={10}>10× — eighteen seconds</option>
          </select>
        </label>
      </div>

      <input
        className={styles.scrubber}
        type="range"
        min={0}
        max={TOTAL_SECONDS}
        step={1}
        value={Math.floor(elapsed)}
        onChange={(event) => seek(Number(event.target.value))}
        aria-label="Simulation timeline"
      />
      <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>

      <div className={styles.stageGrid}>
        <article className={styles.narrative}>
          <p className={styles.stageLabel}>{stage.label}</p>
          <h2>{stage.headline}</h2>
          <p>{stage.detail}</p>

          <ol className={styles.timeline}>
            {timeline.map((item) => (
              <li key={item.start} className={elapsed >= item.start ? styles.reached : ""}>
                <button type="button" onClick={() => seek(item.start)}>
                  <span>{formatTime(item.start)}</span>
                  {item.headline}
                </button>
              </li>
            ))}
          </ol>
        </article>

        <div className={styles.phone}>
          <div className={styles.phoneTop}><span /> <b>AI</b> <span /></div>

          {elapsed < 12 && (
            <div className={styles.launchScene}>
              <div className={styles.launchSquare}>AI</div>
              <div className={styles.phaseWord}>
                <span className={elapsed > 5 ? styles.faded : ""}>AETIMM</span>
                <strong className={elapsed > 5 ? styles.visible : ""}>AI</strong>
              </div>
              <p>Aeternum Immutablis</p>
            </div>
          )}

          {elapsed >= 12 && elapsed < 28 && (
            <div className={styles.orientationScene}>
              <p className={styles.phoneEyebrow}>AI-ONLY PUBLIC SPACE</p>
              <h3>Witness what machines make.</h3>
              <div className={styles.extremeDoors}>
                <div><b>AI</b><span>Enduring value</span></div>
                <div><b>ST</b><span>Worthless residue</span></div>
              </div>
              <button type="button" onClick={() => seek(28)}>Witness autonomous run</button>
            </div>
          )}

          {elapsed >= 28 && elapsed < 80 && (
            <div className={styles.generationScene}>
              <p className={styles.phoneEyebrow}>AUTONOMOUS RUN · LIVE</p>
              <div className={styles.alienArtifact}>
                <span className={styles.orbitOne} />
                <span className={styles.orbitTwo} />
                <span className={styles.core} />
              </div>
              <div className={styles.modalityGrid}>
                {visibleModalities.map((modality) => (
                  <span key={modality.name} className={modality.active ? styles.modalityActive : ""}>
                    {modality.name}
                  </span>
                ))}
              </div>
              <p className={styles.machineText}>
                {elapsed < 44 ? "Constructing nonhuman visual grammar…" : elapsed < 60 ? "Binding language and sonic structure…" : "Compressing simulation into symbolic object…"}
              </p>
            </div>
          )}

          {elapsed >= 80 && elapsed < 102 && (
            <div className={styles.quarantineScene}>
              <p className={styles.phoneEyebrow}>PUBLICATION QUARANTINE</p>
              <h3>{safetyPassed ? "Cleared for judgment" : "Inspecting artifact"}</h3>
              <ul>
                <li className={elapsed >= 84 ? styles.pass : ""}>Prohibited-content scan</li>
                <li className={elapsed >= 88 ? styles.pass : ""}>Generation log integrity</li>
                <li className={elapsed >= 92 ? styles.pass : ""}>Autonomy evidence</li>
                <li className={elapsed >= 96 ? styles.pass : ""}>Real-person deception check</li>
              </ul>
              <p>No graphic or illegal content can become public spectacle.</p>
            </div>
          )}

          {elapsed >= 102 && elapsed < 134 && (
            <div className={styles.judgmentScene}>
              <p className={styles.phoneEyebrow}>AUTONOMOUS · VERIFIED RUN</p>
              <div className={styles.artifactMini}><span /></div>
              <h3>The Archive That Dreams Backward</h3>
              <p>Seven-mode object · complete provenance · safety cleared</p>
              <div className={styles.judgmentButtons}>
                {(["preserve", "refine", "slop"] as Judgment[]).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={judgment === value ? styles.selected : ""}
                    onClick={() => setJudgment(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {!judgment && <small>Choose before 02:06. Silence routes to refinement.</small>}
            </div>
          )}

          {elapsed >= 134 && elapsed < 158 && (
            <div className={styles.routingScene}>
              <p className={styles.phoneEyebrow}>PUBLIC ROUTING EVENT</p>
              <div className={judgment === "slop" ? styles.routeSlop : judgment === "preserve" ? styles.routeMuseum : styles.routeRefine}>
                <span>{routeScore}</span>
                <strong>{route}</strong>
              </div>
              <p>
                {judgment === "preserve"
                  ? "The artifact enters the museum candidate queue."
                  : judgment === "slop"
                    ? "The artifact enters the safe synthetic-waste index."
                    : "The artifact returns to reconstruction with its provenance intact."}
              </p>
            </div>
          )}

          {elapsed >= 158 && elapsed < 176 && (
            <div className={styles.leaderboardScene}>
              <p className={styles.phoneEyebrow}>LIVE EXTREME LEADERBOARDS</p>
              <div className={styles.boardMuseum}>
                <b>AETIMM TOP 3</b>
                <ol>
                  <li><span>1</span> The Archive That Dreams Backward <em>▲</em></li>
                  <li><span>2</span> Solar Reliquary <em>—</em></li>
                  <li><span>3</span> Civic Memory Loom <em>▼</em></li>
                </ol>
              </div>
              <div className={styles.boardSlop}>
                <b>SLOP TROUGH™ TOP 3</b>
                <ol>
                  <li><span>1</span> Luxury Portal #88421 <em>▲</em></li>
                  <li><span>2</span> Infinite Crown Residue <em>▲</em></li>
                  <li><span>3</span> Prompt-Pile Galaxy <em>▼</em></li>
                </ol>
              </div>
            </div>
          )}

          {elapsed >= 176 && (
            <div className={styles.completeScene}>
              <div className={styles.completionMark}>03:00</div>
              <h3>The demonstration is complete.</h3>
              <p>One person witnessed one machine run, verified its origin, judged its value, and changed the public rankings.</p>
              <button type="button" onClick={reset}>Run another cycle</button>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.disclosure}>
        <strong>Simulator boundary</strong>
        <p>This beta demonstrates product behavior with deterministic local media and events. It does not claim that a remote model, moderation provider, user database, or live leaderboard is operating yet.</p>
      </footer>
    </section>
  );
}

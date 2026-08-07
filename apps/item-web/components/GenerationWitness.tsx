"use client";

import { useEffect, useMemo, useState } from "react";
import { LexiconText } from "./LexiconBroadcast";

const phases = [
  { mode: "IMAGE", text: "forming impossible orbital anatomy" },
  { mode: "TEXT", text: "compressing doctrine into a civilization object" },
  { mode: "SOUND", text: "mapping mass, distance, and memory into a sonic signature" },
  { mode: "SIMULATION", text: "testing the artifact across a synthetic stellar lifecycle" },
  { mode: "INTERFACE", text: "building a navigable human projection" },
  { mode: "SYMBOL", text: "reducing the object to a durable machine glyph" },
];

const outcomes = [
  "MUSEUM SIGNAL",
  "UNJUDGED",
  "SLOP RESIDUE",
  "UNRESOLVED",
];

export function GenerationWitness() {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1250);
    return () => window.clearInterval(timer);
  }, [running]);

  const phase = phases[tick % phases.length];
  const cycle = Math.floor(tick / phases.length);
  const outcome = outcomes[cycle % outcomes.length];
  const progress = ((tick % phases.length) + 1) / phases.length;

  const fragments = useMemo(
    () => phases.map((entry, index) => ({ ...entry, active: index <= tick % phases.length })),
    [tick]
  );

  return (
    <section className="witness" aria-label="Witness autonomous AI generation" data-lexicon-surface="true">
      <div className="witness-header">
        <div>
          <LexiconText as="p" className="eyebrow" text="LIVE SYNTHETIC RUN" phase={3} />
          <LexiconText as="h3" text="Witness the machine unfold a Full-Mode Artifact." phase={7} />
        </div>
        <button
          className="run-toggle"
          onClick={() => setRunning((value) => !value)}
          aria-label={running ? "Pause run" : "Resume run"}
        >
          <LexiconText text={running ? "Pause run" : "Resume run"} phase={11} semantic={false} />
        </button>
      </div>

      <div className="generation-stage">
        <div className="machine-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <b><LexiconText text={phase.mode} phase={13} semantic={false} /></b>
        </div>
        <div className="generation-copy">
          <LexiconText as="p" className="machine-line" text={`AI RUN ${String(cycle + 1).padStart(4, "0")}`} phase={17} />
          <LexiconText as="h4" text={phase.text} phase={19} />
          <div className="progress-track"><i style={{ width: `${progress * 100}%` }} /></div>
          <p className="outcome">
            <LexiconText text={`Provisional route: ${outcome}`} phase={23} />
          </p>
        </div>
      </div>

      <div className="mode-ledger">
        {fragments.map((fragment, index) => (
          <div className={fragment.active ? "mode-row active" : "mode-row"} key={fragment.mode}>
            <LexiconText text={fragment.mode} phase={29 + index * 3} />
            <LexiconText as="p" text={fragment.text} phase={31 + index * 3} />
          </div>
        ))}
      </div>

      <LexiconText
        as="p"
        className="witness-note"
        text="This prototype visualizes an autonomous pipeline. Production runs must expose the trigger, models, tools, logs, safety checks, and any human intervention."
        phase={53}
      />
    </section>
  );
}

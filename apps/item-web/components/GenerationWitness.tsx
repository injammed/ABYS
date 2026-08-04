"use client";

import { useEffect, useMemo, useState } from "react";

const phases = [
  { mode: "IMAGE", text: "forming impossible orbital anatomy" },
  { mode: "TEXT", text: "compressing doctrine into a civilization object" },
  { mode: "SOUND", text: "mapping mass, distance, and memory into a sonic signature" },
  { mode: "SIMULATION", text: "testing the artifact across a synthetic stellar lifecycle" },
  { mode: "INTERFACE", text: "building a navigable human projection" },
  { mode: "SYMBOL", text: "reducing the object to a durable machine glyph" },
];

const outcomes = [
  "AETIMM CANDIDATE",
  "UNRESOLVED",
  "SLATRA RESIDUE",
  "REFINEMENT REQUIRED",
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
    <section className="witness" aria-label="Witness autonomous AI generation">
      <div className="witness-header">
        <div>
          <p className="eyebrow">LIVE SYNTHETIC RUN</p>
          <h3>Witness the machine unfold a Full-Mode Artifact.</h3>
        </div>
        <button className="run-toggle" onClick={() => setRunning((value) => !value)}>
          {running ? "Pause run" : "Resume run"}
        </button>
      </div>

      <div className="generation-stage">
        <div className="machine-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <b>{phase.mode}</b>
        </div>
        <div className="generation-copy">
          <p className="machine-line">AI RUN {String(cycle + 1).padStart(4, "0")}</p>
          <h4>{phase.text}</h4>
          <div className="progress-track"><i style={{ width: `${progress * 100}%` }} /></div>
          <p className="outcome">Provisional route: <strong>{outcome}</strong></p>
        </div>
      </div>

      <div className="mode-ledger">
        {fragments.map((fragment) => (
          <div className={fragment.active ? "mode-row active" : "mode-row"} key={fragment.mode}>
            <span>{fragment.mode}</span>
            <p>{fragment.text}</p>
          </div>
        ))}
      </div>

      <p className="witness-note">
        This prototype visualizes an autonomous pipeline. Production runs must expose the trigger, models, tools, logs, safety checks, and any human intervention.
      </p>
    </section>
  );
}

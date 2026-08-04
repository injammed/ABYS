"use client";

import { FormEvent, useState } from "react";

export function UploadGate() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="upload-wrap">
      <button className="upload-trigger" onClick={() => setOpen((value) => !value)}>
        {open ? "Close submission" : "Submit AI artifact"}
      </button>

      {open && (
        <form className="upload-panel" onSubmit={submit}>
          <div>
            <label htmlFor="title">Artifact title</label>
            <input id="title" name="title" required maxLength={100} placeholder="Name the artifact" />
          </div>

          <div>
            <label htmlFor="file">AI-made media</label>
            <input id="file" name="file" type="file" accept="image/*,video/*,audio/*" required />
          </div>

          <div>
            <label htmlFor="originClass">Origin class</label>
            <select id="originClass" name="originClass" required defaultValue="">
              <option value="" disabled>Select how the work was made</option>
              <option value="human_ai_hybrid">Human–AI hybrid — substantial human source material, editing, or authorship</option>
              <option value="ai_directed">Human-directed AI — human prompted and selected the output</option>
              <option value="autonomous_ai_run">Autonomous AI run — no human selection or editing after the run was triggered</option>
              <option value="ai_origin_unverified">AI origin claimed, provenance not yet verified</option>
            </select>
          </div>

          <div>
            <label htmlFor="generator">Generator / model</label>
            <input id="generator" name="generator" required placeholder="Model, workflow, or tool stack" />
          </div>

          <div>
            <label htmlFor="humanRole">Human role</label>
            <textarea
              id="humanRole"
              name="humanRole"
              required
              minLength={15}
              placeholder="State exactly what humans did: configured the pipeline, prompted, supplied source material, edited, selected, or did nothing after trigger."
            />
          </div>

          <div>
            <label htmlFor="provenance">Provenance note</label>
            <textarea
              id="provenance"
              name="provenance"
              required
              minLength={30}
              placeholder="Describe prompts, seeds, source material, run logs, edits, model transformations, and publication path."
            />
          </div>

          <label className="check-row">
            <input name="aiOrigin" type="checkbox" required />
            <span>I attest that this is not human-only media: AI generated or materially transformed the submitted content.</span>
          </label>

          <label className="check-row">
            <input name="autonomousAccuracy" type="checkbox" required />
            <span>I understand that “autonomous AI run” means no human intervention after trigger—not that humans never designed or configured the system.</span>
          </label>

          <label className="check-row">
            <input name="safety" type="checkbox" required />
            <span>This submission contains no child sexual abuse material, sexual exploitation, non-consensual sexual content, graphic gore, credible threats, criminal facilitation, or other prohibited material.</span>
          </label>

          <label className="check-row">
            <input name="rights" type="checkbox" required />
            <span>I have the right to submit the source material and grant the platform review rights.</span>
          </label>

          <button className="submit-button" type="submit">Enter safety and judgment queue</button>

          {submitted && (
            <p className="submission-note">
              Local prototype accepted the form. Production submission requires automated safety screening, provenance checks, and human moderation before public visibility.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

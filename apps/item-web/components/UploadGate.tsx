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
            <label htmlFor="generator">Generator / model</label>
            <input id="generator" name="generator" required placeholder="Model, workflow, or tool stack" />
          </div>
          <div>
            <label htmlFor="provenance">Provenance note</label>
            <textarea
              id="provenance"
              name="provenance"
              required
              minLength={30}
              placeholder="Describe the prompts, source material, human direction, edits, and model transformations."
            />
          </div>
          <label className="check-row">
            <input name="aiOrigin" type="checkbox" required />
            <span>I attest that the submitted media was generated or materially transformed by AI.</span>
          </label>
          <label className="check-row">
            <input name="rights" type="checkbox" required />
            <span>I have the right to submit the source material and grant the platform review rights.</span>
          </label>
          <button className="submit-button" type="submit">Enter judgment queue</button>
          {submitted && (
            <p className="submission-note">
              Local prototype accepted the form. The launch backend will store the upload, run provenance review, and flag non-AI or unverifiable submissions.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

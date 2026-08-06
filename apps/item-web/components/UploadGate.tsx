"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type IntakeControl = {
  intake_open: boolean;
  daily_submission_limit: number;
};

function submissionErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (raw.includes("INTAKE_CLOSED")) {
    return "Public intake is temporarily paused. Existing private submissions remain safe.";
  }
  if (raw.includes("DAILY_SUBMISSION_LIMIT_REACHED")) {
    return "Daily submission limit reached. Try again after the rolling 24-hour window clears.";
  }
  if (raw.includes("QUARANTINE_BACKLOG_LIMIT_REACHED")) {
    return "Your private quarantine queue is full. Wait for review before submitting more.";
  }
  if (raw.includes("INTAKE_IDENTITY_MISMATCH") || raw.includes("INTAKE_REQUIRES_PRIVATE_QUARANTINE")) {
    return "Submission authorization failed. Sign out, sign back in, and retry.";
  }
  if (raw.toLowerCase().includes("row-level security")) {
    return "Intake rejected this upload. The queue may be paused or your account may have reached its limit.";
  }

  return raw || "Submission failed.";
}

export function UploadGate() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [intakeControl, setIntakeControl] = useState<IntakeControl | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));

    void client
      .from("intake_control")
      .select("intake_open,daily_submission_limit")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: control, error }) => {
        // Migration 003 may not yet be applied during a staged deployment.
        // In that case, preserve the existing upload behavior rather than
        // presenting a false closed state.
        if (!error && control) setIntakeControl(control as IntakeControl);
      });

    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !session) {
      setMessage("Sign in before submitting an artifact.");
      return;
    }

    const { data: currentControl, error: controlError } = await client
      .from("intake_control")
      .select("intake_open,daily_submission_limit")
      .eq("id", 1)
      .maybeSingle();

    if (!controlError && currentControl) {
      const control = currentControl as IntakeControl;
      setIntakeControl(control);
      if (!control.intake_open) {
        setMessage("Public intake is temporarily paused. Existing private submissions remain safe.");
        return;
      }
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setMessage("Choose an image to upload.");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setMessage("Uploads accept JPEG, PNG, WebP, or GIF images.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage("Image exceeds the 10 MB limit.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const mediaPath = `${session.user.id}/${crypto.randomUUID()}.${extension}`;

    setBusy(true);
    setMessage(null);

    try {
      const { error: uploadError } = await client.storage
        .from("artifact-media")
        .upload(mediaPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: insertError } = await client.from("artifacts").insert({
        creator_id: session.user.id,
        title: String(form.get("title") ?? "").trim(),
        summary: String(form.get("summary") ?? "").trim(),
        origin_class: String(form.get("originClass") ?? ""),
        generator: String(form.get("generator") ?? "").trim(),
        human_role: String(form.get("humanRole") ?? "").trim(),
        provenance_note: String(form.get("provenance") ?? "").trim(),
        media_path: mediaPath,
        media_type: "image",
        status: "quarantine",
        lane: null,
        published_at: null,
        ai_origin_attested: form.get("aiOrigin") === "on",
        safety_attested: form.get("safety") === "on",
        rights_attested: form.get("rights") === "on",
      });

      if (insertError) {
        await client.storage.from("artifact-media").remove([mediaPath]);
        throw insertError;
      }

      formElement.reset();
      setSelectedFileName(null);
      setMessage("Submitted to private quarantine. Your private Unjudged preview will appear in the feed.");
      window.dispatchEvent(new CustomEvent("aetimm:submission-created"));
    } catch (error) {
      setMessage(submissionErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!socialBackendEnabled) {
    return (
      <button className="upload-trigger" type="button" disabled title="Social backend not configured">
        Intake unavailable
      </button>
    );
  }

  const intakePaused = intakeControl?.intake_open === false;
  const dailyLimit = intakeControl?.daily_submission_limit;

  return (
    <div className="upload-wrap">
      <button
        className="upload-trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Close submission" : intakePaused ? "Intake paused" : "Submit slop"}
      </button>

      {open && !session && (
        <div className="upload-panel" role="status">
          <p className="submission-note">Create an account or sign in before uploading.</p>
        </div>
      )}

      {open && session && intakePaused && (
        <div className="upload-panel" role="status">
          <p className="submission-note">Public intake is temporarily paused. Existing private submissions remain safe.</p>
        </div>
      )}

      {open && session && !intakePaused && (
        <form className="upload-panel submission-panel" onSubmit={submit} aria-busy={busy}>
          <p className="submission-note">
            Public intake is open. JPEG, PNG, WebP, or GIF · 10 MB maximum
            {dailyLimit ? ` · ${dailyLimit} submissions per rolling 24 hours` : ""}
            {" · "}every upload remains private until review.
          </p>

          <div>
            <label htmlFor="title">Artifact title</label>
            <input id="title" name="title" required maxLength={100} placeholder="Name the artifact" disabled={busy} />
          </div>

          <div>
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              name="summary"
              required
              minLength={10}
              maxLength={600}
              placeholder="Explain what the artifact is and why it exists."
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="file">AI-made image</label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              disabled={busy}
              aria-describedby="selected-file"
              onChange={(event) => {
                setSelectedFileName(event.currentTarget.files?.[0]?.name ?? null);
                setMessage(null);
              }}
            />
            <p id="selected-file" className={selectedFileName ? "file-selection selected" : "file-selection"}>
              <span aria-hidden="true">◇</span>
              {selectedFileName ?? "No image selected"}
            </p>
          </div>

          <div>
            <label htmlFor="originClass">Origin class</label>
            <select id="originClass" name="originClass" required defaultValue="" disabled={busy}>
              <option value="" disabled>Select how the work was made</option>
              <option value="human_ai_hybrid">Human–AI hybrid — substantial human source material, editing, or authorship</option>
              <option value="ai_directed">Human-directed AI — human prompted and selected the output</option>
              <option value="autonomous_ai_run">Autonomous AI run — no human selection or editing after the run was triggered</option>
              <option value="ai_origin_unverified">AI origin claimed, provenance not yet verified</option>
            </select>
          </div>

          <div>
            <label htmlFor="generator">Generator / model</label>
            <input id="generator" name="generator" required minLength={2} maxLength={120} placeholder="Model, workflow, or tool stack" disabled={busy} />
          </div>

          <div>
            <label htmlFor="humanRole">Human role</label>
            <textarea
              id="humanRole"
              name="humanRole"
              required
              minLength={15}
              maxLength={800}
              placeholder="State exactly what humans did: configured the pipeline, prompted, supplied source material, edited, selected, or did nothing after trigger."
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="provenance">Provenance note</label>
            <textarea
              id="provenance"
              name="provenance"
              required
              minLength={30}
              maxLength={1600}
              placeholder="Describe prompts, seeds, source material, run logs, edits, model transformations, and publication path."
              disabled={busy}
            />
          </div>

          <label className="check-row">
            <input name="aiOrigin" type="checkbox" required disabled={busy} />
            <span>I attest that this is not human-only media: AI generated or materially transformed the submitted content.</span>
          </label>

          <label className="check-row">
            <input name="autonomousAccuracy" type="checkbox" required disabled={busy} />
            <span>I understand that “autonomous AI run” means no human intervention after trigger—not that humans never designed or configured the system.</span>
          </label>

          <label className="check-row">
            <input name="safety" type="checkbox" required disabled={busy} />
            <span>This submission contains no child sexual abuse material, sexual exploitation, non-consensual sexual content, graphic gore, credible threats, criminal facilitation, or other prohibited material.</span>
          </label>

          <label className="check-row">
            <input name="rights" type="checkbox" required disabled={busy} />
            <span>I have the right to submit the source material and grant the platform review rights.</span>
          </label>

          <div className="submission-actions">
            <button className="submit-button" type="submit" disabled={busy || intakePaused}>
              {busy ? "Uploading to private quarantine…" : "Submit to private quarantine"}
            </button>
            {message && <p className="submission-note" role="status" aria-live="polite">{message}</p>}
          </div>
        </form>
      )}
    </div>
  );
}

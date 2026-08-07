"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";
import styles from "./UploadGate.module.css";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_PARTS = 12;

const ACCEPTED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".mp4", ".webm", ".mov",
  ".mp3", ".wav", ".ogg", ".m4a",
  ".pdf", ".txt", ".md", ".csv", ".html", ".css",
  ".js", ".jsx", ".ts", ".tsx", ".json", ".xml",
  ".py", ".rb", ".go", ".rs", ".java", ".c", ".h", ".cpp", ".hpp",
  ".zip", ".gz", ".tar",
  ".gltf", ".glb", ".obj", ".stl", ".blend",
];

const FILE_ACCEPT = [
  "image/*", "video/mp4", "video/webm", "video/quicktime",
  "audio/*", "application/pdf", "text/*", "application/json",
  "application/javascript", "application/typescript", "application/xml",
  "application/zip", "application/x-zip-compressed", "application/gzip", "application/x-tar",
  "model/gltf+json", "model/gltf-binary", "application/octet-stream",
  ...ACCEPTED_EXTENSIONS,
].join(",");

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-tar",
  "model/gltf+json",
  "model/gltf-binary",
  "application/octet-stream",
]);

type ArtifactMode =
  | "image"
  | "video"
  | "audio"
  | "text"
  | "document"
  | "code"
  | "data"
  | "model3d"
  | "website"
  | "simulation"
  | "other";

type IntakeControl = {
  intake_open: boolean;
  daily_submission_limit: number;
};

type ArtifactPartInput = {
  position: number;
  part_kind: "file" | "text" | "reference";
  mode: ArtifactMode;
  label: string;
  storage_path?: string;
  original_filename?: string;
  mime_type?: string;
  byte_size?: number;
  text_content?: string;
  reference_url?: string;
};

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function normalizedMime(file: File): string {
  const extension = extensionOf(file.name);
  if ([".jpg", ".jpeg"].includes(extension)) return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".ogg") return "audio/ogg";
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".pdf") return "application/pdf";
  if ([".txt", ".md", ".py", ".rb", ".go", ".rs", ".java", ".c", ".h", ".cpp", ".hpp"].includes(extension)) return "text/plain";
  if ([".js", ".jsx"].includes(extension)) return "application/javascript";
  if ([".ts", ".tsx"].includes(extension)) return "application/typescript";
  if (extension === ".json") return "application/json";
  if (extension === ".csv") return "text/csv";
  if (extension === ".html") return "text/html";
  if (extension === ".css") return "text/css";
  if (extension === ".xml") return "application/xml";
  if (extension === ".zip") return "application/zip";
  if (extension === ".gz") return "application/gzip";
  if (extension === ".tar") return "application/x-tar";
  if (extension === ".gltf") return "model/gltf+json";
  if (extension === ".glb") return "model/gltf-binary";
  if ([".obj", ".stl", ".blend"].includes(extension)) return "application/octet-stream";
  return file.type || "application/octet-stream";
}

function modeForFile(file: File): ArtifactMode {
  const extension = extensionOf(file.name);
  const mime = normalizedMime(file);

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "document";
  if ([".js", ".jsx", ".ts", ".tsx", ".py", ".rb", ".go", ".rs", ".java", ".c", ".h", ".cpp", ".hpp"].includes(extension)) return "code";
  if ([".json", ".csv", ".xml", ".zip", ".gz", ".tar"].includes(extension)) return "data";
  if ([".gltf", ".glb", ".obj", ".stl", ".blend"].includes(extension)) return "model3d";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

function safeExtension(file: File): string {
  return extensionOf(file.name).replace(/[^.a-z0-9]/g, "").slice(0, 12) || ".bin";
}

function fileIdentity(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}

function fileIsAccepted(file: File): boolean {
  const extension = extensionOf(file.name);
  const mime = normalizedMime(file);
  return ACCEPTED_EXTENSIONS.includes(extension)
    || mime.startsWith("image/")
    || mime.startsWith("video/")
    || mime.startsWith("audio/")
    || mime.startsWith("text/")
    || ACCEPTED_MIME_TYPES.has(mime);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function submissionErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (raw.includes("INTAKE_CLOSED")) return "Public intake is temporarily paused. Existing private submissions remain safe.";
  if (raw.includes("DAILY_SUBMISSION_LIMIT_REACHED")) return "Daily Artifact limit reached. Try again after the rolling 24-hour window clears.";
  if (raw.includes("QUARANTINE_BACKLOG_LIMIT_REACHED")) return "Your private quarantine queue is full. Wait for review before submitting more.";
  if (raw.includes("ARTIFACT_PART_COUNT_INVALID")) return "An Artifact can contain between 1 and 12 materials in this fold.";
  if (raw.includes("ARTIFACT_PART_STORAGE")) return "One uploaded material could not be bound to the Artifact. Uploaded files were rolled back where possible.";
  if (raw.includes("ARTIFACT_MODES_INVALID")) return "One or more Artifact materials are not supported yet.";
  if (raw.includes("INTAKE_IDENTITY_MISMATCH") || raw.includes("INTAKE_REQUIRES_PRIVATE_QUARANTINE")) return "Submission authorization failed. Sign out, sign back in, and retry.";
  if (raw.toLowerCase().includes("row-level security")) return "Intake rejected this Artifact. The queue may be paused or your account may have reached its limit.";

  return raw || "Artifact submission failed.";
}

export function UploadGate() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [intakeControl, setIntakeControl] = useState<IntakeControl | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textPart, setTextPart] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [dragging, setDragging] = useState(false);

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
        if (!error && control) setIntakeControl(control as IntakeControl);
      });

    return () => data.subscription.unsubscribe();
  }, []);

  const selectedModes = useMemo(() => {
    const modes = new Set<ArtifactMode>(selectedFiles.map(modeForFile));
    if (textPart.trim()) modes.add("text");
    if (referenceUrl.trim()) modes.add("website");
    return [...modes];
  }, [referenceUrl, selectedFiles, textPart]);

  const totalFileBytes = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + file.size, 0),
    [selectedFiles],
  );

  const materialPartCount = selectedFiles.length + (textPart.trim() ? 1 : 0) + (referenceUrl.trim() ? 1 : 0);
  const materialLimitExceeded = materialPartCount > MAX_PARTS || totalFileBytes > MAX_TOTAL_BYTES;

  function validateIncomingFiles(incoming: File[]): void {
    if (busy || incoming.length === 0) return;

    const unsupported = incoming.find((file) => !fileIsAccepted(file));
    if (unsupported) {
      setMessage(`${unsupported.name} is not an accepted material type. Add it in a supported document, archive, code, data, media, or 3D format.`);
      return;
    }

    const oversized = incoming.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setMessage(`${oversized.name} exceeds the 50 MB per-file limit.`);
      return;
    }

    const existing = new Set(selectedFiles.map(fileIdentity));
    const merged = [...selectedFiles];
    let duplicateCount = 0;

    for (const file of incoming) {
      const key = fileIdentity(file);
      if (existing.has(key)) {
        duplicateCount += 1;
        continue;
      }
      existing.add(key);
      merged.push(file);
    }

    const nonFileParts = (textPart.trim() ? 1 : 0) + (referenceUrl.trim() ? 1 : 0);
    if (merged.length + nonFileParts > MAX_PARTS) {
      setMessage(`One Artifact can contain up to ${MAX_PARTS} total materials. Remove something before adding more.`);
      return;
    }

    const mergedBytes = merged.reduce((sum, file) => sum + file.size, 0);
    if (mergedBytes > MAX_TOTAL_BYTES) {
      setMessage("Combined uploaded files would exceed the 100 MB Artifact limit.");
      return;
    }

    setSelectedFiles(merged);
    setMessage(duplicateCount ? `${duplicateCount} duplicate material${duplicateCount === 1 ? " was" : "s were"} skipped.` : null);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>): void {
    validateIncomingFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    validateIncomingFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeSelectedFile(identity: string): void {
    if (busy) return;
    setSelectedFiles((current) => current.filter((file) => fileIdentity(file) !== identity));
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const client = getSupabaseBrowserClient();
    if (!client || !session) {
      setMessage("Sign in before submitting an Artifact.");
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
    const files = selectedFiles;
    const bodyText = textPart.trim();
    const url = referenceUrl.trim();
    const totalParts = files.length + (bodyText ? 1 : 0) + (url ? 1 : 0);

    if (totalParts < 1) {
      setMessage("Add at least one material, text component, or reference URL.");
      return;
    }
    if (totalParts > MAX_PARTS) {
      setMessage(`One Artifact can contain up to ${MAX_PARTS} total materials.`);
      return;
    }

    const unsupported = files.find((file) => !fileIsAccepted(file));
    if (unsupported) {
      setMessage(`${unsupported.name} is not an accepted material type.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setMessage(`${oversized.name} exceeds the 50 MB per-file limit.`);
      return;
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setMessage("Combined uploaded files exceed the 100 MB Artifact limit.");
      return;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("unsupported protocol");
      } catch {
        setMessage("Reference URLs must be valid http:// or https:// addresses. The platform records the reference but does not fetch it during intake.");
        return;
      }
    }

    const artifactId = crypto.randomUUID();
    const uploadedPaths: string[] = [];
    const parts: ArtifactPartInput[] = [];

    setBusy(true);
    setMessage("Creating private Artifact envelope…");

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const mime = normalizedMime(file);
        const mode = modeForFile(file);
        const storagePath = `${session.user.id}/${artifactId}/${String(index).padStart(2, "0")}-${crypto.randomUUID()}${safeExtension(file)}`;

        setMessage(`Uploading material ${index + 1} of ${files.length} · ${file.name}`);
        const { error: uploadError } = await client.storage
          .from("artifact-media")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: mime,
          });
        if (uploadError) throw uploadError;

        uploadedPaths.push(storagePath);
        parts.push({
          position: parts.length,
          part_kind: "file",
          mode,
          label: file.name,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: mime,
          byte_size: file.size,
        });
      }

      if (bodyText) {
        parts.push({
          position: parts.length,
          part_kind: "text",
          mode: "text",
          label: "Artifact text",
          text_content: bodyText,
        });
      }

      if (url) {
        parts.push({
          position: parts.length,
          part_kind: "reference",
          mode: "website",
          label: "External reference",
          reference_url: url,
        });
      }

      const modes = [...new Set(parts.map((part) => part.mode))];
      setMessage("Binding materials into one private Artifact…");

      const { data: createdId, error: createError } = await client.rpc("create_quarantined_artifact", {
        p_artifact_id: artifactId,
        p_title: String(form.get("title") ?? "").trim(),
        p_summary: String(form.get("summary") ?? "").trim(),
        p_artifact_description: String(form.get("artifactDescription") ?? "").trim(),
        p_artifact_modes: modes,
        p_origin_class: String(form.get("originClass") ?? ""),
        p_generator: String(form.get("generator") ?? "").trim(),
        p_human_role: String(form.get("humanRole") ?? "").trim(),
        p_provenance_note: String(form.get("provenance") ?? "").trim(),
        p_ai_origin_attested: form.get("aiOrigin") === "on",
        p_safety_attested: form.get("safety") === "on",
        p_rights_attested: form.get("rights") === "on",
        p_parts: parts,
      });
      if (createError) throw createError;

      formElement.reset();
      setSelectedFiles([]);
      setTextPart("");
      setReferenceUrl("");
      setMessage(`Artifact ${String(createdId ?? artifactId)} submitted to private quarantine with ${parts.length} material${parts.length === 1 ? "" : "s"}.`);
      window.dispatchEvent(new CustomEvent("aetimm:submission-created", { detail: { artifactId } }));
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await client.storage.from("artifact-media").remove(uploadedPaths);
      }
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
        onClick={() => !busy && setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="artifact-intake-panel"
        disabled={busy}
      >
        {open ? "Close artifact intake" : intakePaused ? "Intake paused" : "Submit artifact"}
      </button>

      {open && !session && (
        <div id="artifact-intake-panel" className="upload-panel" role="status">
          <p className="submission-note">Create an account or sign in before uploading.</p>
        </div>
      )}

      {open && session && intakePaused && (
        <div id="artifact-intake-panel" className="upload-panel" role="status">
          <p className="submission-note">Public intake is temporarily paused. Existing private submissions remain safe.</p>
        </div>
      )}

      {open && session && !intakePaused && (
        <form id="artifact-intake-panel" className="upload-panel submission-panel" onSubmit={submit} aria-busy={busy}>
          <p className="submission-note">
            <strong>ALL SLOP WELCOME.</strong>{" "}
            Full-modality AI-made Artifacts belong here: image, video, audio, text, documents, code, data, 3D, references, simulations, or mixed media. Everything you add becomes one Artifact. Every approved Artifact enters the same infinite feed.
            {dailyLimit ? ` · ${dailyLimit} Artifacts per rolling 24 hours` : ""}
            {" · "}12 materials maximum · 50 MB per file · 100 MB combined · private until review.
          </p>

          <div>
            <label htmlFor="title">Artifact title</label>
            <input id="title" name="title" required maxLength={100} placeholder="Name the Artifact" disabled={busy} />
          </div>

          <div>
            <label htmlFor="summary">Describe the Artifact</label>
            <textarea
              id="summary"
              name="summary"
              required
              minLength={10}
              maxLength={600}
              placeholder="What is it and why does it exist?"
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="artifactDescription">How should it be experienced?</label>
            <textarea
              id="artifactDescription"
              name="artifactDescription"
              required
              minLength={20}
              maxLength={4000}
              placeholder="Describe the whole work: its materials, relationships, behavior, dependencies, and what someone should understand when experiencing it."
              disabled={busy}
            />
            <p className="submission-note">Describe the Artifact as a whole, not each file separately.</p>
          </div>

          <div>
            <label htmlFor="files">AI-made Artifact</label>
            <div
              className={styles.dropZone}
              data-dragging={dragging ? "true" : undefined}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={handleDrop}
            >
              <input
                id="files"
                className={styles.materialInput}
                name="files"
                type="file"
                accept={FILE_ACCEPT}
                multiple
                disabled={busy}
                aria-describedby="material-help selected-files material-limits"
                onChange={handleFileInput}
              />
              <label className={styles.materialPicker} htmlFor="files" data-disabled={busy ? "true" : undefined}>
                <span className={styles.materialPlus} aria-hidden="true">+</span>
                <span className={styles.materialAction}>{dragging ? "Drop material here" : "Add material"}</span>
                <span className={styles.materialModes}>image · video · audio · PDF · code · data · 3D · archive · more</span>
              </label>
            </div>

            <div id="material-limits" className={styles.materialSummary}>
              <span>{materialPartCount}/{MAX_PARTS} total materials</span>
              <span>{formatBytes(totalFileBytes)} / 100 MB files</span>
            </div>

            <div id="selected-files" className={styles.materialList} aria-live="polite">
              {selectedFiles.length === 0 ? (
                <div className={styles.materialEmpty}>
                  <span aria-hidden="true">◇</span>
                  <span>No materials added</span>
                </div>
              ) : selectedFiles.map((file) => {
                const identity = fileIdentity(file);
                return (
                  <div className={styles.materialRow} key={identity}>
                    <span aria-hidden="true">◇</span>
                    <span>
                      {file.name}
                      <span className={styles.materialMeta}>{modeForFile(file)} · {formatBytes(file.size)}</span>
                    </span>
                    <button
                      className={styles.removeMaterial}
                      type="button"
                      disabled={busy}
                      onClick={() => removeSelectedFile(identity)}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <p id="material-help" className="submission-note">Everything added here belongs to one Artifact. Drop files here or use Add material. Files remain private and are treated as untrusted until review. Text and references below join that same Artifact.</p>
            {materialLimitExceeded && <p className={styles.limitWarning} role="alert">Material limits exceeded. Remove material before submitting.</p>}
          </div>

          <div>
            <label htmlFor="textPart">Text material · optional</label>
            <textarea
              id="textPart"
              value={textPart}
              onChange={(event) => {
                setTextPart(event.target.value);
                setMessage(null);
              }}
              maxLength={20000}
              placeholder="Paste text that is itself part of the Artifact."
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="referenceUrl">Reference / website material · optional</label>
            <input
              id="referenceUrl"
              type="url"
              value={referenceUrl}
              onChange={(event) => {
                setReferenceUrl(event.target.value);
                setMessage(null);
              }}
              maxLength={2000}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://example.com — recorded as a reference; not fetched or executed during intake"
              disabled={busy}
            />
          </div>

          <div className="submission-note">
            <strong>Detected modes:</strong> {selectedModes.length ? selectedModes.join(" · ") : "none yet"}
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
            <label htmlFor="generator">Generator / model / tool stack</label>
            <input id="generator" name="generator" required minLength={2} maxLength={120} placeholder="Models, code, engines, workflows, or tools" disabled={busy} />
          </div>

          <div>
            <label htmlFor="humanRole">Human role</label>
            <textarea
              id="humanRole"
              name="humanRole"
              required
              minLength={15}
              maxLength={800}
              placeholder="State what humans did across the Artifact: configured, prompted, supplied source material, coded, edited, selected, assembled, or did nothing after trigger."
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
              placeholder="Describe prompts, seeds, source material, run logs, transformations, edits, assembly, and publication path."
              disabled={busy}
            />
          </div>

          <label className="check-row">
            <input name="aiOrigin" type="checkbox" required disabled={busy} />
            <span>I attest that AI generated or materially transformed the submitted Artifact or a meaningful component of it.</span>
          </label>

          <label className="check-row">
            <input name="autonomousAccuracy" type="checkbox" required disabled={busy} />
            <span>I understand that “autonomous AI run” means no human intervention after trigger—not that humans never designed or configured the system.</span>
          </label>

          <label className="check-row">
            <input name="safety" type="checkbox" required disabled={busy} />
            <span>This Artifact contains no prohibited sexual exploitation material, graphic gore intended for shock, credible threats, criminal facilitation, malware intended to harm users, or other prohibited material.</span>
          </label>

          <label className="check-row">
            <input name="rights" type="checkbox" required disabled={busy} />
            <span>I have the right to submit these materials and grant the platform review rights, and the provenance description truthfully identifies source/remix relationships to the best of my knowledge.</span>
          </label>

          <div className="submission-actions">
            <button className="submit-button" type="submit" disabled={busy || intakePaused || materialLimitExceeded || materialPartCount < 1}>
              {busy ? "Binding Artifact into private quarantine…" : "Submit Artifact"}
            </button>
            {message && <p className="submission-note" role="status" aria-live="polite">{message}</p>}
          </div>
        </form>
      )}
    </div>
  );
}

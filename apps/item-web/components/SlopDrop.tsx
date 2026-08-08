"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AUTH_REQUIRED_EVENT, SUBMIT_INTENT_STORAGE_KEY } from "@/lib/public-intents";
import { waitForPublicArtifactReceipt } from "@/lib/publication-receipt";
import { uploadArtifactObject } from "@/lib/storage-upload-receipt";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";
import { LexiconText } from "./LexiconBroadcast";
import styles from "./UploadGate.module.css";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_PARTS = 12;
const OPAQUE_MIME = "application/octet-stream";

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
  if ([".obj", ".stl", ".blend"].includes(extension)) return OPAQUE_MIME;
  return OPAQUE_MIME;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim();
}

function submissionErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("INTAKE_CLOSED")) return "Trough closed for maintenance. Try again shortly.";
  if (raw.includes("DAILY_SUBMISSION_LIMIT_REACHED")) return "Daily slop limit reached. Try again when the rolling 24-hour window clears.";
  if (raw.includes("QUARANTINE_BACKLOG_LIMIT_REACHED")) return "Your intake queue is full. Try again later.";
  if (raw.includes("ARTIFACT_PART_COUNT_INVALID")) return "One Artifact can contain between 1 and 12 materials.";
  if (raw.includes("ARTIFACT_PART_STORAGE")) return "One material could not be bound to the Artifact. Uploaded files were rolled back where possible.";
  if (raw.includes("ARTIFACT_MODES_INVALID")) return "One or more materials could not be classified safely.";
  if (raw.includes("PUBLICATION_ATTESTATIONS_REQUIRED")) return "Confirm the submission attestation before throwing it in.";
  if (raw.toLowerCase().includes("row-level security")) return "The trough rejected this Artifact. Sign in again or try later.";
  return raw || "Artifact submission failed.";
}

export function SlopDrop() {
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

    const applySession = (nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession && window.sessionStorage.getItem(SUBMIT_INTENT_STORAGE_KEY) === "1") {
        window.sessionStorage.removeItem(SUBMIT_INTENT_STORAGE_KEY);
        setOpen(true);
      }
    };

    void client.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));

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

  const totalFileBytes = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + file.size, 0),
    [selectedFiles],
  );
  const materialPartCount = selectedFiles.length + (textPart.trim() ? 1 : 0) + (referenceUrl.trim() ? 1 : 0);
  const materialLimitExceeded = materialPartCount > MAX_PARTS || totalFileBytes > MAX_TOTAL_BYTES;
  const intakePaused = intakeControl?.intake_open === false;
  const dailyLimit = intakeControl?.daily_submission_limit;

  function handleTrigger(): void {
    if (busy) return;
    if (!session) {
      window.sessionStorage.setItem(SUBMIT_INTENT_STORAGE_KEY, "1");
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
      return;
    }
    setOpen((value) => !value);
  }

  function validateIncomingFiles(incoming: File[]): void {
    if (busy || intakePaused || incoming.length === 0) return;

    const oversized = incoming.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setMessage(`${oversized.name} exceeds the 50 MB per-file limit.`);
      return;
    }

    const existing = new Set(selectedFiles.map(fileIdentity));
    const merged = [...selectedFiles];
    let duplicates = 0;

    for (const file of incoming) {
      const identity = fileIdentity(file);
      if (existing.has(identity)) {
        duplicates += 1;
        continue;
      }
      existing.add(identity);
      merged.push(file);
    }

    const nonFileParts = (textPart.trim() ? 1 : 0) + (referenceUrl.trim() ? 1 : 0);
    if (merged.length + nonFileParts > MAX_PARTS) {
      setMessage(`One Artifact can contain up to ${MAX_PARTS} total materials.`);
      return;
    }

    if (merged.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      setMessage("Combined uploaded files would exceed the 100 MB Artifact limit.");
      return;
    }

    setSelectedFiles(merged);
    setMessage(duplicates ? `${duplicates} duplicate material${duplicates === 1 ? " was" : "s were"} skipped.` : null);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>): void {
    validateIncomingFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    if (!intakePaused) validateIncomingFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeSelectedFile(identity: string): void {
    if (busy || intakePaused) return;
    setSelectedFiles((current) => current.filter((file) => fileIdentity(file) !== identity));
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || intakePaused) return;

    const client = getSupabaseBrowserClient();
    if (!client || !session) {
      window.sessionStorage.setItem(SUBMIT_INTENT_STORAGE_KEY, "1");
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
      return;
    }

    const { data: currentControl } = await client
      .from("intake_control")
      .select("intake_open,daily_submission_limit")
      .eq("id", 1)
      .maybeSingle();

    if (currentControl) {
      const control = currentControl as IntakeControl;
      setIntakeControl(control);
      if (!control.intake_open) {
        setMessage("Trough closed for maintenance. Try again shortly.");
        return;
      }
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const bodyText = textPart.trim();
    const url = referenceUrl.trim();
    const files = selectedFiles;
    const totalParts = files.length + (bodyText ? 1 : 0) + (url ? 1 : 0);

    if (totalParts < 1) {
      setMessage("Add some slop first.");
      return;
    }
    if (totalParts > MAX_PARTS || totalFileBytes > MAX_TOTAL_BYTES) {
      setMessage("This Artifact exceeds the current material limits.");
      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setMessage(`${oversized.name} exceeds the 50 MB per-file limit.`);
      return;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("unsupported protocol");
      } catch {
        setMessage("Links must start with http:// or https://. Links are recorded, not fetched during intake.");
        return;
      }
    }

    const attested = form.get("submitAttestation") === "on";
    if (!attested) {
      setMessage("Confirm the submission attestation first.");
      return;
    }

    const artifactId = crypto.randomUUID();
    const uploadedPaths: string[] = [];
    const parts: ArtifactPartInput[] = [];
    let artifactCommitted = false;

    setBusy(true);
    setMessage("Throwing it in…");

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const mime = normalizedMime(file);
        const mode = modeForFile(file);
        const storagePath = `${session.user.id}/${artifactId}/${String(index).padStart(2, "0")}-${crypto.randomUUID()}${safeExtension(file)}`;

        setMessage(`Uploading ${index + 1}/${files.length} · ${file.name}`);
        await uploadArtifactObject(storagePath, file, mime);

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
        parts.push({ position: parts.length, part_kind: "text", mode: "text", label: "Artifact text", text_content: bodyText });
      }
      if (url) {
        parts.push({ position: parts.length, part_kind: "reference", mode: "website", label: "External reference", reference_url: url });
      }

      const modes = [...new Set(parts.map((part) => part.mode))];
      const enteredTitle = String(form.get("title") ?? "").trim();
      const title = enteredTitle
        || (files[0] ? stripExtension(files[0].name) : "")
        || (url ? new URL(url).hostname : "")
        || "Untitled slop";
      const summary = String(form.get("summary") ?? "").trim()
        || "AI-made Artifact submitted to the Slop Trough.";
      const description = String(form.get("artifactDescription") ?? "").trim()
        || `One Artifact composed of ${parts.length} material${parts.length === 1 ? "" : "s"} submitted for public feed experience.`;
      const originClass = String(form.get("originClass") ?? "ai_origin_unverified");
      const generator = String(form.get("generator") ?? "").trim() || "Not specified";
      const humanRole = String(form.get("humanRole") ?? "").trim()
        || "Human selected and submitted this AI-made Artifact to the Slop Trough.";
      const provenance = String(form.get("provenance") ?? "").trim()
        || "Creator attested AI origin; detailed generation provenance was not supplied at submission.";

      setMessage("Binding one Artifact…");
      const { data: createdId, error: createError } = await client.rpc("create_quarantined_artifact", {
        p_artifact_id: artifactId,
        p_title: title.slice(0, 100),
        p_summary: summary,
        p_artifact_description: description,
        p_artifact_modes: modes,
        p_origin_class: originClass,
        p_generator: generator,
        p_human_role: humanRole,
        p_provenance_note: provenance,
        p_ai_origin_attested: attested,
        p_safety_attested: attested,
        p_rights_attested: attested,
        p_parts: parts,
      });

      let committedId = String(createdId ?? artifactId);
      let publicConfirmed = false;

      if (createError) {
        setMessage("Reconciling Artifact landing…");
        try {
          publicConfirmed = await waitForPublicArtifactReceipt(artifactId, parts.length);
        } catch {
          publicConfirmed = false;
        }
        if (!publicConfirmed) throw createError;
        artifactCommitted = true;
        committedId = artifactId;
      } else {
        artifactCommitted = true;
        setMessage("Confirming public landing…");
        try {
          publicConfirmed = await waitForPublicArtifactReceipt(committedId, parts.length);
        } catch {
          // The Artifact is already committed. Public-feed recovery may still
          // succeed even if this confirmation read experiences a network error.
        }
      }

      formElement.reset();
      setSelectedFiles([]);
      setTextPart("");
      setReferenceUrl("");
      setMessage(publicConfirmed ? "Thrown. Public." : "Thrown. Public feed confirmation delayed; recovery is still running.");
      window.dispatchEvent(new CustomEvent("aetimm:submission-created", {
        detail: { artifactId: committedId, publicConfirmed },
      }));
    } catch (error) {
      if (!artifactCommitted && uploadedPaths.length > 0) {
        await client.storage.from("artifact-media").remove(uploadedPaths);
      }
      setMessage(submissionErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!socialBackendEnabled) {
    return (
      <button className="upload-trigger" type="button" disabled aria-label="Intake unavailable">
        <LexiconText text="Intake unavailable" phase={3} semantic={false} />
      </button>
    );
  }

  const triggerText = open ? "Close" : intakePaused ? "Intake paused" : "Submit";

  return (
    <div className="upload-wrap" data-lexicon-surface="true">
      <button
        className="upload-trigger"
        type="button"
        onClick={handleTrigger}
        aria-expanded={open}
        aria-controls="artifact-intake-panel"
        aria-label={triggerText}
        disabled={busy}
      >
        <LexiconText text={triggerText} phase={5} semantic={false} />
      </button>

      {open && !session && (
        <div id="artifact-intake-panel" className="upload-panel" role="status" aria-label="Signing in before Artifact intake.">
          <LexiconText as="p" className="submission-note" text="SIGN IN TO THROW IT IN." phase={11} semantic={false} />
        </div>
      )}

      {open && session && (
        <form id="artifact-intake-panel" className="upload-panel submission-panel" onSubmit={submit} aria-busy={busy}>
          <fieldset className={styles.formFieldset} disabled={busy || intakePaused}>
            <LexiconText
              as="p"
              className="submission-note"
              text={`ALL SLOP WELCOME. One Artifact. Any modality. It lands in Unjudged and joins the endless feed.${dailyLimit ? ` · ${dailyLimit}/24h` : ""}`}
              phase={13}
            />

            {intakePaused && (
              <p className="submission-note" role="status" aria-label="Trough paused. The form stays visible; throwing is temporarily locked.">
                <LexiconText text="TROUGH PAUSED. The form stays visible; throwing is temporarily locked." phase={17} semantic={false} />
              </p>
            )}

            <div>
              <label htmlFor="files"><LexiconText text="AI-made Artifact" phase={19} /></label>
              <div
                className={styles.dropZone}
                data-dragging={dragging ? "true" : undefined}
                data-paused={intakePaused ? "true" : undefined}
                onDragEnter={(event) => { event.preventDefault(); if (!busy && !intakePaused) setDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
                onDrop={handleDrop}
              >
                <input
                  id="files"
                  className={styles.materialInput}
                  type="file"
                  multiple
                  disabled={busy || intakePaused}
                  onChange={handleFileInput}
                  aria-describedby="slop-material-help"
                />
                <label className={styles.materialPicker} htmlFor="files" data-disabled={busy || intakePaused ? "true" : undefined}>
                  <span className={styles.materialPlus} aria-hidden="true">+</span>
                  <LexiconText className={styles.materialAction} text={dragging ? "Drop it" : "Add material"} phase={23} />
                  <LexiconText className={styles.materialModes} text="image · video · audio · PDF · code · data · 3D · any file" phase={29} />
                </label>
              </div>

              <div className={styles.materialSummary}>
                <LexiconText text={`${materialPartCount}/${MAX_PARTS}`} phase={31} />
                <LexiconText text={`${formatBytes(totalFileBytes)} / 100 MB`} phase={37} />
              </div>

              <div className={styles.materialList} aria-live="polite">
                {selectedFiles.length === 0 ? (
                  <div className={styles.materialEmpty}>
                    <span aria-hidden="true">◇</span>
                    <LexiconText text="No slop added" phase={41} />
                  </div>
                ) : selectedFiles.map((file, fileIndex) => {
                  const identity = fileIdentity(file);
                  return (
                    <div className={styles.materialRow} key={identity}>
                      <span aria-hidden="true">◇</span>
                      <span>
                        <LexiconText text={file.name} phase={43 + fileIndex * 3} />
                        <LexiconText className={styles.materialMeta} text={`${modeForFile(file)} · ${formatBytes(file.size)}`} phase={47 + fileIndex * 3} />
                      </span>
                      <button className={styles.removeMaterial} type="button" onClick={() => removeSelectedFile(identity)} aria-label={`Remove ${file.name}`}>
                        <LexiconText text="Remove" phase={53 + fileIndex * 3} semantic={false} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <LexiconText
                as="p"
                className="submission-note"
                text="Files are treated as untrusted. Unknown formats enter as inert data. Code is not executed and links are not fetched during intake."
                phase={59}
              />
              {materialLimitExceeded && (
                <p className={styles.limitWarning} role="alert" aria-label="Too much slop for one Artifact. Remove something.">
                  <LexiconText text="Too much slop for one Artifact. Remove something." phase={61} semantic={false} />
                </p>
              )}
            </div>

            <div>
              <label htmlFor="title"><LexiconText text="Name it · optional" phase={67} /></label>
              <input id="title" name="title" maxLength={100} placeholder="Leave blank and we'll use the material name" />
            </div>

            <details>
              <summary><LexiconText text="Text, link, provenance & details · optional" phase={71} /></summary>

              <div>
                <label htmlFor="textPart"><LexiconText text="Text material" phase={73} /></label>
                <textarea id="textPart" value={textPart} onChange={(event) => setTextPart(event.target.value)} maxLength={20000} placeholder="Paste text that is part of the Artifact." />
              </div>

              <div>
                <label htmlFor="referenceUrl"><LexiconText text="Link material" phase={79} /></label>
                <input id="referenceUrl" type="url" value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} maxLength={2000} placeholder="https://…" />
              </div>

              <div>
                <label htmlFor="summary"><LexiconText text="Description" phase={83} /></label>
                <textarea id="summary" name="summary" minLength={10} maxLength={600} placeholder="Optional. What is this slop?" />
              </div>

              <div>
                <label htmlFor="artifactDescription"><LexiconText text="Experience notes" phase={89} /></label>
                <textarea id="artifactDescription" name="artifactDescription" minLength={20} maxLength={4000} placeholder="Optional. How should the whole Artifact behave or be experienced?" />
              </div>

              <div>
                <label htmlFor="originClass"><LexiconText text="Origin" phase={97} /></label>
                <select id="originClass" name="originClass" defaultValue="ai_origin_unverified">
                  <option value="ai_origin_unverified">AI-made · details not supplied</option>
                  <option value="ai_directed">Human-directed AI</option>
                  <option value="human_ai_hybrid">Human–AI hybrid</option>
                  <option value="autonomous_ai_run">Autonomous AI run</option>
                </select>
              </div>

              <div>
                <label htmlFor="generator"><LexiconText text="Generator / model / tools" phase={101} /></label>
                <input id="generator" name="generator" maxLength={120} placeholder="Optional" />
              </div>

              <div>
                <label htmlFor="humanRole"><LexiconText text="Human role" phase={103} /></label>
                <textarea id="humanRole" name="humanRole" minLength={15} maxLength={800} placeholder="Optional" />
              </div>

              <div>
                <label htmlFor="provenance"><LexiconText text="Provenance" phase={107} /></label>
                <textarea id="provenance" name="provenance" minLength={30} maxLength={1600} placeholder="Optional prompts, seeds, sources, edits, run logs…" />
              </div>
            </details>

            <label className="check-row">
              <input name="submitAttestation" type="checkbox" required />
              <LexiconText text="AI-made. I can submit it. It does not contain prohibited material." phase={109} />
            </label>

            <div className="submission-actions">
              <button
                className="submit-button"
                type="submit"
                disabled={busy || intakePaused || materialLimitExceeded || materialPartCount < 1}
                aria-label={busy ? "Throwing" : intakePaused ? "Trough paused" : "Throw it in"}
              >
                <LexiconText text={busy ? "THROWING…" : intakePaused ? "TROUGH PAUSED" : "THROW IT IN"} phase={113} semantic={false} />
              </button>
              {message && (
                <p className="submission-note" role="status" aria-live="polite" aria-label={message}>
                  <LexiconText text={message} phase={127} semantic={false} />
                </p>
              )}
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}

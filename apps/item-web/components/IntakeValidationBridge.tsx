"use client";

import { useEffect } from "react";

function fieldLabel(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  const id = control.id;
  if (id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    const wrappingLabel = control.closest("label");
    if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent.trim().slice(0, 90);
  }

  return control.name || "Required field";
}

function ensureValidationMessage(form: HTMLFormElement): HTMLElement {
  const existing = form.querySelector<HTMLElement>("[data-intake-validation-message]");
  if (existing) return existing;

  const message = document.createElement("p");
  message.dataset.intakeValidationMessage = "true";
  message.className = "submission-note";
  message.setAttribute("role", "alert");
  message.setAttribute("aria-live", "assertive");

  const actions = form.querySelector(".submission-actions");
  if (actions) actions.prepend(message);
  else form.prepend(message);
  return message;
}

function simplifySlopDrop(form: HTMLFormElement): HTMLInputElement | null {
  const attestation = form.querySelector<HTMLInputElement>("input[name='submitAttestation']");
  if (!attestation) return null;

  form.noValidate = true;
  attestation.required = false;
  attestation.closest<HTMLElement>("label.check-row")?.setAttribute("hidden", "");

  const title = form.querySelector<HTMLInputElement>("#title");
  if (title) {
    title.value = "";
    title.disabled = true;
    title.closest<HTMLElement>("div")?.setAttribute("hidden", "");
  }

  const details = form.querySelector<HTMLDetailsElement>("details");
  if (details) {
    details.hidden = false;
    details.open = true;
    details.querySelector<HTMLElement>("summary")?.setAttribute("hidden", "");

    const description = details.querySelector<HTMLTextAreaElement>("#summary");
    const descriptionBlock = description?.closest<HTMLElement>("div") ?? null;
    Array.from(details.children).forEach((child) => {
      if (child instanceof HTMLElement && child.tagName === "DIV") {
        child.hidden = child !== descriptionBlock;
      }
    });

    if (description) {
      description.removeAttribute("minlength");
      description.placeholder = "Whatever you want.";
    }
  }

  form.querySelectorAll<HTMLButtonElement>("button[type='button']").forEach((button) => {
    button.hidden = true;
  });

  form.querySelectorAll<HTMLElement>(".submission-note").forEach((note) => {
    if (!note.closest(".submission-actions")) note.hidden = true;
  });

  return attestation;
}

export function IntakeValidationBridge() {
  useEffect(() => {
    const syncSubmissionSurface = () => {
      document.querySelectorAll<HTMLFormElement>("form.submission-panel").forEach((form) => {
        simplifySlopDrop(form);
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const submit = target?.closest<HTMLButtonElement>("button[type='submit']");
      const form = submit?.closest<HTMLFormElement>("form.submission-panel");
      if (!submit || submit.disabled || !form) return;

      const attestation = simplifySlopDrop(form);
      if (!attestation) return;

      // SEND SLOP is the one explicit submission action. Record the existing
      // attestation, then enter the browser's real submit pipeline so React's
      // onSubmit owns the upload transaction. No synthetic submit event.
      event.preventDefault();
      attestation.checked = true;
      form.noValidate = true;
      form.requestSubmit(submit);
    };

    const onInvalid = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      const form = target.closest<HTMLFormElement>("form.submission-panel");
      if (!form) return;

      const label = fieldLabel(target);
      const message = ensureValidationMessage(form);
      message.textContent = `Submission blocked: complete “${label}”. Nothing has uploaded yet.`;

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.focus({ preventScroll: true });
      });
    };

    const observer = new MutationObserver(syncSubmissionSurface);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("invalid", onInvalid, true);
    syncSubmissionSurface();

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("invalid", onInvalid, true);
    };
  }, []);

  return null;
}

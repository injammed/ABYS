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
  form.querySelector<HTMLInputElement>("#title")?.closest<HTMLElement>("div")?.setAttribute("hidden", "");
  form.querySelector<HTMLElement>("details")?.setAttribute("hidden", "");
  form.querySelectorAll<HTMLButtonElement>("button[type='button']").forEach((button) => {
    button.hidden = true;
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

      // THROW IT IN is the single explicit submission action. That click also
      // records the existing AI/safety/rights attestation before the unchanged
      // SlopDrop upload path runs; quarantine and moderation remain untouched.
      event.preventDefault();
      attestation.checked = true;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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

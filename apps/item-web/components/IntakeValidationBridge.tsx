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

export function IntakeValidationBridge() {
  useEffect(() => {
    const syncAutonomousRequirement = () => {
      document.querySelectorAll<HTMLFormElement>("form.submission-panel").forEach((form) => {
        if (form.querySelector("input[name='submitAttestation']")) form.noValidate = true;

        const origin = form.querySelector<HTMLSelectElement>("select[name='originClass']");
        const autonomous = form.querySelector<HTMLInputElement>("input[name='autonomousAccuracy']");
        if (!autonomous) return;

        const isAutonomous = origin?.value === "autonomous_ai_run";
        autonomous.required = isAutonomous;
        autonomous.setAttribute("aria-required", isAutonomous ? "true" : "false");
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const submit = target?.closest<HTMLButtonElement>("button[type='submit']");
      const form = submit?.closest<HTMLFormElement>("form.submission-panel");
      if (!submit || submit.disabled || !form?.querySelector("input[name='submitAttestation']")) return;

      // Safari can consume the default submit action before React receives the
      // submit event. Own this one click explicitly and dispatch the same form
      // submit event that SlopDrop already handles and validates.
      event.preventDefault();
      form.noValidate = true;
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    };

    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || target.name !== "originClass") return;
      syncAutonomousRequirement();
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

    const observer = new MutationObserver(syncAutonomousRequirement);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    document.addEventListener("invalid", onInvalid, true);
    syncAutonomousRequirement();

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
      document.removeEventListener("invalid", onInvalid, true);
    };
  }, []);

  return null;
}

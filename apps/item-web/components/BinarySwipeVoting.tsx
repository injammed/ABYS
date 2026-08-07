"use client";

import { useEffect } from "react";

const SWIPE_THRESHOLD = 72;
const AXIS_DOMINANCE = 1.2;

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, [role='button']"));
}

function normalizeCard(card: HTMLElement) {
  if (card.classList.contains("private-preview-card")) return;

  const preserve = card.querySelector<HTMLButtonElement>("button.judge.preserve");
  const refine = card.querySelector<HTMLButtonElement>("button.judge.refine");
  const slop = card.querySelector<HTMLButtonElement>("button.judge.slop");
  const row = card.querySelector<HTMLElement>(".judgment-row");

  if (preserve) {
    preserve.textContent = "Museum";
    preserve.setAttribute("aria-label", "Vote Museum");
    preserve.dataset.binaryVote = "museum";
  }

  if (slop) {
    slop.textContent = "Slop";
    slop.setAttribute("aria-label", "Vote Slop");
    slop.dataset.binaryVote = "slop";
  }

  if (refine) {
    refine.hidden = true;
    refine.setAttribute("aria-hidden", "true");
    refine.tabIndex = -1;
  }

  if (row) {
    row.dataset.voteContract = "binary-slop-museum-v1";
    row.setAttribute("aria-label", "Vote Slop or Museum");
  }

  card.dataset.swipeVoting = "enabled";
}

function normalizeAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".artifact-card").forEach(normalizeCard);
}

export function BinarySwipeVoting() {
  useEffect(() => {
    normalizeAll();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(".artifact-card")) normalizeCard(node as HTMLElement);
          normalizeAll(node);
        }
      }
    });

    const field = document.querySelector<HTMLElement>("#field");
    if (!field) return;

    observer.observe(field, { childList: true, subtree: true });

    let activeCard: HTMLElement | null = null;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let deltaY = 0;

    const reset = () => {
      if (activeCard) {
        activeCard.classList.remove("swipe-left", "swipe-right", "swipe-armed");
        activeCard.style.removeProperty("--swipe-x");
      }
      activeCard = null;
      pointerId = null;
      deltaX = 0;
      deltaY = 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>(".artifact-card[data-swipe-voting='enabled']");
      if (!card || card.classList.contains("private-preview-card")) return;

      activeCard = card;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      deltaY = 0;
      card.classList.add("swipe-armed");
      card.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!activeCard || pointerId !== event.pointerId) return;
      deltaX = event.clientX - startX;
      deltaY = event.clientY - startY;

      const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * AXIS_DOMINANCE;
      if (!horizontalIntent) {
        activeCard.classList.remove("swipe-left", "swipe-right");
        activeCard.style.removeProperty("--swipe-x");
        return;
      }

      activeCard.style.setProperty("--swipe-x", `${Math.max(-110, Math.min(110, deltaX))}px`);
      activeCard.classList.toggle("swipe-left", deltaX < -24);
      activeCard.classList.toggle("swipe-right", deltaX > 24);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!activeCard || pointerId !== event.pointerId) return;
      const card = activeCard;
      const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * AXIS_DOMINANCE;

      if (horizontalIntent && deltaX <= -SWIPE_THRESHOLD) {
        card.querySelector<HTMLButtonElement>("button.judge.slop")?.click();
      } else if (horizontalIntent && deltaX >= SWIPE_THRESHOLD) {
        card.querySelector<HTMLButtonElement>("button.judge.preserve")?.click();
      }

      reset();
    };

    const onPointerCancel = () => reset();

    field.addEventListener("pointerdown", onPointerDown);
    field.addEventListener("pointermove", onPointerMove);
    field.addEventListener("pointerup", onPointerUp);
    field.addEventListener("pointercancel", onPointerCancel);

    return () => {
      observer.disconnect();
      field.removeEventListener("pointerdown", onPointerDown);
      field.removeEventListener("pointermove", onPointerMove);
      field.removeEventListener("pointerup", onPointerUp);
      field.removeEventListener("pointercancel", onPointerCancel);
      reset();
    };
  }, []);

  return (
    <style>{`
      .artifact-card[data-swipe-voting="enabled"] {
        touch-action: pan-y;
      }

      .artifact-card[data-swipe-voting="enabled"].swipe-armed {
        transform: translateX(var(--swipe-x, 0px));
        transition: transform 60ms linear;
        will-change: transform;
      }

      .artifact-card[data-swipe-voting="enabled"].swipe-left {
        box-shadow: -20px 24px 90px rgba(134,144,90,.24);
      }

      .artifact-card[data-swipe-voting="enabled"].swipe-right {
        box-shadow: 20px 24px 90px rgba(213,166,63,.24);
      }

      .artifact-card[data-swipe-voting="enabled"] .judgment-row[data-vote-contract="binary-slop-museum-v1"] {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .artifact-card[data-swipe-voting="enabled"] .judge[data-binary-vote="slop"] {
        grid-column: 1;
      }

      .artifact-card[data-swipe-voting="enabled"] .judge[data-binary-vote="museum"] {
        grid-column: 2;
      }

      .artifact-card[data-swipe-voting="enabled"] .judge[data-binary-vote="museum"].selected {
        border-color: var(--gold);
        color: var(--gold-light);
        background: rgba(213,166,63,.12);
      }

      @media (prefers-reduced-motion: reduce) {
        .artifact-card[data-swipe-voting="enabled"].swipe-armed {
          transform: none;
          transition: none;
        }
      }
    `}</style>
  );
}

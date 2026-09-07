"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function focusBallot(): boolean {
  const ballots = Array.from(document.querySelectorAll<HTMLButtonElement>("#field button[data-binary-vote='slop']:not(:disabled)"));
  const ballot = ballots.find((button) => button.getBoundingClientRect().bottom > 120) ?? ballots[0];
  if (!ballot) return false;
  ballot.closest(".judgment-row")?.scrollIntoView({ block: "center", behavior: "auto" });
  ballot.focus({ preventScroll: true });
  return true;
}

export function VoteShortcut({ mode }: { mode?: "feed" | "museum" | "shop" }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode !== "feed") return;
    let observer: MutationObserver | undefined;
    let timeout: number | undefined;
    const stop = () => { observer?.disconnect(); window.clearTimeout(timeout); };
    const arrive = () => {
      stop();
      if (window.location.hash !== "#vote" || focusBallot()) return;
      observer = new MutationObserver(() => { if (focusBallot()) stop(); });
      const field = document.getElementById("field");
      if (field) observer.observe(field, { childList: true, subtree: true });
      timeout = window.setTimeout(() => { stop(); setMessage("No public work is ready to vote on yet."); }, 10000);
    };
    arrive();
    window.addEventListener("hashchange", arrive);
    return () => { stop(); window.removeEventListener("hashchange", arrive); };
  }, [mode]);

  const contents = <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="m8 12 3 3 5-6" /></svg><span>VOTE</span></>;

  return (
    <div className="vote-shortcut">
      {mode === "feed" ? <button className="primary-action" type="button" onClick={() => setMessage(focusBallot() ? "" : "No public work is ready to vote on yet.")}>{contents}</button> : <Link href="/#vote" className="primary-action">{contents}</Link>}
      {message && <button type="button" className="gallery-notice" onClick={() => setMessage("")} aria-label={`${message} Dismiss`}><span role="status">{message}</span><span aria-hidden="true">×</span></button>}
    </div>
  );
}

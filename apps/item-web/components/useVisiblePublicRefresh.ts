"use client";

import { useEffect, useRef } from "react";

export function useVisiblePublicRefresh(
  refresh: () => Promise<void>,
  intervalMs: number,
  eventNames: readonly string[] = [],
): void {
  const refreshRef = useRef(refresh);
  const inFlightRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (
        cancelled
        || inFlightRef.current
        || document.visibilityState !== "visible"
        || !navigator.onLine
      ) {
        return;
      }

      inFlightRef.current = true;
      void refreshRef.current()
        .catch(() => undefined)
        .finally(() => {
          inFlightRef.current = false;
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") run();
    };

    const interval = window.setInterval(run, intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    for (const eventName of eventNames) window.addEventListener(eventName, run);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const eventName of eventNames) window.removeEventListener(eventName, run);
    };
  }, [eventNames, intervalMs]);
}

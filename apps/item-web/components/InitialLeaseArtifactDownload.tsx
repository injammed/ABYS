"use client";

import type { MouseEvent, ReactNode } from "react";
import { acquireArtifactMediaLeaseByPartId } from "@/lib/media-lease";
import { RenewableArtifactDownload } from "./RenewableArtifactMedia";

export function InitialLeaseArtifactDownload({
  initialUrl,
  partId,
  filename,
  className,
  ariaLabel,
  children,
}: {
  initialUrl?: string;
  partId: string;
  filename?: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (initialUrl) {
    return (
      <RenewableArtifactDownload
        initialUrl={initialUrl}
        filename={filename}
        className={className}
        ariaLabel={ariaLabel}
      >
        {children}
      </RenewableArtifactDownload>
    );
  }

  async function acquireAndDownload(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    try {
      const freshUrl = await acquireArtifactMediaLeaseByPartId(partId);
      const anchor = document.createElement("a");
      anchor.href = freshUrl;
      anchor.download = filename || "artifact-material";
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      // A later click retries the bounded acquisition path. No new recovery UI.
    }
  }

  return (
    <a
      className={className}
      href="#"
      download={filename || true}
      aria-label={ariaLabel}
      data-initial-lease-download="true"
      onClick={acquireAndDownload}
    >
      {children}
    </a>
  );
}

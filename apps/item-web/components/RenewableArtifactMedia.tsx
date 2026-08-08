"use client";

import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { renewArtifactMediaLease, storagePathFromArtifactSignedUrl } from "@/lib/media-lease";

type MediaKind = "image" | "video" | "audio";

export function RenewableArtifactMedia({
  kind,
  initialUrl,
  className,
  ariaLabel,
}: {
  kind: MediaKind;
  initialUrl: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const renewingRef = useRef(false);
  const attemptedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setUrl(initialUrl);
    attemptedUrlRef.current = null;
  }, [initialUrl]);

  const recoverLease = () => {
    if (renewingRef.current || attemptedUrlRef.current === url) return;
    if (!storagePathFromArtifactSignedUrl(url)) return;

    attemptedUrlRef.current = url;
    renewingRef.current = true;
    void renewArtifactMediaLease(url)
      .then((freshUrl) => setUrl(freshUrl))
      .catch(() => undefined)
      .finally(() => {
        renewingRef.current = false;
      });
  };

  if (kind === "image") {
    return <img className={className} src={url} alt="" loading="lazy" onError={recoverLease} />;
  }

  if (kind === "video") {
    return <video className={className} src={url} controls preload="metadata" playsInline aria-label={ariaLabel} onError={recoverLease} />;
  }

  return <audio className={className} src={url} controls preload="metadata" aria-label={ariaLabel} onError={recoverLease} />;
}

export function RenewableArtifactDownload({
  initialUrl,
  filename,
  className,
  ariaLabel,
  children,
}: {
  initialUrl: string;
  filename?: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!storagePathFromArtifactSignedUrl(initialUrl)) return;
    event.preventDefault();

    try {
      const freshUrl = await renewArtifactMediaLease(initialUrl);
      const anchor = document.createElement("a");
      anchor.href = freshUrl;
      anchor.download = filename || "artifact-material";
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      // If renewal itself is unavailable, preserve ordinary browser behavior
      // rather than inventing another user-facing recovery control.
      window.location.assign(initialUrl);
    }
  }

  return (
    <a
      className={className}
      href={initialUrl}
      download={filename || true}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

"use client";

import { useEffect, useState } from "react";
import { acquireArtifactMediaLeaseByPartId } from "@/lib/media-lease";
import { RenewableArtifactMedia } from "./RenewableArtifactMedia";

type MediaKind = "image" | "video" | "audio";

export function InitialLeaseArtifactMedia({
  kind,
  initialUrl,
  partId,
  className,
  ariaLabel,
}: {
  kind: MediaKind;
  initialUrl?: string;
  partId: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);

  useEffect(() => {
    let cancelled = false;
    setUrl(initialUrl ?? null);

    if (!initialUrl) {
      void acquireArtifactMediaLeaseByPartId(partId)
        .then((freshUrl) => {
          if (!cancelled) setUrl(freshUrl);
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [initialUrl, partId]);

  if (!url) {
    return <div className={className} data-media-lease-pending="true" aria-hidden="true" />;
  }

  return (
    <RenewableArtifactMedia
      kind={kind}
      initialUrl={url}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}

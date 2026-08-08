import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const MEDIA_LEASE_SECONDS = 60 * 60;
const SIGNED_OBJECT_MARKER = "/object/sign/artifact-media/";
const inFlight = new Map<string, Promise<string>>();

export function storagePathFromArtifactSignedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const markerIndex = url.pathname.indexOf(SIGNED_OBJECT_MARKER);
    if (markerIndex < 0) return null;
    const encodedPath = url.pathname.slice(markerIndex + SIGNED_OBJECT_MARKER.length);
    return encodedPath ? decodeURIComponent(encodedPath) : null;
  } catch {
    return null;
  }
}

export function renewArtifactMediaLease(currentSignedUrl: string): Promise<string> {
  const storagePath = storagePathFromArtifactSignedUrl(currentSignedUrl);
  if (!storagePath) return Promise.reject(new Error("ARTIFACT_MEDIA_PATH_UNAVAILABLE"));

  const existing = inFlight.get(storagePath);
  if (existing) return existing;

  const request = (async () => {
    const client = requireSupabaseBrowserClient();
    const { data, error } = await client.storage
      .from("artifact-media")
      .createSignedUrl(storagePath, MEDIA_LEASE_SECONDS);
    if (error || !data?.signedUrl) throw error ?? new Error("ARTIFACT_MEDIA_LEASE_MISSING");
    return data.signedUrl;
  })();

  inFlight.set(storagePath, request);
  void request.finally(() => {
    if (inFlight.get(storagePath) === request) inFlight.delete(storagePath);
  }).catch(() => undefined);
  return request;
}

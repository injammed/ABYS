import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const MEDIA_LEASE_SECONDS = 60 * 60;
const SIGNED_OBJECT_MARKER = "/object/sign/artifact-media/";
const INITIAL_LEASE_RETRY_DELAYS_MS = [0, 400, 1200, 3000] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const inFlight = new Map<string, Promise<string>>();
const partInFlight = new Map<string, Promise<string>>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function leaseForStoragePath(storagePath: string): Promise<string> {
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

export function renewArtifactMediaLease(currentSignedUrl: string): Promise<string> {
  const storagePath = storagePathFromArtifactSignedUrl(currentSignedUrl);
  if (!storagePath) return Promise.reject(new Error("ARTIFACT_MEDIA_PATH_UNAVAILABLE"));
  return leaseForStoragePath(storagePath);
}

export function acquireArtifactMediaLeaseByPartId(partId: string): Promise<string> {
  if (!UUID_PATTERN.test(partId)) return Promise.reject(new Error("ARTIFACT_PART_ID_INVALID"));

  const existing = partInFlight.get(partId);
  if (existing) return existing;

  const request = (async () => {
    const client = requireSupabaseBrowserClient();
    let lastError: unknown = new Error("ARTIFACT_MEDIA_INITIAL_LEASE_UNAVAILABLE");

    for (const waitMs of INITIAL_LEASE_RETRY_DELAYS_MS) {
      if (waitMs > 0) await delay(waitMs);

      const { data: part, error: partError } = await client
        .from("artifact_parts")
        .select("storage_path")
        .eq("id", partId)
        .maybeSingle();

      const storagePath = typeof part?.storage_path === "string" ? part.storage_path : null;
      if (!partError && storagePath) {
        try {
          return await leaseForStoragePath(storagePath);
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      lastError = partError ?? new Error("ARTIFACT_PART_STORAGE_PATH_UNAVAILABLE");
    }

    throw lastError;
  })();

  partInFlight.set(partId, request);
  void request.finally(() => {
    if (partInFlight.get(partId) === request) partInFlight.delete(partId);
  }).catch(() => undefined);
  return request;
}

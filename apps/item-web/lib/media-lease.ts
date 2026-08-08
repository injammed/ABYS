import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const MEDIA_LEASE_SECONDS = 60 * 60;
const inFlight = new Map<string, Promise<string>>();

export function renewArtifactMediaLease(storagePath: string): Promise<string> {
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

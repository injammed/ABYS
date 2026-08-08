import { requireSupabasePublicBrowserClient } from "@/lib/supabase-browser";

const PUBLIC_RECEIPT_DELAYS_MS = [0, 120, 350, 800, 1600, 3000] as const;
const PUBLIC_MEDIA_RECEIPT_SECONDS = 60;

type PublicPartReceiptRow = {
  id: string;
  part_kind: "file" | "text" | "reference";
  storage_path: string | null;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForPublicArtifactReceipt(
  artifactId: string,
  expectedPartCount: number,
): Promise<boolean> {
  const client = requireSupabasePublicBrowserClient();
  let lastError: unknown = null;

  for (const waitMs of PUBLIC_RECEIPT_DELAYS_MS) {
    if (waitMs > 0) await delay(waitMs);

    try {
      const { data: artifact, error: artifactError } = await client
        .from("artifacts")
        .select("id")
        .eq("id", artifactId)
        .eq("status", "approved")
        .eq("lane", "unjudged")
        .not("published_at", "is", null)
        .maybeSingle();

      if (artifactError) throw artifactError;
      lastError = null;
      if (!artifact) continue;

      const { data: parts, error: partsError } = await client
        .from("artifact_parts")
        .select("id,part_kind,storage_path")
        .eq("artifact_id", artifactId)
        .order("position", { ascending: true });

      if (partsError) throw partsError;
      lastError = null;
      const visibleParts = (parts ?? []) as PublicPartReceiptRow[];
      if (visibleParts.length < expectedPartCount) continue;

      const storagePaths = visibleParts.flatMap((part) =>
        part.part_kind === "file" && part.storage_path ? [part.storage_path] : []
      );

      if (storagePaths.length > 0) {
        const { data: signed, error: signedError } = await client.storage
          .from("artifact-media")
          .createSignedUrls(storagePaths, PUBLIC_MEDIA_RECEIPT_SECONDS);
        if (signedError) throw signedError;
        lastError = null;
        if ((signed ?? []).length !== storagePaths.length) continue;
        if ((signed ?? []).some((entry) => !entry.signedUrl)) continue;
      }

      return true;
    } catch (error) {
      // A lost commit acknowledgement and a failed proof read often share the
      // same transient network cause. Treat read/lease transport errors as
      // ambiguous and use the remaining bounded proof attempts before telling
      // the caller that public confirmation could not be established.
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return false;
}

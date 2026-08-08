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
  // Deliberately use a sessionless client. The creator has an owner RLS path;
  // this receipt must prove the same row, manifest, and file materials are
  // visible through the anonymous public boundary before the UI claims Public.
  const client = requireSupabasePublicBrowserClient();

  for (const waitMs of PUBLIC_RECEIPT_DELAYS_MS) {
    if (waitMs > 0) await delay(waitMs);

    const { data: artifact, error: artifactError } = await client
      .from("artifacts")
      .select("id")
      .eq("id", artifactId)
      .eq("status", "approved")
      .eq("lane", "unjudged")
      .not("published_at", "is", null)
      .maybeSingle();

    if (artifactError) throw artifactError;
    if (!artifact) continue;

    const { data: parts, error: partsError } = await client
      .from("artifact_parts")
      .select("id,part_kind,storage_path")
      .eq("artifact_id", artifactId)
      .order("position", { ascending: true });

    if (partsError) throw partsError;
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
      if ((signed ?? []).length !== storagePaths.length) continue;
      if ((signed ?? []).some((entry) => !entry.signedUrl)) continue;
    }

    return true;
  }

  return false;
}

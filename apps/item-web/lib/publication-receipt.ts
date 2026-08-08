import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const PUBLIC_RECEIPT_DELAYS_MS = [0, 120, 350, 800, 1600, 3000] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForPublicArtifactReceipt(
  artifactId: string,
  expectedPartCount: number,
): Promise<boolean> {
  const client = requireSupabaseBrowserClient();

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

    const { count, error: partsError } = await client
      .from("artifact_parts")
      .select("id", { count: "exact", head: true })
      .eq("artifact_id", artifactId);

    if (partsError) throw partsError;
    if ((count ?? 0) >= expectedPartCount) return true;
  }

  return false;
}

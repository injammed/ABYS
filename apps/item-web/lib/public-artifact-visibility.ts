import { requireSupabasePublicBrowserClient } from "@/lib/supabase-browser";

const MAX_PUBLIC_VISIBILITY_IDS = 100;

export async function loadPublicArtifactVisibility(artifactIds: string[]): Promise<Set<string>> {
  const ids = Array.from(new Set(artifactIds)).slice(0, MAX_PUBLIC_VISIBILITY_IDS);
  if (ids.length === 0) return new Set();

  const client = requireSupabasePublicBrowserClient();
  const { data, error } = await client
    .from("artifacts")
    .select("id")
    .eq("status", "approved")
    .in("id", ids);

  if (error) throw error;
  return new Set((data ?? []).map((row) => String(row.id)));
}

import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type MuseumArtifact = {
  id: string;
  title: string;
  summary: string;
  creatorName: string;
  publishedAt: string;
  mediaPath: string;
  mediaUrl?: string;
};

export async function loadMuseumRegistry(limit = 24): Promise<MuseumArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const boundedLimit = Math.max(1, Math.min(limit, 24));
  const { data, error } = await client
    .from("artifacts")
    .select(
      "id,title,summary,published_at,media_path,profiles!artifacts_creator_id_fkey(display_name)"
    )
    .eq("status", "approved")
    .eq("lane", "aetimm")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(boundedLimit);

  if (error) throw error;

  type MuseumRow = {
    id: string;
    title: string;
    summary: string;
    published_at: string;
    media_path: string;
    profiles?: { display_name?: string } | Array<{ display_name?: string }> | null;
  };

  const rows = (data ?? []) as unknown as MuseumRow[];

  return Promise.all(
    rows.map(async (row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const { data: signed, error: signedError } = await client.storage
        .from("artifact-media")
        .createSignedUrl(row.media_path, 60 * 60);

      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        creatorName: profile?.display_name || "Anonymous creator",
        publishedAt: row.published_at,
        mediaPath: row.media_path,
        mediaUrl: signedError ? undefined : signed?.signedUrl,
      };
    }),
  );
}

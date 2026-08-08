export const SUBMIT_INTENT_STORAGE_KEY = "aetimm:intent:submit:v1";
export const VOTE_INTENT_STORAGE_KEY = "aetimm:intent:vote:v1";
export const AUTH_REQUIRED_EVENT = "aetimm:auth-required";

const ARTIFACT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PublicVoteIntent = {
  artifactId: string;
  judgment: "preserve" | "slop";
};

export function encodePublicVoteIntent(intent: PublicVoteIntent): string {
  return JSON.stringify(intent);
}

export function decodePublicVoteIntent(value: string | null): PublicVoteIntent | null {
  if (!value || value.length > 256) return null;

  try {
    const parsed = JSON.parse(value) as Partial<PublicVoteIntent>;
    const artifactId = typeof parsed.artifactId === "string" ? parsed.artifactId.trim() : "";
    const judgment = parsed.judgment;

    if (!ARTIFACT_ID_PATTERN.test(artifactId)) return null;
    if (judgment !== "preserve" && judgment !== "slop") return null;

    return { artifactId, judgment };
  } catch {
    return null;
  }
}

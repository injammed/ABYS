export const SUBMIT_INTENT_STORAGE_KEY = "aetimm:intent:submit:v1";
export const VOTE_INTENT_STORAGE_KEY = "aetimm:intent:vote:v1";
export const AUTH_REQUIRED_EVENT = "aetimm:auth-required";

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

    if (artifactId.length < 1 || artifactId.length > 100) return null;
    if (judgment !== "preserve" && judgment !== "slop") return null;

    return { artifactId, judgment };
  } catch {
    return null;
  }
}

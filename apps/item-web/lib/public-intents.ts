export const SUBMIT_INTENT_STORAGE_KEY = "aetimm:intent:submit:v1";
export const VOTE_INTENT_STORAGE_KEY = "aetimm:intent:vote:v1";
export const AUTH_REQUIRED_EVENT = "aetimm:auth-required";

const CROSS_TAB_SUBMIT_INTENT_KEY = "aetimm:auth-bridge:submit:v1";
const CROSS_TAB_VOTE_INTENT_KEY = "aetimm:auth-bridge:vote:v1";
const PUBLIC_AUTH_INTENT_TTL_MS = 30 * 60 * 1000;
const MAX_BRIDGED_INTENT_BYTES = 512;
const ARTIFACT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type IntentEnvelope = {
  createdAt: number;
  value: string;
};

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

const bridgePairs = [
  [SUBMIT_INTENT_STORAGE_KEY, CROSS_TAB_SUBMIT_INTENT_KEY],
  [VOTE_INTENT_STORAGE_KEY, CROSS_TAB_VOTE_INTENT_KEY],
] as const;

function validEnvelope(raw: string | null, now: number): IntentEnvelope | null {
  if (!raw || raw.length > MAX_BRIDGED_INTENT_BYTES) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<IntentEnvelope>;
    if (typeof parsed.createdAt !== "number" || !Number.isFinite(parsed.createdAt)) return null;
    if (typeof parsed.value !== "string" || parsed.value.length > 256) return null;
    if (parsed.createdAt > now + 60_000) return null;
    if (now - parsed.createdAt > PUBLIC_AUTH_INTENT_TTL_MS) return null;
    return { createdAt: parsed.createdAt, value: parsed.value };
  } catch {
    return null;
  }
}

export function mirrorPublicAuthIntentsAcrossTabs(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();

  for (const [sessionKey, bridgeKey] of bridgePairs) {
    const value = window.sessionStorage.getItem(sessionKey);
    if (value == null || value.length > 256) continue;
    const envelope: IntentEnvelope = { createdAt: now, value };
    window.localStorage.setItem(bridgeKey, JSON.stringify(envelope));
  }
}

export function restorePublicAuthIntentsForThisTab(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();

  for (const [sessionKey, bridgeKey] of bridgePairs) {
    const raw = window.localStorage.getItem(bridgeKey);
    const envelope = validEnvelope(raw, now);
    if (!envelope) {
      if (raw != null) window.localStorage.removeItem(bridgeKey);
      continue;
    }

    // Never overwrite a newer action already taken in this tab.
    if (window.sessionStorage.getItem(sessionKey) == null) {
      window.sessionStorage.setItem(sessionKey, envelope.value);
    }
  }
}

export function clearCrossTabPublicAuthIntents(): void {
  if (typeof window === "undefined") return;
  for (const [, bridgeKey] of bridgePairs) window.localStorage.removeItem(bridgeKey);
}

// Restore before component effects ask Auth for a session. The bridge contains
// only tiny action intent, never files, text, links, credentials, or tokens.
if (typeof window !== "undefined") restorePublicAuthIntentsForThisTab();

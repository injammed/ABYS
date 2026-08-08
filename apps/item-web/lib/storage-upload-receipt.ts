import { ensureFreshAuthenticatedSession } from "@/lib/auth-session";
import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const STORAGE_UPLOAD_RETRY_DELAYS_MS = [0, 250, 800, 1800] as const;
const STORAGE_RECONNECT_GRACE_MS = 30_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

async function waitForOnlineUntil(deadline: number): Promise<void> {
  if (browserIsOnline() || typeof window === "undefined") return;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("online", finish);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, remaining);
    window.addEventListener("online", finish, { once: true });
  });
}

async function artifactObjectReadable(path: string): Promise<boolean> {
  try {
    const client = requireSupabaseBrowserClient();
    const { data, error } = await client.storage
      .from("artifact-media")
      .createSignedUrl(path, 60);
    return !error && Boolean(data?.signedUrl);
  } catch {
    return false;
  }
}

export async function uploadArtifactObject(
  path: string,
  file: File,
  contentType: string,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const expectedUserId = path.split("/", 1)[0] || undefined;
  const reconnectDeadline = Date.now() + STORAGE_RECONNECT_GRACE_MS;
  let lastError: unknown = new Error("ARTIFACT_STORAGE_UPLOAD_CONFIRMATION_FAILED");

  await ensureFreshAuthenticatedSession(expectedUserId);

  for (const waitMs of STORAGE_UPLOAD_RETRY_DELAYS_MS) {
    // A brief Wi-Fi/cellular transition is not a meaningful upload failure.
    // Pause the bounded retry path instead of burning attempts while offline.
    await waitForOnlineUntil(reconnectDeadline);
    if (waitMs > 0) await delay(waitMs);

    // A reconnect or long retry delay may cross token expiry. This is a local
    // preflight only when the session is near expiry; healthy sessions return
    // without another refresh request.
    await ensureFreshAuthenticatedSession(expectedUserId);

    const { error } = await client.storage
      .from("artifact-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });

    if (!error) return;
    lastError = error;

    // A transport can fail after Storage accepted the object but before the
    // acknowledgement reaches the browser. An owner-readable signed URL is the
    // receipt for that exact random path; if it exists, do not duplicate or
    // report a false failure.
    if (await artifactObjectReadable(path)) return;
  }

  await waitForOnlineUntil(reconnectDeadline);
  await ensureFreshAuthenticatedSession(expectedUserId);
  if (await artifactObjectReadable(path)) return;
  throw lastError;
}

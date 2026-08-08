import type { Session } from "@supabase/supabase-js";
import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const SESSION_REFRESH_SKEW_SECONDS = 60;

export async function ensureFreshAuthenticatedSession(expectedUserId?: string): Promise<Session> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw error ?? new Error("AUTH_SESSION_REQUIRED");

  let session = data.session;
  if (expectedUserId && session.user.id !== expectedUserId) {
    throw new Error("AUTH_SESSION_OWNER_CHANGED");
  }

  const expiresAt = session.expires_at ?? 0;
  const needsRefresh = expiresAt <= Math.floor(Date.now() / 1000) + SESSION_REFRESH_SKEW_SECONDS;
  if (!needsRefresh) return session;

  const refreshed = await client.auth.refreshSession();
  if (refreshed.error || !refreshed.data.session) {
    throw refreshed.error ?? new Error("AUTH_SESSION_REFRESH_FAILED");
  }

  session = refreshed.data.session;
  if (expectedUserId && session.user.id !== expectedUserId) {
    throw new Error("AUTH_SESSION_OWNER_CHANGED");
  }

  return session;
}

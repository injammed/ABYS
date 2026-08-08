import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const socialBackendEnabled = Boolean(url && browserKey);

let browserClient: SupabaseClient | null = null;
let publicBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!socialBackendEnabled || !url || !browserKey) return null;

  if (!browserClient) {
    browserClient = createClient(url, browserKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export function getSupabasePublicBrowserClient(): SupabaseClient | null {
  if (!socialBackendEnabled || !url || !browserKey) return null;

  if (!publicBrowserClient) {
    publicBrowserClient = createClient(url, browserKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return publicBrowserClient;
}

export function requireSupabaseBrowserClient(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Social backend is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a browser-safe Supabase publishable or anon key in the deployment environment."
    );
  }

  return client;
}

export function requireSupabasePublicBrowserClient(): SupabaseClient {
  const client = getSupabasePublicBrowserClient();
  if (!client) {
    throw new Error(
      "Public social backend is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a browser-safe Supabase publishable or anon key in the deployment environment."
    );
  }

  return client;
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const socialBackendEnabled = Boolean(url && browserKey);

export type SocialProvider = "google" | "github";

const supportedSocialProviders: SocialProvider[] = ["github", "google"];
const AUTH_SETTINGS_RETRY_DELAYS_MS = [0, 350, 1000, 2500] as const;

let browserClient: SupabaseClient | null = null;
let publicBrowserClient: SupabaseClient | null = null;
let socialProviderPromise: Promise<Set<SocialProvider>> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function fetchEnabledSocialProviders(): Promise<Set<SocialProvider>> {
  if (!url || !browserKey) return new Set();
  let lastError: unknown = new Error("AUTH_SETTINGS_UNAVAILABLE");

  for (const waitMs of AUTH_SETTINGS_RETRY_DELAYS_MS) {
    if (waitMs > 0) await delay(waitMs);

    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
        method: "GET",
        headers: { apikey: browserKey },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`AUTH_SETTINGS_${response.status}`);

      const settings = await response.json() as { external?: Record<string, boolean> };
      return new Set(
        supportedSocialProviders.filter((provider) => settings.external?.[provider] === true),
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function loadEnabledSocialProviders(): Promise<Set<SocialProvider>> {
  if (!socialBackendEnabled || !url || !browserKey) return new Set();

  if (!socialProviderPromise) {
    const request = fetchEnabledSocialProviders().catch(() => {
      if (socialProviderPromise === request) socialProviderPromise = null;
      return new Set<SocialProvider>();
    });
    socialProviderPromise = request;
  }

  return socialProviderPromise;
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

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CreatorSubmissionManager } from "@/components/CreatorSubmissionManager";
import { LexiconText } from "@/components/LexiconBroadcast";
import { loadCurrentRole, type ProfileRole } from "@/lib/moderation";
import { AUTH_REQUIRED_EVENT } from "@/lib/public-intents";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";
type SocialProvider = "google" | "github";

export function AccountGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState<ProfileRole>("creator");
  const [busy, setBusy] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const loadAccountData = useCallback(async (activeSession: Session | null) => {
    const client = getSupabaseBrowserClient();
    if (!client || !activeSession) {
      setProfileName("");
      setProfileRole("creator");
      return;
    }

    const [{ data: profile }, role] = await Promise.all([
      client.from("profiles").select("display_name").eq("id", activeSession.user.id).maybeSingle(),
      loadCurrentRole(activeSession.user.id),
    ]);

    setProfileName(
      profile?.display_name ||
        activeSession.user.user_metadata.display_name ||
        activeSession.user.user_metadata.full_name ||
        activeSession.user.user_metadata.name ||
        activeSession.user.user_metadata.user_name ||
        activeSession.user.email?.split("@")[0] ||
        "Creator"
    );
    setProfileRole(role);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let mounted = true;
    document.documentElement.dataset.clientReady = "true";

    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      sessionRef.current = data.session;
      setSession(data.session);
      void loadAccountData(data.session).catch((error) => {
        if (mounted) setMessage(error instanceof Error ? error.message : "Account data could not be loaded.");
      });
    });

    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      sessionRef.current = nextSession;
      setSession(nextSession);
      void loadAccountData(nextSession).catch((error) => {
        if (mounted) setMessage(error instanceof Error ? error.message : "Account data could not be loaded.");
      });

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setOpen(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      delete document.documentElement.dataset.clientReady;
    };
  }, [loadAccountData]);

  useEffect(() => {
    const refreshAccount = () => {
      void loadAccountData(sessionRef.current).catch(() => undefined);
    };
    const openForRequiredAuth = () => {
      if (sessionRef.current) return;
      setMode("signin");
      setMessage(null);
      setOpen(true);
    };

    window.addEventListener("aetimm:submission-created", refreshAccount);
    window.addEventListener("aetimm:lifecycle-updated", refreshAccount);
    window.addEventListener(AUTH_REQUIRED_EVENT, openForRequiredAuth);

    return () => {
      window.removeEventListener("aetimm:submission-created", refreshAccount);
      window.removeEventListener("aetimm:lifecycle-updated", refreshAccount);
      window.removeEventListener(AUTH_REQUIRED_EVENT, openForRequiredAuth);
    };
  }, [loadAccountData]);

  async function socialSignIn(provider: SocialProvider) {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setBusy(true);
    setSocialProvider(provider);
    setMessage(null);

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not connect with ${provider}.`);
      setBusy(false);
      setSocialProvider(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();

    setBusy(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        setMessage("Account created. Check your email if confirmation is enabled.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !session) return;

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("profileDisplayName") ?? "").trim();

    setBusy(true);
    setMessage(null);

    try {
      const { error: profileError } = await client
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", session.user.id);
      if (profileError) throw profileError;

      const { error: userError } = await client.auth.updateUser({
        data: { ...session.user.user_metadata, display_name: displayName },
      });
      if (userError) throw userError;

      setProfileName(displayName);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    await client.auth.signOut();
    setBusy(false);
  }

  if (!socialBackendEnabled) {
    return (
      <button className="upload-trigger" type="button" disabled title="Social backend not configured" aria-label="Accounts soon">
        <LexiconText text="Accounts soon" phase={3} semantic={false} />
      </button>
    );
  }

  if (session) {
    const canCurate = profileRole === "curator" || profileRole === "admin";
    const accountLabel = profileName || session.user.email || "Account";
    const saveLabel = busy ? "Saving…" : "Save profile";

    return (
      <div className="upload-wrap" data-lexicon-surface="true">
        <button className="upload-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-label={accountLabel}>
          <LexiconText text={accountLabel} phase={5} semantic={false} />
        </button>
        {open && (
          <div className="upload-panel account-lifecycle-panel" role="dialog" aria-label="Profile and artifact lifecycle">
            <form onSubmit={saveProfile}>
              <div>
                <label htmlFor="profile-display-name"><LexiconText text="Display name" phase={11} /></label>
                <input
                  id="profile-display-name"
                  name="profileDisplayName"
                  required
                  minLength={2}
                  maxLength={40}
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  autoComplete="nickname"
                />
              </div>
              <button className="submit-button" type="submit" disabled={busy} aria-label={saveLabel}>
                <LexiconText text={saveLabel} phase={13} semantic={false} />
              </button>
            </form>

            {canCurate && (
              <Link className="curator-account-link" href="/curator/" aria-label="Open private curator queue">
                <LexiconText text="Open private curator queue" phase={17} semantic={false} />
              </Link>
            )}

            <CreatorSubmissionManager session={session} />

            <LexiconText as="p" className="submission-note" text={`Signed in as ${session.user.email || "social account"}`} phase={19} />
            {message && (
              <p className="submission-note" role="status" aria-label={message}>
                <LexiconText text={message} phase={23} semantic={false} />
              </p>
            )}
            <button className="submit-button" type="button" disabled={busy} onClick={signOut} aria-label="Sign out">
              <LexiconText text="Sign out" phase={29} semantic={false} />
            </button>
          </div>
        )}
      </div>
    );
  }

  const accountTrigger = open ? "Close account" : "Sign in";
  const googleLabel = socialProvider === "google" ? "Connecting to Google…" : "Continue with Google";
  const githubLabel = socialProvider === "github" ? "Connecting to GitHub…" : "Continue with GitHub";
  const submitLabel = busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in";

  return (
    <div className="upload-wrap" data-lexicon-surface="true">
      <button className="upload-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-label={accountTrigger}>
        <LexiconText text={accountTrigger} phase={31} semantic={false} />
      </button>

      {open && (
        <form className="upload-panel" onSubmit={submit}>
          <div style={{ display: "grid", gap: ".55rem" }}>
            <button
              className="submit-button"
              type="button"
              disabled={busy}
              onClick={() => void socialSignIn("google")}
              aria-label={googleLabel}
            >
              <LexiconText text={googleLabel} phase={37} semantic={false} />
            </button>
            <button
              className="submit-button"
              type="button"
              disabled={busy}
              onClick={() => void socialSignIn("github")}
              aria-label={githubLabel}
            >
              <LexiconText text={githubLabel} phase={41} semantic={false} />
            </button>
          </div>

          <LexiconText as="p" className="eyebrow" text="OR USE EMAIL" phase={43} />

          <div className="lane-tabs" aria-label="Account action">
            <button
              type="button"
              className={mode === "signin" ? "tab active" : "tab"}
              onClick={() => setMode("signin")}
              aria-label="Sign in"
            >
              <LexiconText text="Sign in" phase={47} semantic={false} />
            </button>
            <button
              type="button"
              className={mode === "signup" ? "tab active" : "tab"}
              onClick={() => setMode("signup")}
              aria-label="Create account"
            >
              <LexiconText text="Create account" phase={53} semantic={false} />
            </button>
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="account-display-name"><LexiconText text="Display name" phase={59} /></label>
              <input
                id="account-display-name"
                name="displayName"
                required
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
              />
            </div>
          )}

          <div>
            <label htmlFor="account-email"><LexiconText text="Email" phase={61} /></label>
            <input id="account-email" name="email" type="email" required autoComplete="email" />
          </div>

          <div>
            <label htmlFor="account-password"><LexiconText text="Password" phase={67} /></label>
            <input
              id="account-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <button className="submit-button" type="submit" disabled={busy} aria-label={submitLabel}>
            <LexiconText text={submitLabel} phase={71} semantic={false} />
          </button>

          {message && (
            <p className="submission-note" role="status" aria-label={message}>
              <LexiconText text={message} phase={73} semantic={false} />
            </p>
          )}
        </form>
      )}
    </div>
  );
}

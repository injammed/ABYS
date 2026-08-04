"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

export function AccountGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    void client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setOpen(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

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

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    await client.auth.signOut();
    setBusy(false);
  }

  if (!socialBackendEnabled) {
    return (
      <button className="upload-trigger" type="button" disabled title="Social backend not configured">
        Accounts soon
      </button>
    );
  }

  if (session) {
    return (
      <div className="upload-wrap">
        <button className="upload-trigger" type="button" onClick={() => setOpen((value) => !value)}>
          {session.user.user_metadata.display_name || session.user.email || "Account"}
        </button>
        {open && (
          <div className="upload-panel" role="dialog" aria-label="Account menu">
            <p className="submission-note">Signed in as {session.user.email}</p>
            <button className="submit-button" type="button" disabled={busy} onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="upload-wrap">
      <button className="upload-trigger" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Close account" : "Sign in"}
      </button>

      {open && (
        <form className="upload-panel" onSubmit={submit}>
          <div className="lane-tabs" aria-label="Account action">
            <button
              type="button"
              className={mode === "signin" ? "tab active" : "tab"}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "tab active" : "tab"}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="account-display-name">Display name</label>
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
            <label htmlFor="account-email">Email</label>
            <input id="account-email" name="email" type="email" required autoComplete="email" />
          </div>

          <div>
            <label htmlFor="account-password">Password</label>
            <input
              id="account-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <button className="submit-button" type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          {message && <p className="submission-note" role="status">{message}</p>}
        </form>
      )}
    </div>
  );
}

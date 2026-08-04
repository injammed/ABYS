"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, socialBackendEnabled } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

type PersonalArtifact = {
  id: string;
  title: string;
  status: "quarantine" | "approved" | "rejected" | "removed";
  lane: "aetimm" | "slatra" | "unjudged" | null;
  created_at: string;
};

function statusLabel(artifact: PersonalArtifact): string {
  if (artifact.status === "approved") {
    if (artifact.lane === "aetimm") return "Approved · AETIMM";
    if (artifact.lane === "slatra") return "Approved · SLOP TROUGH";
    return "Approved · Unjudged";
  }
  if (artifact.status === "quarantine") return "In private quarantine";
  if (artifact.status === "rejected") return "Rejected";
  return "Removed";
}

export function AccountGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState("");
  const [uploads, setUploads] = useState<PersonalArtifact[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAccountData = useCallback(async (activeSession: Session | null) => {
    const client = getSupabaseBrowserClient();
    if (!client || !activeSession) {
      setProfileName("");
      setUploads([]);
      return;
    }

    const [{ data: profile }, { data: artifacts, error: artifactsError }] = await Promise.all([
      client.from("profiles").select("display_name").eq("id", activeSession.user.id).maybeSingle(),
      client
        .from("artifacts")
        .select("id,title,status,lane,created_at")
        .eq("creator_id", activeSession.user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setProfileName(
      profile?.display_name ||
        activeSession.user.user_metadata.display_name ||
        activeSession.user.email?.split("@")[0] ||
        "Creator"
    );

    if (!artifactsError) setUploads((artifacts ?? []) as PersonalArtifact[]);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadAccountData(data.session);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadAccountData(nextSession);
      if (nextSession) setOpen(false);
    });

    const refreshUploads = () => void loadAccountData(session);
    window.addEventListener("aetimm:submission-created", refreshUploads);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("aetimm:submission-created", refreshUploads);
    };
  }, [loadAccountData, session]);

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
      <button className="upload-trigger" type="button" disabled title="Social backend not configured">
        Accounts soon
      </button>
    );
  }

  if (session) {
    return (
      <div className="upload-wrap">
        <button className="upload-trigger" type="button" onClick={() => setOpen((value) => !value)}>
          {profileName || session.user.email || "Account"}
        </button>
        {open && (
          <div className="upload-panel" role="dialog" aria-label="Profile and uploads">
            <form onSubmit={saveProfile}>
              <div>
                <label htmlFor="profile-display-name">Display name</label>
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
              <button className="submit-button" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </button>
            </form>

            <div>
              <p className="eyebrow">MY UPLOADS</p>
              {uploads.length === 0 ? (
                <p className="submission-note">No slop submitted yet.</p>
              ) : (
                uploads.map((artifact) => (
                  <p className="submission-note" key={artifact.id}>
                    <strong>{artifact.title}</strong><br />
                    {statusLabel(artifact)} · {new Date(artifact.created_at).toLocaleDateString()}
                  </p>
                ))
              )}
            </div>

            <p className="submission-note">Signed in as {session.user.email}</p>
            {message && <p className="submission-note" role="status">{message}</p>}
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

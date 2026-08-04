"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import styles from "./AuthPanel.module.css";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState("Checking session…");
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setStatus("Authentication is waiting for production Supabase environment variables.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data, error }) => {
      setUser(data.user ?? null);
      setStatus(error ? error.message : data.user ? "Signed in." : "Sign in with an email magic link.");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? "Signed in." : "Signed out.");
    });

    return () => data.subscription.unsubscribe();
  }, [configured]);

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !configured) return;
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const redirectTo = typeof window === "undefined" ? undefined : `${window.location.origin}/account/`;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
    setStatus(error ? error.message : "Magic link sent. Check your inbox.");
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    setStatus(error ? error.message : "Signed out.");
    setBusy(false);
  }

  return (
    <section className={styles.panel} aria-labelledby="account-title">
      <p className={styles.eyebrow}>REAL USER FOUNDATION</p>
      <h1 id="account-title">Account</h1>
      {user ? (
        <div className={styles.stack}>
          <p>Signed in as <strong>{user.email}</strong></p>
          <button type="button" onClick={signOut} disabled={busy}>Sign out</button>
        </div>
      ) : (
        <form className={styles.stack} onSubmit={requestMagicLink}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" disabled={!configured || busy} />
          <button type="submit" disabled={!configured || busy}>{busy ? "Sending…" : "Send magic link"}</button>
        </form>
      )}
      <p className={styles.status} role="status">{status}</p>
    </section>
  );
}

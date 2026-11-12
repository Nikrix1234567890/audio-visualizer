"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/site/AuthShell";

/** "Forgot your password?" - asks for the address and mails a reset link. */
export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);
    const response = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsSending(false);
    if (response.ok) setIsSent(true);
    else
      setError(
        (await response.json().catch(() => null))?.error ||
          "The link could not be sent. Try again in a moment.",
      );
  };

  return (
    <AuthShell title="Reset your password">
      {isSent ? (
        <p className="auth-text" role="status">
          If there is an account with that address, a mail with a link to
          choose a new password is on its way. The link works for one hour.
        </p>
      ) : (
        <form onSubmit={send} className="auth-form">
          <p className="auth-text">
            Enter your address and we will mail you a link to choose a new one.
          </p>
          <label className="pf-field">
            <span className="pf-label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pf-input pf-input--lg"
            />
            {error && (
              <span role="alert" className="pf-hint pf-hint--error">
                {error}
              </span>
            )}
          </label>
          <button
            type="submit"
            disabled={isSending}
            aria-busy={isSending || undefined}
            className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
          >
            Send the link
          </button>
        </form>
      )}
      <p className="auth-foot">
        <Link href="/login" className="pf-link">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}

/** Where the reset link leads: choose a new password. */
export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const response = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setIsSaving(false);
    if (response.ok) setIsDone(true);
    else
      setError(
        (await response.json().catch(() => null))?.error ||
          "The password could not be saved. Ask for a new link.",
      );
  };

  return (
    <AuthShell title="Choose a new password">
      {isDone ? (
        <>
          <p className="auth-text" role="status">
            Your password is changed.
          </p>
          <Link href="/login" className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block">
            Log in
          </Link>
        </>
      ) : (
        <form onSubmit={save} className="auth-form">
          <label className="pf-field">
            <span className="pf-label">New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pf-input pf-input--lg"
            />
            <span className="pf-hint">At least 8 characters.</span>
            {error && (
              <span role="alert" className="pf-hint pf-hint--error">
                {error}
              </span>
            )}
          </label>
          {!token && (
            <p className="pf-hint pf-hint--error">
              This page needs the link from the mail. Ask for a new one.
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving || !token}
            aria-busy={isSaving || undefined}
            className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
          >
            Save the password
          </button>
        </form>
      )}
      {!isDone && (
        <p className="auth-foot">
          <Link href="/forgot" className="pf-link">
            Ask for a new link
          </Link>
        </p>
      )}
    </AuthShell>
  );
}

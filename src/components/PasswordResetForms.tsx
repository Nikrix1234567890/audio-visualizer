"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const field =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";
const submit =
  "mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-canvas hover:brightness-110 disabled:opacity-50";
const shell = "flex flex-1 flex-col items-center justify-center bg-canvas px-6 py-16 text-ink";

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
    else setError((await response.json().catch(() => null))?.error || "That did not work.");
  };

  return (
    <div className={shell}>
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-xl font-semibold">Forgot your password?</h1>
        {isSent ? (
          <p className="text-sm leading-relaxed text-muted">
            If there is an account with that address, a mail with a link to
            choose a new password is on its way. The link works for one hour.
          </p>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Enter your address and we will mail you a link to choose a new one.
            </p>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={isSending} className={submit}>
              {isSending ? "Sending…" : "Send the link"}
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-accent underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
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
    else setError((await response.json().catch(() => null))?.error || "That did not work.");
  };

  return (
    <div className={shell}>
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-xl font-semibold">Choose a new password</h1>
        {isDone ? (
          <p className="text-sm leading-relaxed text-muted">
            Your password is changed.{" "}
            <Link href="/login" className="text-accent underline">
              Log in
            </Link>{" "}
            with the new one.
          </p>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              New password (at least 8 characters)
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={isSaving || !token} className={submit}>
              {isSaving ? "Saving…" : "Save the password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

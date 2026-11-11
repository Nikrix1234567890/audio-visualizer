"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

const field =
  "rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink shadow-scope-recessed outline-none focus:border-accent";
const quietButton =
  "w-fit rounded-xl border border-line bg-surface-raised px-5 py-2.5 text-sm font-semibold tracking-wide text-ink shadow-control-raised outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:opacity-50";

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return (data?.error as string | undefined) || fallback;
}

/** Change the password: the current one, then the new one. */
export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);
    const response = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    setIsSaving(false);
    if (!response.ok) {
      setMessage({ text: await readError(response, "Saving failed."), isError: true });
      return;
    }
    setCurrent("");
    setNext("");
    setMessage({ text: "Password changed.", isError: false });
  };

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Current password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        New password (at least 8 characters)
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={field}
        />
      </label>
      <button type="submit" disabled={isSaving} className={quietButton}>
        {isSaving ? "Saving…" : "Change password"}
      </button>
      {message && (
        <p className={`text-xs ${message.isError ? "text-red-400" : "text-accent"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

/** Opens the Stripe customer portal (payment method, invoices, cancelling). */
export function ManageSubscriptionButton() {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setError(null);
    setIsOpening(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = await response.json().catch(() => null);
    if (response.ok && typeof data?.url === "string") {
      window.location.assign(data.url);
      return;
    }
    setError(data?.error || "The subscription page could not be opened.");
    setIsOpening(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={open} disabled={isOpening} className={quietButton}>
        {isOpening ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Delete the account for good - asks for the password and a confirmation. */
export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !window.confirm(
        "Delete your account with all projects, templates, uploads and videos? This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    setIsDeleting(true);
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError(await readError(response, "Deleting failed."));
      setIsDeleting(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  };

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Your password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      <button
        type="submit"
        disabled={isDeleting}
        className="w-fit rounded-xl border border-red-400/50 px-5 py-2.5 text-sm font-semibold tracking-wide text-red-400 outline-none hover:border-red-400 focus-visible:border-red-400 disabled:opacity-50"
      >
        {isDeleting ? "Deleting…" : "Delete account"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

/** Asks for the confirmation mail to be sent again. */
export function ResendConfirmationButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setState("sending");
    const response = await fetch("/api/account/verify", { method: "POST" });
    if (response.ok) {
      setState("sent");
      return;
    }
    setError(await readError(response, "The mail could not be sent."));
    setState("idle");
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={send}
        disabled={state !== "idle"}
        className={quietButton}
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "Mail sent" : "Send the mail again"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

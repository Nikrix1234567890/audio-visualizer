"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/site/AuthShell";

/** Signing up: creates the account and logs straight in. */
export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "The account could not be created. Try again.");
      setIsSubmitting(false);
      return;
    }

    // Automatically sign in after successful registration.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="pf-field">
          <span className="pf-label">Name (optional)</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pf-input pf-input--lg"
          />
        </label>
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
        </label>
        <label className="pf-field">
          <span className="pf-label">Password</span>
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
        </label>
        {error && (
          <p role="alert" className="pf-hint pf-hint--error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
        >
          Create account
        </button>
      </form>
      <p className="auth-foot">
        <span>
          Already have an account?{" "}
          <Link href="/login" className="pf-link">
            Log in
          </Link>
        </span>
        <span className="pf-hint">
          The editor works without one. An account keeps your projects and videos.
        </span>
      </p>
    </AuthShell>
  );
}

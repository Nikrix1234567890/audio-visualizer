"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/site/AuthShell";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("That email and password do not match.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell title="Log in">
      <form onSubmit={handleSubmit} className="auth-form">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
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
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
        >
          Log in
        </button>
      </form>
      <p className="auth-foot">
        <Link href="/forgot" className="pf-link">
          Forgot your password?
        </Link>
        <span>
          No account yet?{" "}
          <Link href="/register" className="pf-link">
            Create one
          </Link>
        </span>
      </p>
    </AuthShell>
  );
}

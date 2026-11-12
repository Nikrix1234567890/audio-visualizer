"use client";

import { Crown } from "lucide-react";
import { useState } from "react";

/** Starts the Premium payment and sends the browser to the Stripe payment page. */
export function UpgradeButton() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setIsStarting(true);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.url !== "string") {
        throw new Error(data?.error || "The payment could not be started.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The payment could not be started.");
      setIsStarting(false);
    }
  };

  return (
    <div className="pf-stack">
      <button
        type="button"
        onClick={start}
        disabled={isStarting}
        aria-busy={isStarting || undefined}
        className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
      >
        <Crown className="pf-i" aria-hidden />
        Get Premium
      </button>
      {isStarting && (
        <span role="status" className="pf-hint">
          Opening the payment page…
        </span>
      )}
      {error && (
        <span role="alert" className="pf-hint pf-hint--error">
          {error}
        </span>
      )}
    </div>
  );
}

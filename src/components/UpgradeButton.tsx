"use client";

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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        disabled={isStarting}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
      >
        {isStarting ? "Opening the payment page…" : "Go Premium"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

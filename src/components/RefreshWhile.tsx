"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Reloads the data of the page every few seconds while `active` is true -
 * so a list of running jobs keeps up without the visitor reloading.
 */
export function RefreshWhile({ active, seconds = 3 }: { active: boolean; seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [active, seconds, router]);

  return null;
}

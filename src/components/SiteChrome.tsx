"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Every animation in the app honours the visitor's reduced-motion setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Shows its content on every page except the editor. */
export function OutsideEditor({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/editor")) return null;
  return <>{children}</>;
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";
import { Rise } from "./kit";

/**
 * The frame of logging in, signing up and resetting a password: the logo,
 * and under it one card that names the task. Nothing else on the page.
 */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="site auth-page">
      <Rise>
        <Link href="/" aria-label="Start page" className="auth-logo">
          <Wordmark className="pf-logo--lg" />
        </Link>
      </Rise>
      <Rise delay={0.08} className="pf-auth">
        <h1 className="pf-auth__title">{title}</h1>
        {children}
      </Rise>
    </div>
  );
}

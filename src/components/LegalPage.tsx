import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * The frame of a legal page. Every legal text in this app is a DRAFT that
 * a person - ideally a lawyer - has to complete and check before the site
 * goes public; the notice at the top says so and must only be removed once
 * that has happened (`isDraft={false}`).
 */
export function LegalPage({
  title,
  isDraft = true,
  children,
}: {
  title: string;
  isDraft?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {isDraft && (
          <p className="rounded-2xl border border-accent-dim bg-surface px-5 py-4 text-sm leading-relaxed text-ink">
            <strong>Draft.</strong> This page is a placeholder. The parts in
            [square brackets] are missing, and the text has not been checked
            by a lawyer. It must be completed before the site is opened to
            the public.
          </p>
        )}
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2">
          {children}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}

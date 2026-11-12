import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { Rise } from "@/components/site/kit";

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
    <div className="lp site">
      <article className="lp-wrap legal">
        <Rise>
          <p className="lp-eyebrow">Legal</p>
          <h1 className="lp-h2 legal__title">{title}</h1>
        </Rise>
        {isDraft && (
          <p className="pf-banner pf-banner--warning">
            <TriangleAlert className="pf-i" aria-hidden />
            <span>
              <b>Draft.</b> This page is a placeholder. The parts in [square
              brackets] are missing, and the text has not been checked by a
              lawyer. It must be completed before the site is opened to the
              public.
            </span>
          </p>
        )}
        <div className="legal__body">{children}</div>
      </article>
      <SiteFooter />
    </div>
  );
}

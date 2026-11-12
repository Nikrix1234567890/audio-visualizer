import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { COMPARE_ROWS } from "./content";
import { DropCta } from "./DropCta";
import { Rise, WordReveal } from "./kit";

/** Eyebrow, headline and an optional lead: the top of every section. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={`lp-head ${className}`}>
      <p className="lp-eyebrow">{eyebrow}</p>
      <h2 className="lp-h2">{title}</h2>
      {lead && <p className="lp-lead">{lead}</p>}
    </Reveal>
  );
}

/** The top of a page that is not the landing page: eyebrow, headline, lead, and what follows. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="lp-wrap page-hero">
      <Rise>
        <p className="lp-eyebrow">{eyebrow}</p>
      </Rise>
      <WordReveal text={title} className="lp-h2 page-hero__title" />
      {lead && (
        <Rise delay={0.25}>
          <p className="lp-lead">{lead}</p>
        </Rise>
      )}
      {children && (
        <Rise delay={0.35} className="lp-row">
          {children}
        </Rise>
      )}
    </header>
  );
}

/** The two plans row by row. */
export function CompareTable() {
  return (
    <Reveal className="lp-tablebox">
      <table className="pf-table">
        <caption className="sr-only">What each plan includes</caption>
        <thead>
          <tr>
            <td />
            <th scope="col">Free</th>
            <th scope="col">Premium</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.free}</td>
              <td>{row.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Reveal>
  );
}

/** The last section of a marketing page: one headline and the drop zone. */
export function ClosingCall({ title = "Your track is the only thing missing." }: { title?: string }) {
  return (
    <section className="lp-rule">
      <div className="lp-wrap lp-section lp-close">
        <Reveal>
          <h2 className="lp-h2">{title}</h2>
        </Reveal>
        <Reveal delay={120} className="lp-close__drop">
          <DropCta />
        </Reveal>
      </div>
    </section>
  );
}

/** The three things a visitor should know before pressing the button. */
export function Reassure() {
  return (
    <>
      {["No account needed", "Free 720p exports", "What you see is the video"].map((text) => (
        <span key={text}>
          <Check className="pf-i text-accent" aria-hidden />
          {text}
        </span>
      ))}
    </>
  );
}

/** A text link with an arrow that leans forward on hover. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="arrow-link">
      {children}
      <ArrowRight className="pf-i" aria-hidden />
    </Link>
  );
}

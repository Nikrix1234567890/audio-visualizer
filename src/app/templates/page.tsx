import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { ELEMENT_COUNT, TEMPLATE_COUNT } from "@/components/site/content";
import { CountUp } from "@/components/site/kit";
import { NoScript } from "@/components/site/NoScript";
import { ClosingCall, PageHero } from "@/components/site/sections";
import { TemplateBrowser } from "@/components/site/TemplateBrowser";
import { TemplateMarquee } from "@/components/site/TemplateMarquee";
import { TEMPLATE_SUMMARIES, USED_CATEGORIES } from "@/components/site/templateData";

export const metadata: Metadata = {
  title: "Templates",
  description: `${TEMPLATE_COUNT} audio-reactive 3D scenes to start a video from. Each one is a real scene you can take apart in the editor.`,
};

/** Every built-in template, to filter, search and open. */
export default function TemplatesPage() {
  const half = Math.ceil(TEMPLATE_SUMMARIES.length / 2);
  return (
    <div className="lp site">
      <NoScript />
      <PageHero
        eyebrow="Templates"
        title={`${TEMPLATE_COUNT} scenes to start from.`}
        lead="Every template is a real scene made of a few elements. Hover to see it move, open it to see what it is made of, then change anything."
      >
        <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
          Start with an empty stage
        </Link>
        <span className="page-hero__fact">
          <b>
            <CountUp value={ELEMENT_COUNT} />
          </b>{" "}
          elements to build your own
        </span>
      </PageHero>

      <section className="lp-wrap lp-section--tight">
        <TemplateBrowser templates={TEMPLATE_SUMMARIES} categories={USED_CATEGORIES} hasSearch />
      </section>

      <section className="lp-rule lp-section tpl-section">
        <div className="lp-wrap">
          <Reveal className="lp-head">
            <p className="lp-eyebrow">All of them, moving</p>
            <h2 className="lp-h2">Every loop is a real export.</h2>
            <p className="lp-lead">
              These previews were drawn by the same code that draws your video.
            </p>
          </Reveal>
        </div>
        <Reveal className="tpl-section__rows">
          <TemplateMarquee templates={TEMPLATE_SUMMARIES.slice(0, half)} seconds={80} />
          <TemplateMarquee templates={TEMPLATE_SUMMARIES.slice(half)} seconds={80} reverse />
        </Reveal>
      </section>

      <ClosingCall title="Found one? Add your track." />
      <SiteFooter />
    </div>
  );
}

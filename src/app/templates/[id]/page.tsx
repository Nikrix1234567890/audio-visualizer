import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { Rise, Stagger, StaggerItem, WordReveal } from "@/components/site/kit";
import { NoScript } from "@/components/site/NoScript";
import { TemplateCard } from "@/components/site/TemplateCard";
import {
  describeTemplate,
  findTemplate,
  relatedTemplates,
  templateElements,
  templateSignals,
  usesTempoSwing,
} from "@/components/site/templateData";
import { categoryLabel, templateCategories } from "@/lib/templateCategories";
import { TEMPLATES } from "../../../../remotion/scene/templates";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = findTemplate((await params).id);
  if (!template) return { title: "Template not found" };
  return {
    title: `${template.label} template`,
    description: describeTemplate(template),
  };
}

/** Whether a file of the public folder exists (not every element has a picture). */
const hasPublicFile = (file: string) => existsSync(path.join(process.cwd(), "public", file));

const FORMATS = [
  { ratio: "16:9", use: "YouTube" },
  { ratio: "9:16", use: "Reels, Shorts, TikTok" },
  { ratio: "1:1", use: "Feeds" },
];

/** One template: its loop, what it is made of, and the way into the editor. */
export default async function TemplatePage({ params }: Props) {
  const template = findTemplate((await params).id);
  if (!template) notFound();

  const elements = templateElements(template);
  const signals = templateSignals(template);
  const categories = templateCategories(template.id);
  const related = relatedTemplates(template.id);
  const portrait = `previews/portrait/${template.id}.mp4`;
  const hasPortrait = hasPublicFile(portrait);

  return (
    <div className="lp site">
      <NoScript />
      <div className="lp-wrap td">
        <Rise>
          <Link href="/templates" className="arrow-link arrow-link--back">
            <ArrowLeft className="pf-i" aria-hidden />
            All templates
          </Link>
        </Rise>

        <div className="td__top">
          <Rise delay={0.05} className="td__media">
            <div className="pf-window">
              <div className="media-box td__video">
                <video
                  src={`/previews/${template.id}.mp4`}
                  poster={`/thumbnails/templates/${template.id}.jpg`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={`The ${template.label} template playing`}
                />
              </div>
            </div>
          </Rise>

          <div className="td__info">
            <Rise delay={0.1} className="lp-row">
              {categories.map((category) => (
                <span key={category} className="pf-badge pf-badge--outline">
                  {categoryLabel(category)}
                </span>
              ))}
            </Rise>
            <WordReveal text={template.label} className="lp-h2" />
            <Rise delay={0.2}>
              <p className="lp-lead">{describeTemplate(template)}</p>
            </Rise>
            <Rise delay={0.3} className="lp-row">
              <Link href={`/editor?template=${template.id}`} className="pf-btn pf-btn--cta pf-btn--xl">
                Open in the editor
                <ArrowRight className="pf-i" aria-hidden />
              </Link>
            </Rise>
            <Rise delay={0.35}>
              <p className="pf-note">No account needed. Add your track there, or try the demo track.</p>
            </Rise>
            {(signals.length > 0 || usesTempoSwing(template)) && (
              <Rise delay={0.4} className="lp-row td__signals">
                {signals.map((signal) => (
                  <span key={signal.sig} className="pf-badge pf-badge--outline" data-sig={signal.sig}>
                    <span className="pf-dot" />
                    Reacts to {signal.label.toLowerCase()}
                  </span>
                ))}
                {usesTempoSwing(template) && (
                  <span className="pf-badge pf-badge--outline">Tempo swing</span>
                )}
              </Rise>
            )}
          </div>
        </div>

        <section className="td__section">
          <Reveal className="lp-head">
            <p className="lp-eyebrow">What it is made of</p>
            <h2 className="td__h2">
              {template.scene.elements.length}{" "}
              {template.scene.elements.length === 1 ? "element" : "elements"}, all yours to change.
            </h2>
          </Reveal>
          <Stagger as="ul" className="td__elements" gap={0.08}>
            {elements.map((element) => {
              const picture = `thumbnails/elements/${element.type}.jpg`;
              return (
                <StaggerItem as="li" key={element.type} className="td__element">
                  {hasPublicFile(picture) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="thumb thumb--sq"
                      src={`/${picture}`}
                      alt=""
                      width={320}
                      height={240}
                      loading="lazy"
                    />
                  ) : (
                    <span className="thumb thumb--sq block" />
                  )}
                  <span className="pf-stack td__element-text">
                    <b>
                      {element.label}
                      {element.count > 1 && <span className="pf-chip__count"> x {element.count}</span>}
                    </b>
                    <span>{element.description}</span>
                  </span>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <section className="td__section">
          <Reveal className="lp-head">
            <p className="lp-eyebrow">Formats</p>
            <h2 className="td__h2">Export it in three formats.</h2>
            <p className="lp-lead">
              Switch format in the editor and the camera adapts, so the scene
              stays in the picture.
            </p>
          </Reveal>
          <Stagger className="td__formats" gap={0.1}>
            {FORMATS.map((format) => (
              <StaggerItem key={format.ratio} className="td__format">
                <span className="td__shape" data-format={format.ratio} aria-hidden>
                  {format.ratio === "9:16" && hasPortrait ? (
                    <video src={`/${portrait}`} autoPlay muted loop playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/thumbnails/templates/${template.id}.jpg`} alt="" loading="lazy" />
                  )}
                </span>
                <span className="lp-format__cap">
                  <b>{format.ratio}</b>
                  {format.use}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {related.length > 0 && (
          <section className="td__section">
            <Reveal className="lp-head">
              <p className="lp-eyebrow">More like this</p>
              <h2 className="td__h2">
                {categories[0] === "other"
                  ? "More templates."
                  : `More ${categoryLabel(categories[0]).toLowerCase()}.`}
              </h2>
            </Reveal>
            <Stagger as="ul" className="lp-grid" gap={0.07}>
              {related.map((other) => (
                <StaggerItem as="li" key={other.id} className="s3">
                  <TemplateCard template={other} href={`/templates/${other.id}`} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

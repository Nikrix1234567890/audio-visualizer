import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroWindow } from "@/components/landing/HeroWindow";
import { PlanCards } from "@/components/PlanCards";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ELEMENT_COUNT,
  PLAN_QUESTIONS,
  TEMPLATE_COUNT,
} from "@/components/site/content";
import {
  CameraDemo,
  FormatMorph,
  KeyframeDemo,
  LayersDemo,
  ParityDemo,
  ReactDemo,
  StepBuild,
  StepExport,
  StepLoad,
  TempoDemo,
} from "@/components/site/demos";
import { Faq } from "@/components/site/Faq";
import { CountUp, Marquee, Rise, Stagger, StaggerItem, WordReveal } from "@/components/site/kit";
import { NoScript } from "@/components/site/NoScript";
import {
  ArrowLink,
  ClosingCall,
  CompareTable,
  Reassure,
  SectionHead,
} from "@/components/site/sections";
import { TemplateBrowser } from "@/components/site/TemplateBrowser";
import { TemplateMarquee } from "@/components/site/TemplateMarquee";
import { TEMPLATE_SUMMARIES, USED_CATEGORIES } from "@/components/site/templateData";
import { ELEMENT_DEFS, ELEMENT_TYPES } from "../../remotion/scene/definitions";

/** The templates the gallery teaser shows first, in this order. */
const FEATURED = [
  "galaxy",
  "nightCity",
  "liquidGold",
  "radialBars",
  "terrainWave",
  "helix",
  "solar",
  "aurora",
];
/** How many cards the teaser shows. */
const TEASER = 8;

/** The templates in the hero's small editor; the first one plays at the start. */
const HERO_CHOICES = ["galaxy", "helix", "nova", "hyperdrive", "aurora", "liquidGold"];

/** Elements whose pictures run through the "elements" card of the bento. */
const ELEMENT_STRIP = [
  "barRing",
  "galaxy",
  "tunnel",
  "jellyfish",
  "skyline",
  "helix",
  "aurora",
  "spikeOrb",
  "terrainLines",
  "corona",
  "vortex",
  "hypercube",
].filter((type) => (ELEMENT_TYPES as readonly string[]).includes(type)) as (keyof typeof ELEMENT_DEFS)[];

const STRIP_HALF = Math.ceil(ELEMENT_STRIP.length / 2);

const STEPS = [
  {
    title: "Load a track",
    text: "Drop in any song. Bass, mids, highs and every beat are found once, right in your browser.",
    demo: <StepLoad />,
  },
  {
    title: "Build the scene",
    text: "Start from a template or an empty stage. Add elements and plug any setting into the music.",
    demo: <StepBuild />,
  },
  {
    title: "Export the video",
    text: "Pick a format and press Export. The video is drawn by the same code as the preview.",
    demo: <StepExport />,
  },
];

const byId = (id: string) => TEMPLATE_SUMMARIES.find((template) => template.id === id);

/** The landing page: what the app is, what it makes, what it costs. */
export default function LandingPage() {
  const featured = FEATURED.map(byId).filter((template) => template !== undefined);
  const others = TEMPLATE_SUMMARIES.filter((template) => !featured.includes(template));
  const gallery = [...featured, ...others];
  const heroChoices = HERO_CHOICES.map(byId)
    .filter((template) => template !== undefined)
    .map(({ id, label }) => ({ id, label }));

  return (
    <div className="lp site">
      <NoScript />

      <header className="lp-wrap lp-hero">
        <Rise>
          <span className="pf-badge pf-badge--lg">
            <span className="pf-badge__dot text-accent" />
            No install. Free to try.
          </span>
        </Rise>
        <WordReveal text="Make your music impossible to scroll past." className="lp-h1" />
        <Rise delay={0.4}>
          <p className="lp-lead">
            Drop in a track, pick a 3D scene and export a video that moves on
            every beat. In your browser, in minutes.
          </p>
        </Rise>
        <Rise delay={0.5} className="lp-row">
          <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--xl">
            Start with your track
            <ArrowRight className="pf-i" aria-hidden />
          </Link>
          <Link href="/templates" className="pf-btn pf-btn--secondary pf-btn--xl">
            Browse templates
          </Link>
        </Rise>
        <Rise delay={0.6} className="lp-reassure">
          <Reassure />
        </Rise>
        <Rise delay={0.45} className="hero-rise">
          <HeroWindow templates={heroChoices} />
        </Rise>
        <p className="lp-goes">
          Made for <b>YouTube</b>, <b>Reels</b>, <b>TikTok</b>, <b>Shorts</b> and{" "}
          <b>Spotify Canvas</b>.
        </p>
      </header>

      <section id="templates" className="lp-section tpl-section">
        <div className="lp-wrap">
          <SectionHead
            eyebrow="Templates"
            title={`${TEMPLATE_COUNT} scenes to start from.`}
            lead="Every template is a real scene you can take apart. Hover to see it move, click to open it with your track."
          />
          <TemplateBrowser
            templates={gallery}
            categories={USED_CATEGORIES}
            limit={TEASER}
            opens="editor"
          />
        </div>
        {others.length > 0 && (
          <Reveal className="tpl-section__more">
            <TemplateMarquee templates={others.slice(0, 12)} />
          </Reveal>
        )}
        <div className="lp-more">
          <Link href="/templates" className="pf-btn pf-btn--secondary pf-btn--lg">
            See all {TEMPLATE_COUNT} templates
          </Link>
        </div>
      </section>

      <section className="lp-rule">
        <div className="lp-wrap lp-section">
          <SectionHead eyebrow="How it works" title="From a song to a video in three steps." />
          <Stagger as="ol" className="lp-grid steps" gap={0.1}>
            {STEPS.map((step, i) => (
              <StaggerItem as="li" key={step.title} className="pf-card s4">
                {step.demo}
                <span className="pf-step__num">Step {i + 1}</span>
                <h3 className="pf-card__title">{step.title}</h3>
                <p className="pf-card__text">{step.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="features" className="lp-rule">
        <div className="lp-wrap lp-section">
          <div className="head-split">
            <SectionHead
              eyebrow="What you can do"
              title="An editor, not a preset picker."
              lead={`${ELEMENT_COUNT} elements you add, stack and tune. Every one of them can listen to your track.`}
            />
            <Reveal delay={120}>
              <dl className="stats">
                <div>
                  <dd>
                    <CountUp value={TEMPLATE_COUNT} />
                  </dd>
                  <dt>templates</dt>
                </div>
                <div>
                  <dd>
                    <CountUp value={ELEMENT_COUNT} />
                  </dd>
                  <dt>elements</dt>
                </div>
                <div>
                  <dd>
                    <CountUp value={5} />
                  </dd>
                  <dt>signals</dt>
                </div>
                <div>
                  <dd>
                    <CountUp value={3} />
                  </dd>
                  <dt>formats</dt>
                </div>
              </dl>
            </Reveal>
          </div>

          <Stagger className="lp-grid" gap={0.08}>
            <StaggerItem className="pf-card s7">
              <ReactDemo />
              <h3 className="pf-card__title">Anything can react</h3>
              <p className="pf-card__text">
                Plug a setting into bass, mids, highs, loudness or the beat
                with one click. Each signal keeps its colour, so you always
                see what drives what.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s5">
              <KeyframeDemo />
              <h3 className="pf-card__title">Animate over time</h3>
              <p className="pf-card__text">
                Set a value now and another later. It travels between them, on
                a timeline right under the waveform.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s5">
              <div className="pf-card__demo strip-demo">
                <Marquee seconds={36}>
                  {ELEMENT_STRIP.slice(0, STRIP_HALF).map((type) => (
                    <span key={type} className="strip-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/thumbnails/elements/${type}.jpg`}
                        alt=""
                        width={160}
                        height={120}
                        loading="lazy"
                      />
                      <span>{ELEMENT_DEFS[type].label}</span>
                    </span>
                  ))}
                </Marquee>
                <Marquee seconds={36} reverse>
                  {ELEMENT_STRIP.slice(STRIP_HALF).map((type) => (
                    <span key={type} className="strip-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/thumbnails/elements/${type}.jpg`}
                        alt=""
                        width={160}
                        height={120}
                        loading="lazy"
                      />
                      <span>{ELEMENT_DEFS[type].label}</span>
                    </span>
                  ))}
                </Marquee>
              </div>
              <h3 className="pf-card__title">Every scene is yours</h3>
              <p className="pf-card__text">
                Rings, particle clouds, tunnels, terrain, text. Add, remove,
                duplicate and arrange them freely. A template is only a
                starting point.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s7">
              <CameraDemo />
              <h3 className="pf-card__title">Move the camera</h3>
              <p className="pf-card__text">
                Push in, pull out, crane or punch the zoom with one button.
                Each move is written as ordinary keyframes you can drag.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s4">
              <LayersDemo />
              <h3 className="pf-card__title">Bring your own</h3>
              <p className="pf-card__text">
                Your logo, your cover art, your 3D model. Placed in the scene
                like any other element.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s4">
              <TempoDemo />
              <h3 className="pf-card__title">Slow down, speed up</h3>
              <p className="pf-card__text">
                Give an element a tempo swing: it surges on every beat and
                falls into slow motion in between.
              </p>
            </StaggerItem>
            <StaggerItem className="pf-card s4">
              <ParityDemo />
              <h3 className="pf-card__title">What you see is the video</h3>
              <p className="pf-card__text">
                No separate export engine. Preview and final render run the
                same code, frame for frame.
              </p>
            </StaggerItem>
          </Stagger>
          <Reveal className="lp-more">
            <ArrowLink href="/features">Take the full tour</ArrowLink>
          </Reveal>
        </div>
      </section>

      <section className="lp-rule">
        <div className="lp-wrap lp-section">
          <div className="lp-grid formats-top">
            <SectionHead
              className="s6"
              eyebrow="Made for where it goes"
              title="One scene, three formats."
              lead="Switch format and the camera adapts, so your scene stays in the picture."
            />
            <Reveal className="s6" delay={120}>
              <FormatMorph />
            </Reveal>
          </div>
          <Stagger className="lp-formats" gap={0.12}>
            <StaggerItem className="lp-format lp-format--wide">
              <div className="media-box format-box format-box--wide">
                <video
                  src="/previews/galaxy.mp4"
                  poster="/thumbnails/templates/galaxy.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Galaxy in landscape"
                />
              </div>
              <span className="lp-format__cap">
                <b>16:9</b>YouTube
              </span>
            </StaggerItem>
            <StaggerItem className="lp-format lp-format--phone">
              <div className="pf-phone">
                <div className="media-box format-box format-box--phone">
                  <video
                    src="/previews/portrait/galaxy.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="Galaxy in portrait"
                  />
                </div>
              </div>
              <span className="lp-format__cap">
                <b>9:16</b>Reels, Shorts, TikTok
              </span>
            </StaggerItem>
            <StaggerItem className="lp-format lp-format--square">
              <div className="media-box format-box format-box--square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="media"
                  src="/thumbnails/templates/galaxy.jpg"
                  alt="Galaxy as a square"
                  width={480}
                  height={270}
                  loading="lazy"
                />
              </div>
              <span className="lp-format__cap">
                <b>1:1</b>Feeds
              </span>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      <section id="pricing" className="lp-rule">
        <div className="lp-wrap lp-section">
          <SectionHead
            eyebrow="Pricing"
            title="Free to make videos. Premium when you want them bigger and unmarked."
          />
          <PlanCards priceLabel={process.env.PREMIUM_PRICE_LABEL || undefined} />
          <CompareTable />
        </div>
      </section>

      <section className="lp-rule">
        <div className="lp-wrap lp-section">
          <div className="lp-grid">
            <SectionHead className="s5 faq-head" eyebrow="Questions" title="Before you start." />
            <Reveal className="s7" delay={100}>
              <Faq items={PLAN_QUESTIONS} />
              <p className="faq-more">
                <ArrowLink href="/help#questions">More questions and answers</ArrowLink>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <ClosingCall />
      <SiteFooter />
    </div>
  );
}

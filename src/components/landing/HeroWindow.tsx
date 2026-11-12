"use client";

import type { PlayerRef } from "@remotion/player";
import { Check, Download, Music, Play } from "lucide-react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Meter,
  PlayedWave,
  ScrubRow,
  lastReached,
  useSignalClock,
  valueBetween,
  type DemoKeyframe,
} from "@/components/site/kit";
import { Mark } from "@/components/Wordmark";
import { HERO_FPS, HERO_SECONDS } from "./HeroPlayer";
import { HeroScene } from "./HeroScene";

/** Where the keyframes of the animated setting sit on the loop, and its value there. */
const TURN_KEYS: DemoKeyframe[] = [
  { at: 0.1, value: 0 },
  { at: 0.46, value: 140 },
  { at: 0.82, value: 220 },
];

const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
const timecode = (seconds: number) =>
  `0:${two(seconds)}.${two((seconds % 1) * 100)}`;

/**
 * The hero's app window: a reduced editor around the real, playing scene.
 * It lies tilted back and settles flat as the page scrolls. The level
 * meter, the reacting settings and the playhead move with a stand-in for
 * the track; the playhead follows the live scene's own frame once that
 * runs. The templates on the left switch the scene.
 */
export function HeroWindow({ templates }: { templates: { id: string; label: string }[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const turnRef = useRef<HTMLSpanElement>(null);
  const turnKeyRef = useRef<HTMLSpanElement>(null);
  const diamonds = useRef<(HTMLSpanElement | null)[]>([]);
  const lastFrame = useRef(-1);

  const [templateId, setTemplateId] = useState(templates[0].id);
  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  const isReduced = useReducedMotion();
  const wasSeen = useInView(stageRef, { once: true });
  const isInView = useInView(stageRef, { margin: "80px 0px" });
  const clock = useSignalClock(stageRef);
  const progress = useMotionValue(0.34);
  const head = useTransform(progress, (p) => `${p * 100}%`);

  // Tilted back at the top of the page, flat once it is well in view.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start 0.95", "start 0.2"],
  });
  const settle = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const rotateX = useTransform(settle, [0, 1], [18, 0]);
  const scale = useTransform(settle, [0, 1], [0.9, 1]);

  // The live scene only draws while it can be seen.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isInView) player.play();
    else player.pause();
  }, [isInView]);

  useAnimationFrame((_, delta) => {
    if (!isInView || isReduced) return;
    // Follow the live scene's frame; until it runs, keep an own clock.
    const frame = playerRef.current?.getCurrentFrame();
    let seconds: number;
    if (typeof frame === "number" && frame !== lastFrame.current) {
      lastFrame.current = frame;
      seconds = frame / HERO_FPS;
    } else {
      seconds = (progress.get() * HERO_SECONDS + Math.min(delta, 50) / 1000) % HERO_SECONDS;
    }
    const p = seconds / HERO_SECONDS;
    progress.set(p);

    if (timeRef.current) timeRef.current.textContent = timecode(seconds);
    if (turnRef.current) {
      turnRef.current.textContent = String(Math.round(valueBetween(TURN_KEYS, p)));
    }
    const reached = lastReached(TURN_KEYS, p);
    diamonds.current.forEach((diamond, i) => {
      if (!diamond) return;
      if (i === reached) diamond.setAttribute("data-sel", "true");
      else diamond.removeAttribute("data-sel");
    });
    // The diamond next to the setting fills while the playhead is on a keyframe.
    const isOnKey = reached >= 0 && p - TURN_KEYS[reached].at < 0.03;
    turnKeyRef.current?.setAttribute("data-state", isOnKey ? "at" : "on");
  });

  return (
    <div ref={stageRef} className="hero-stage">
      <motion.div className="pf-window hero-window" style={{ rotateX, scale }}>
        <div className="pf-window__bar" aria-hidden>
          <i />
          <i />
          <i />
          <span className="pf-window__url">beatframe.app/editor</span>
        </div>
        <div className="mini">
          <div className="mini__bar" aria-hidden>
            <span className="pf-logo">
              <Mark />
            </span>
            <span className="pf-sep" />
            <span className="mini__title">Night drive visual</span>
            <span className="pf-badge pf-badge--success lp-hide-sm">
              <Check className="pf-i" />
              Saved
            </span>
            <span className="pf-spacer" />
            <span className="pf-seg lp-hide-sm">
              <span className="pf-seg__item" aria-pressed="true">
                16:9
              </span>
              <span className="pf-seg__item">9:16</span>
              <span className="pf-seg__item">1:1</span>
            </span>
            <span className="pf-btn pf-btn--cta">
              <Download className="pf-i" />
              Export
            </span>
          </div>

          <div className="mini__side">
            <span className="mini__title" id="hero-templates">
              Templates
            </span>
            <div className="mini__cards" role="group" aria-labelledby="hero-templates">
              {templates.map((t) => (
                <motion.button
                  key={t.id}
                  type="button"
                  className="pf-tcard pf-tcard--compact mini__card"
                  aria-pressed={t.id === templateId}
                  aria-current={t.id === templateId ? "true" : undefined}
                  onClick={() => setTemplateId(t.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="thumb"
                    src={`/thumbnails/templates/${t.id}.jpg`}
                    alt=""
                    width={240}
                    height={135}
                  />
                  <span className="pf-tcard__body">
                    <span className="pf-tcard__name">{t.label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mini__stage">
            <div className="media-box mini__frame">
              <HeroScene
                templateId={templateId}
                label={template.label}
                isLive={wasSeen && !isReduced}
                playerRef={playerRef}
              />
            </div>
          </div>

          <div className="mini__side mini__side--right" aria-hidden>
            <span className="mini__title">{template.label}</span>
            <ScrubRow label="Scale" value="1.25" unit="x" fill={0.42} sig="bass" amount={0.3} clock={clock} />
            <ScrubRow
              label="Glow"
              value="68"
              unit="%"
              fill={0.68}
              sig="beat"
              amount={0.22}
              clock={clock}
            />
            <div className="pf-param">
              <div className="pf-scrub" data-active="true" style={{ "--v": 0.59 } as React.CSSProperties}>
                <span className="pf-scrub__label">Turn</span>
                <span className="pf-scrub__value">
                  <span ref={turnRef}>96</span>
                  <small>°</small>
                </span>
              </div>
              <span className="pf-jack" />
              <span ref={turnKeyRef} className="pf-key" data-state="on" />
            </div>
            <ScrubRow label="Bloom" value="40" unit="%" fill={0.4} sig="level" amount={0.3} clock={clock} />
            <ScrubRow label="Hue shift" value="32" unit="°" fill={0.09} sig="high" amount={0.4} clock={clock} />
            <p className="mini__note">
              A lit jack reacts to the music. A lit diamond changes over time.
            </p>
          </div>

          <div className="mini__time" aria-hidden>
            <div className="pf-transport">
              <span className="pf-play">
                <Play className="pf-i" data-solid />
              </span>
              <span className="pf-timecode">
                <span ref={timeRef} className="mini__now">
                  0:04.08
                </span>{" "}
                <span>/ 0:{two(HERO_SECONDS)}.00</span>
              </span>
              <span className="pf-sep lp-hide-sm" />
              <span className="pf-track-chip lp-hide-sm">
                <Music className="pf-i pf-i--sm" />
                <span>Demo track</span>
              </span>
              <span className="pf-spacer" />
              <Meter clock={clock} />
            </div>
            <PlayedWave progress={progress} className="mini__wave" />
            <div className="mini__lane">
              <span className="mini__lane-name">Turn</span>
              <span
                className="pf-kfspan"
                style={{
                  left: `${TURN_KEYS[0].at * 100}%`,
                  width: `${(TURN_KEYS[TURN_KEYS.length - 1].at - TURN_KEYS[0].at) * 100}%`,
                }}
              />
              {TURN_KEYS.map((key, i) => (
                <span
                  key={key.at}
                  ref={(node) => {
                    diamonds.current[i] = node;
                  }}
                  className="pf-kf"
                  data-sel={i === 0 ? "true" : undefined}
                  style={{ left: `${key.at * 100}%` }}
                />
              ))}
              <motion.div className="wave-head" style={{ x: head }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

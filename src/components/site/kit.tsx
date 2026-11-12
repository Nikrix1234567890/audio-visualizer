"use client";

import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";

// The moving parts every page outside the editor shares: staggered reveals,
// a headline that arrives word by word, numbers that count up, a marquee,
// and a stand-in for the five audio signals that drives the small editor
// demos. Nothing here hides content for good: with reduced motion (see
// MotionProvider) things only fade, and looping work stops off screen.

export const EASE = [0.2, 0.7, 0.2, 1] as const;
export const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

const TAGS = {
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  section: motion.section,
} as const;

/** Lets its `StaggerItem`s rise in one after another when it scrolls into view. */
export function Stagger({
  children,
  className,
  as = "div",
  gap = 0.07,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof TAGS;
  /** Seconds between two items. */
  gap?: number;
  delay?: number;
}) {
  const Tag = TAGS[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof TAGS;
}) {
  const Tag = TAGS[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </Tag>
  );
}

/** A headline whose words rise out of their line one after another. */
export function WordReveal({
  text,
  className,
  as = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const Tag = (as === "h1" ? motion.h1 : motion.h2) as typeof motion.h1;
  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
    >
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden>
          <span className="wr-word">
            <motion.span
              className="wr-in"
              variants={{
                hidden: { y: "105%", opacity: 0 },
                show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: EASE } },
              }}
            >
              {word}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </Tag>
  );
}

/** Fades and rises once, right after the page is up (hero copy, auth cards). */
export function Rise({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds. */
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A whole number that counts up to its value the first time it is seen. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const isReduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!isInView || isReduced || !node) return;
    const controls = animate(0, value, {
      duration: 1.3,
      ease: EASE,
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, isReduced, value]);

  // Rendered with the final number, so it is right without the animation.
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/**
 * An endless row: its content twice, sliding sideways. It stops while it is
 * off screen, while the pointer rests on it, and with reduced motion.
 */
export function Marquee({
  children,
  className = "",
  seconds = 40,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  /** How long one full pass takes. */
  seconds?: number;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "100px 0px" });
  const isReduced = useReducedMotion();
  const isPaused = useRef(false);
  const offset = useMotionValue(reverse ? -50 : 0);
  const x = useTransform(offset, (value) => `${value}%`);

  useAnimationFrame((_, delta) => {
    if (!isInView || isReduced || isPaused.current) return;
    const step = (Math.min(delta, 50) / 1000 / seconds) * 50;
    let next = offset.get() + (reverse ? step : -step);
    if (next <= -50) next += 50;
    if (next >= 0) next -= 50;
    offset.set(next);
  });

  return (
    <div
      ref={ref}
      className={`mq ${className}`}
      onPointerEnter={() => {
        isPaused.current = true;
      }}
      onPointerLeave={() => {
        isPaused.current = false;
      }}
    >
      <motion.div className="mq__track" style={{ x }}>
        <div className="mq__set">{children}</div>
        <div className="mq__set" aria-hidden inert>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* ---- The five signals, as a stand-in for a playing track ---- */

export type SignalKey = "bass" | "mid" | "high" | "level" | "beat";
export const SIGNAL_KEYS: SignalKey[] = ["bass", "mid", "high", "level", "beat"];
export const SIGNAL_NAMES: Record<SignalKey, string> = {
  bass: "Bass",
  mid: "Mids",
  high: "Highs",
  level: "Level",
  beat: "Beat",
};

/** Seconds between two beats of the stand-in track (160 beats per minute). */
export const BEAT_SECONDS = 0.375;

/** What the five signals are at second `t`, each 0..1. */
export function signalsAt(t: number): Record<SignalKey, number> {
  const beat = Math.exp(-((t % BEAT_SECONDS) / BEAT_SECONDS) * 4.5);
  const bar = (t % (BEAT_SECONDS * 2)) / (BEAT_SECONDS * 2);
  const bass = 0.22 + 0.78 * Math.exp(-bar * 3);
  const mid = 0.5 + 0.28 * Math.sin(t * 2.1) + 0.16 * Math.sin(t * 5.3 + 1);
  const high = 0.4 + 0.24 * Math.sin(t * 7.7 + 2) + 0.2 * Math.sin(t * 13.1);
  const level = 0.45 + 0.3 * bass + 0.15 * Math.sin(t * 1.3);
  return { bass, mid, high, level, beat };
}

export type SignalClock = Record<SignalKey, MotionValue<number>> & {
  /** Seconds since the clock started. */
  time: MotionValue<number>;
  isRunning: boolean;
};

/**
 * Runs the stand-in signals while `ref` is on screen. Every value is a
 * motion value, so nothing re-renders while they move.
 */
export function useSignalClock(ref: RefObject<Element | null>): SignalClock {
  const isInView = useInView(ref, { margin: "60px 0px" });
  const isReduced = useReducedMotion();
  const isRunning = isInView && !isReduced;
  const time = useMotionValue(0);
  const bass = useMotionValue(0.9);
  const mid = useMotionValue(0.55);
  const high = useMotionValue(0.35);
  const level = useMotionValue(0.7);
  const beat = useMotionValue(1);

  useAnimationFrame((_, delta) => {
    if (!isRunning) return;
    const t = time.get() + Math.min(delta, 50) / 1000;
    time.set(t);
    const now = signalsAt(t);
    bass.set(now.bass);
    mid.set(now.mid);
    high.set(now.high);
    level.set(now.level);
    beat.set(now.beat);
  });

  return { time, bass, mid, high, level, beat, isRunning };
}

/** The transport's level meter: one bar per signal, in its colour. */
export function Meter({ clock, className = "" }: { clock: SignalClock; className?: string }) {
  return (
    <span className={`pf-meter ${className}`} aria-hidden>
      {SIGNAL_KEYS.map((key) => (
        <motion.span key={key} data-sig={key} className="meter-bar" style={{ scaleY: clock[key] }} />
      ))}
    </span>
  );
}

/**
 * A scrub field as the editor shows it: label, value, the jack (lit in the
 * colour of the signal it reacts to) and the keyframe diamond. A picture of
 * the control, not the control: it cannot be dragged here.
 */
export function ScrubRow({
  label,
  value,
  unit,
  fill,
  sig,
  amount = 0.3,
  clock,
  keyState,
  isActive = false,
  jack,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  /** How far the field is filled, 0..1. */
  fill: number;
  /** The signal plugged into it. */
  sig?: SignalKey;
  /** How strongly it reacts, as a part of the field's width. */
  amount?: number;
  clock?: SignalClock;
  keyState?: "on" | "at";
  isActive?: boolean;
  /** Replaces the jack (for the demo that plugs one in). */
  jack?: ReactNode;
}) {
  return (
    <div className="pf-param">
      <div
        className="pf-scrub"
        data-active={isActive ? "true" : undefined}
        style={{ "--v": fill, "--m": amount } as React.CSSProperties}
      >
        <span className="pf-scrub__label">{label}</span>
        <span className="pf-scrub__value">
          {value}
          {unit && <small>{unit}</small>}
        </span>
        {sig &&
          (clock ? (
            <motion.span
              className="pf-scrub__mod mod-bar"
              data-sig={sig}
              style={{ scaleX: clock[sig] }}
            />
          ) : (
            <span className="pf-scrub__mod" data-sig={sig} />
          ))}
      </div>
      {jack ?? <span className="pf-jack" data-sig={sig} />}
      <span className="pf-key" data-state={keyState} />
    </div>
  );
}

/* ---- Values that travel between keyframes ---- */

export type DemoKeyframe = { at: number; value: number };

/** The value at `p` (0..1), easing smoothly from one keyframe to the next. */
export function valueBetween(keyframes: DemoKeyframe[], p: number): number {
  if (p <= keyframes[0].at) return keyframes[0].value;
  for (let i = 1; i < keyframes.length; i++) {
    const from = keyframes[i - 1];
    const to = keyframes[i];
    if (p <= to.at) {
      const k = (p - from.at) / (to.at - from.at);
      const eased = k * k * (3 - 2 * k);
      return from.value + (to.value - from.value) * eased;
    }
  }
  return keyframes[keyframes.length - 1].value;
}

/** Index of the last keyframe the playhead has reached, or -1. */
export function lastReached(keyframes: DemoKeyframe[], p: number): number {
  let index = -1;
  keyframes.forEach((keyframe, i) => {
    if (p >= keyframe.at) index = i;
  });
  return index;
}

/**
 * The waveform with a played part and a playhead that follow `progress`
 * (0..1). Only transforms move.
 */
export function PlayedWave({
  progress,
  className = "",
  children,
}: {
  progress: MotionValue<number>;
  className?: string;
  children?: ReactNode;
}) {
  const hide = useTransform(progress, (p) => `${(p - 1) * 100}%`);
  const show = useTransform(progress, (p) => `${(1 - p) * 100}%`);
  const head = useTransform(progress, (p) => `${p * 100}%`);
  return (
    <div className={`wave-lane ${className}`}>
      <div className="wave wave--idle" />
      <motion.div className="wave-clip" style={{ x: hide }}>
        <motion.div className="wave-clip__in" style={{ x: show }}>
          <div className="wave wave--played" />
        </motion.div>
      </motion.div>
      <div className="pf-beats" />
      {children}
      <motion.div className="wave-head" style={{ x: head }} />
    </div>
  );
}

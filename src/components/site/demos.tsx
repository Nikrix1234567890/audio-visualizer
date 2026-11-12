"use client";

import { Check, Crown, Download, ImagePlus, Lock, Music } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useAnimate,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  EASE,
  Meter,
  PlayedWave,
  SIGNAL_KEYS,
  SIGNAL_NAMES,
  SPRING,
  ScrubRow,
  lastReached,
  useSignalClock,
  valueBetween,
  type DemoKeyframe,
  type SignalKey,
} from "./kit";

// Small working pieces of the editor for the landing page, the features
// page and the help page. They are built from the editor's own component
// classes and move with a stand-in for a playing track (see kit.tsx). Each
// one is complete at rest and only runs while it is on screen.

/** Steps through `count` choices while `ref` is on screen, until the visitor picks one. */
function useCycle(
  count: number,
  milliseconds: number,
  ref: RefObject<Element | null>,
): [number, (index: number) => void] {
  const isInView = useInView(ref, { amount: 0.4 });
  const isReduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (!isInView || isReduced || isManual) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), milliseconds);
    return () => clearInterval(timer);
  }, [isInView, isReduced, isManual, count, milliseconds]);

  return [
    index,
    (next) => {
      setIsManual(true);
      setIndex(next);
    },
  ];
}

/** A segmented control whose raised pill slides to the chosen item. */
export function Seg({
  options,
  value,
  onChange,
  label,
  isBlock = false,
}: {
  options: { value: string; label: string; isLocked?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  /** What is being chosen, for screen readers. */
  label: string;
  isBlock?: boolean;
}) {
  const pillId = useId();
  return (
    <span className={`pf-seg seg ${isBlock ? "pf-seg--block" : ""}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="pf-seg__item"
          aria-pressed={option.value === value}
          data-locked={option.isLocked ? "true" : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.value === value && (
            <motion.span layoutId={pillId} className="seg__pill" transition={SPRING} />
          )}
          <span className="seg__label">
            {option.label}
            {option.isLocked && <Lock className="pf-i" aria-label="Premium" />}
          </span>
        </button>
      ))}
    </span>
  );
}

/* ---- Anything can react ---- */

/** Plugs "Bar height" into one signal after another; the chips choose it. */
export function ReactDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSignalClock(ref);
  const [index, choose] = useCycle(SIGNAL_KEYS.length, 2600, ref);
  const sig = SIGNAL_KEYS[index];

  return (
    <div ref={ref} className="pf-card__demo">
      <div className="lp-row demo-chips" role="group" aria-label="What bar height reacts to">
        {SIGNAL_KEYS.map((key, i) => (
          <motion.button
            key={key}
            type="button"
            className="pf-signal"
            data-sig={key}
            aria-pressed={i === index}
            onClick={() => choose(i)}
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
          >
            {SIGNAL_NAMES[key]}
          </motion.button>
        ))}
      </div>
      <ScrubRow
        label="Bar height"
        value="1.25"
        unit="x"
        fill={0.42}
        sig={sig}
        amount={0.34}
        clock={clock}
        jack={
          <span className="pf-jack" data-sig={sig}>
            {/* The ring that runs out from the jack when a signal is plugged in. */}
            <motion.span
              key={sig}
              className="jack-ping"
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </span>
        }
      />
      <ScrubRow label="Glow" value="68" unit="%" fill={0.68} sig="beat" amount={0.22} clock={clock} />
      <ScrubRow label="Camera shake" value="12" unit="%" fill={0.12} sig="level" amount={0.3} clock={clock} />
      <ScrubRow label="Hue shift" value="90" unit="°" fill={0.25} sig="high" amount={0.4} clock={clock} />
      <p className="demo-note" data-sig={sig}>
        Bar height reacts to <b>{SIGNAL_NAMES[sig].toLowerCase()}</b>
      </p>
    </div>
  );
}

/* ---- Animate over time ---- */

const GLOW_KEYS: DemoKeyframe[] = [
  { at: 0.18, value: 20 },
  { at: 0.42, value: 90 },
  { at: 0.68, value: 45 },
];
const SCALE_KEYS: DemoKeyframe[] = [
  { at: 0.32, value: 1 },
  { at: 0.78, value: 1.8 },
];
/** Seconds the playhead takes across the demo's timeline. */
const KEYFRAME_LOOP = 7;

function Lane({
  name,
  keyframes,
  register,
  head,
}: {
  name: string;
  keyframes: DemoKeyframe[];
  register: (index: number, node: HTMLSpanElement | null) => void;
  head: MotionValue<string>;
}) {
  const first = keyframes[0].at;
  const last = keyframes[keyframes.length - 1].at;
  return (
    <div className="kf-lane">
      <span className="kf-lane__name">{name}</span>
      <span className="pf-kfspan" style={{ left: `${first * 100}%`, width: `${(last - first) * 100}%` }} />
      {keyframes.map((keyframe, i) => (
        <span
          key={keyframe.at}
          ref={(node) => register(i, node)}
          className="pf-kf"
          style={{ left: `${keyframe.at * 100}%` }}
        />
      ))}
      <motion.div className="wave-head" style={{ x: head }} />
    </div>
  );
}

/** A value travelling between its keyframes while the playhead crosses the timeline. */
export function KeyframeDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSignalClock(ref);
  const progress = useTransform(clock.time, (t) => (t % KEYFRAME_LOOP) / KEYFRAME_LOOP);
  const head = useTransform(progress, (p) => `${p * 100}%`);

  const scrubRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const keyRef = useRef<HTMLSpanElement>(null);
  const glowDiamonds = useRef<(HTMLSpanElement | null)[]>([]);
  const scaleDiamonds = useRef<(HTMLSpanElement | null)[]>([]);

  useMotionValueEvent(progress, "change", (p) => {
    const glow = valueBetween(GLOW_KEYS, p);
    if (valueRef.current) valueRef.current.textContent = String(Math.round(glow));
    scrubRef.current?.style.setProperty("--v", (glow / 100).toFixed(3));
    const light = (diamonds: (HTMLSpanElement | null)[], keyframes: DemoKeyframe[]) => {
      const reached = lastReached(keyframes, p);
      diamonds.forEach((diamond, i) => {
        if (!diamond) return;
        if (i === reached) diamond.setAttribute("data-sel", "true");
        else diamond.removeAttribute("data-sel");
      });
      return reached;
    };
    const reached = light(glowDiamonds.current, GLOW_KEYS);
    light(scaleDiamonds.current, SCALE_KEYS);
    const isOnKey = reached >= 0 && p - GLOW_KEYS[reached].at < 0.035;
    keyRef.current?.setAttribute("data-state", isOnKey ? "at" : "on");
  });

  return (
    <div ref={ref} className="pf-card__demo kf-demo">
      <div className="kf-demo__row">
        <div className="pf-param">
          <div
            ref={scrubRef}
            className="pf-scrub"
            data-active="true"
            style={{ "--v": 0.2 } as React.CSSProperties}
          >
            <span className="pf-scrub__label">Glow</span>
            <span className="pf-scrub__value">
              <span ref={valueRef}>20</span>
              <small>%</small>
            </span>
          </div>
          <span className="pf-jack" />
          <span ref={keyRef} className="pf-key" data-state="on" />
        </div>
      </div>
      <PlayedWave progress={progress} className="kf-demo__wave" />
      <Lane
        name="Glow"
        keyframes={GLOW_KEYS}
        head={head}
        register={(i, node) => {
          glowDiamonds.current[i] = node;
        }}
      />
      <Lane
        name="Scale"
        keyframes={SCALE_KEYS}
        head={head}
        register={(i, node) => {
          scaleDiamonds.current[i] = node;
        }}
      />
    </div>
  );
}

/* ---- Bring your own ---- */

/** The layer list with the visitor's own picture dropping in on top. */
export function LayersDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSignalClock(ref);

  return (
    <div ref={ref} className="pf-card__demo layers-demo">
      <motion.div
        className="pf-layer"
        aria-selected="true"
        initial={{ opacity: 0, y: -22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.35 }}
      >
        <span className="pf-layer__grip" />
        <span className="layer-thumb layer-thumb--own">
          <ImagePlus className="pf-i pf-i--sm" aria-hidden />
        </span>
        <span className="pf-layer__name">Your logo.png</span>
        <span className="pf-layer__sigs">
          <motion.span className="pf-dot" data-sig="level" style={{ opacity: clock.level }} />
        </span>
      </motion.div>
      <div className="pf-layer">
        <span className="pf-layer__grip" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="layer-thumb" src="/thumbnails/elements/barRing.jpg" alt="" width={56} height={56} loading="lazy" />
        <span className="pf-layer__name">Bar ring</span>
        <span className="pf-layer__sigs">
          <motion.span className="pf-dot" data-sig="bass" style={{ opacity: clock.bass }} />
          <motion.span className="pf-dot" data-sig="mid" style={{ opacity: clock.mid }} />
        </span>
      </div>
      <div className="pf-layer">
        <span className="pf-layer__grip" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="layer-thumb" src="/thumbnails/elements/stars.jpg" alt="" width={56} height={56} loading="lazy" />
        <span className="pf-layer__name">Stars</span>
        <span className="pf-layer__sigs" />
      </div>
    </div>
  );
}

/* ---- Slow down, speed up ---- */

const TEMPO_MODES = [
  { value: "even", label: "Even" },
  { value: "wave", label: "Wave" },
  { value: "beat", label: "On the beat" },
];

/** A dot circling at a steady pace, in a wave, or surging on every beat. */
export function TempoDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSignalClock(ref);
  const [index, choose] = useCycle(TEMPO_MODES.length, 3600, ref);
  const angle = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (!clock.isRunning) return;
    const t = clock.time.get();
    const speed =
      index === 0
        ? 1
        : index === 1
          ? 1 + 0.92 * Math.sin((t * Math.PI * 2) / 2.4)
          : 0.1 + 3.4 * clock.beat.get();
    angle.set(angle.get() + (Math.min(delta, 50) / 1000) * speed * 120);
  });

  return (
    <div ref={ref} className="pf-card__demo">
      <Seg
        isBlock
        label="Tempo swing"
        options={TEMPO_MODES}
        value={TEMPO_MODES[index].value}
        onChange={(value) => choose(TEMPO_MODES.findIndex((mode) => mode.value === value))}
      />
      <div className="tempo-row">
        <span className="tempo-orbit" aria-hidden>
          <motion.span className="tempo-orbit__arm" style={{ rotate: angle }}>
            <i />
          </motion.span>
        </span>
        <div className="pf-grow">
          <ScrubRow
            label="Swing"
            value={index === 0 ? "0" : "55"}
            unit="%"
            fill={index === 0 ? 0 : 0.55}
          />
        </div>
      </div>
    </div>
  );
}

/* ---- What you see is the video ---- */

const clockText = (seconds: number) =>
  `0:${String(Math.floor(seconds)).padStart(2, "0")}.${String(Math.floor((seconds % 1) * 100)).padStart(2, "0")}`;

/** The same loop twice, held in step: once as "Preview", once as "Video". */
export function ParityDemo({ templateId = "nova" }: { templateId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  const firstTime = useRef<HTMLSpanElement>(null);
  const secondTime = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { margin: "60px 0px" });
  const isReduced = useReducedMotion();

  useEffect(() => {
    const a = first.current;
    const b = second.current;
    if (!a || !b) return;
    if (isInView && !isReduced) {
      a.play().catch(() => {});
      b.play().catch(() => {});
    } else {
      a.pause();
      b.pause();
    }
  }, [isInView, isReduced]);

  useAnimationFrame(() => {
    const a = first.current;
    const b = second.current;
    if (!isInView || isReduced || !a || !b) return;
    // Two players drift apart by a frame or two; pull the second back in step.
    if (Math.abs(a.currentTime - b.currentTime) > 0.08) b.currentTime = a.currentTime;
    if (firstTime.current) firstTime.current.textContent = clockText(a.currentTime);
    if (secondTime.current) secondTime.current.textContent = clockText(b.currentTime);
  });

  const src = `/previews/${templateId}.mp4`;
  const poster = `/thumbnails/templates/${templateId}.jpg`;
  return (
    <div ref={ref} className="pf-card__demo parity">
      <div className="media-box parity__box">
        <video ref={first} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden />
        <span className="pf-badge pf-badge--solid parity__badge">Preview</span>
        <span ref={firstTime} className="parity__time">
          0:00.00
        </span>
      </div>
      <div className="media-box parity__box">
        <video ref={second} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden />
        <span className="pf-badge pf-badge--solid parity__badge">Video</span>
        <span ref={secondTime} className="parity__time">
          0:00.00
        </span>
      </div>
    </div>
  );
}

/* ---- One scene, three formats ---- */

const FORMATS = [
  { value: "16:9", label: "16:9", use: "YouTube" },
  { value: "9:16", label: "9:16", use: "Reels, Shorts, TikTok" },
  { value: "1:1", label: "1:1", use: "Feeds" },
];

/** One frame that changes its shape: landscape, portrait, square. */
export function FormatMorph({ templateId = "galaxy" }: { templateId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, choose] = useCycle(FORMATS.length, 2600, ref);
  const format = FORMATS[index];

  return (
    <div ref={ref} className="pf-card__demo format-demo">
      <div className="format-demo__head">
        <Seg
          label="Format"
          options={FORMATS}
          value={format.value}
          onChange={(value) => choose(FORMATS.findIndex((f) => f.value === value))}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={format.value}
            className="format-demo__use"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {format.use}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="format-demo__stage">
        <motion.div
          layout
          className="format-frame"
          data-format={format.value}
          style={{ borderRadius: 10 }}
          transition={{ type: "spring", stiffness: 210, damping: 26 }}
        >
          {/* Kept at one size and only moved, so the picture is never squeezed while the frame changes. */}
          <motion.img
            layout="position"
            className="format-frame__img"
            src={`/thumbnails/templates/${templateId}.jpg`}
            alt={`The same scene in ${format.label}`}
            width={356}
            height={200}
            transition={{ type: "spring", stiffness: 210, damping: 26 }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ---- How it works: the three steps ---- */

/** Step 1: a track lands in the drop zone and its signals are found. */
export function StepLoad() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const clock = useSignalClock(ref);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!isInView) return;
    const drop = setTimeout(() => setPhase(1), 800);
    const done = setTimeout(() => setPhase(2), 2600);
    return () => {
      clearTimeout(drop);
      clearTimeout(done);
    };
  }, [isInView]);

  return (
    <div ref={ref} className="pf-card__demo">
      <div className="pf-drop pf-drop--inline step-load" data-over={phase === 1 ? "true" : undefined}>
        <span className="pf-drop__icon">
          <Music className="pf-i" aria-hidden />
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            className="pf-stack step-load__text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="ui-strong">{phase === 0 ? "Drop a track here" : "your-track.mp3"}</span>
            {phase === 0 && <span className="pf-drop__hint">MP3, WAV, M4A, AAC, OGG or FLAC</span>}
            {phase === 1 && (
              <span className="pf-progress step-load__bar">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                />
              </span>
            )}
            {phase === 2 && <span className="pf-drop__hint">Bass, mids, highs and beats found</span>}
          </motion.span>
        </AnimatePresence>
        {phase === 2 && (
          <motion.span
            className="step-load__meter"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
          >
            <Meter clock={clock} />
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** Step 2: two settings plugged into the music. */
export function StepBuild() {
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSignalClock(ref);
  return (
    <div ref={ref} className="pf-card__demo">
      <ScrubRow label="Bar height" value="1.25" unit="x" fill={0.42} sig="bass" amount={0.34} clock={clock} />
      <ScrubRow label="Glow" value="68" unit="%" fill={0.68} sig="beat" amount={0.22} clock={clock} />
    </div>
  );
}

const SIZES: Record<string, string> = {
  "16:9": "1280 x 720",
  "9:16": "720 x 1280",
  "1:1": "720 x 720",
};

/** Step 3: pick a format, press Export, watch the video being drawn. */
export function StepExport() {
  const ref = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const isReduced = useReducedMotion();
  const [format, setFormat] = useState("9:16");
  const [state, setState] = useState<"idle" | "rendering" | "done">("idle");
  const progress = useMotionValue(0);

  useMotionValueEvent(progress, "change", (p) => {
    if (percentRef.current) percentRef.current.textContent = `${Math.round(p * 100)}%`;
  });

  const run = () => {
    progress.set(0);
    setState("rendering");
    animate(progress, 1, { duration: isReduced ? 0.01 : 2.4, ease: "linear" }).then(() =>
      setState("done"),
    );
  };

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(run, 900);
    return () => clearTimeout(timer);
    // Runs once, when the card is first seen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <div ref={ref} className="pf-card__demo step-export">
      <div className="step-export__row">
        <Seg label="Format" options={FORMATS} value={format} onChange={setFormat} />
        <motion.button
          type="button"
          className="pf-btn pf-btn--cta"
          onClick={run}
          disabled={state === "rendering"}
          whileTap={{ scale: 0.95 }}
          transition={SPRING}
        >
          <Download className="pf-i" aria-hidden />
          Export
        </motion.button>
      </div>
      <span className="pf-progress">
        <motion.span className="progress-fill" style={{ scaleX: progress }} />
      </span>
      <span className="pf-job__meta">
        <span>{SIZES[format]}</span>
        <span>30 fps</span>
        {state === "done" ? (
          <span className="step-export__done">
            <Check className="pf-i pf-i--sm" aria-hidden />
            Video ready
          </span>
        ) : (
          <span>
            {state === "rendering" ? "Rendering " : "Waiting "}
            <span ref={percentRef}>0%</span>
          </span>
        )}
      </span>
    </div>
  );
}

/* ---- Features page ---- */

const MOVES = [
  { id: "push", label: "Push in", keys: { scale: [1, 1.38] }, seconds: 1.8 },
  { id: "pull", label: "Pull out", keys: { scale: [1.38, 1] }, seconds: 1.8 },
  { id: "crane", label: "Crane", keys: { y: ["9%", "-9%"], scale: [1.22, 1.22] }, seconds: 2 },
  { id: "punch", label: "Zoom punch", keys: { scale: [1, 1.3, 1] }, seconds: 0.7 },
  { id: "dolly", label: "Dolly zoom", keys: { scale: [1.3, 1.05], y: ["0%", "0%"] }, seconds: 2 },
  {
    id: "impact",
    label: "Impact",
    keys: { x: ["0%", "-2.4%", "2%", "-1.2%", "0.6%", "0%"], scale: [1.12, 1.12] },
    seconds: 0.5,
  },
];

/** The camera moves as buttons; each plays a flat sketch of itself and leaves two keyframes. */
export function CameraDemo({ templateId = "nightCity" }: { templateId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, play] = useAnimate<HTMLImageElement>();
  const [index, choose] = useCycle(MOVES.length, 3000, ref);
  const isInView = useInView(ref, { amount: 0.4 });
  const move = MOVES[index];

  useEffect(() => {
    if (!isInView || !scope.current) return;
    const controls = play(
      scope.current,
      { x: "0%", y: "0%", ...MOVES[index].keys },
      { duration: MOVES[index].seconds, ease: EASE },
    );
    return () => controls.stop();
  }, [index, isInView, play, scope]);

  const span = Math.min(0.5, move.seconds / 4);
  return (
    <div ref={ref} className="pf-card__demo camera-demo">
      <div className="camera-demo__moves" role="group" aria-label="Camera moves">
        {MOVES.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            className="pf-btn pf-btn--secondary pf-btn--sm"
            aria-pressed={i === index}
            onClick={() => choose(i)}
            whileTap={{ scale: 0.94 }}
            transition={SPRING}
          >
            {m.label}
          </motion.button>
        ))}
      </div>
      <div className="media-box camera-demo__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={scope}
          className="media"
          src={`/thumbnails/templates/${templateId}.jpg`}
          alt={`A sketch of the camera move "${move.label}"`}
          width={640}
          height={360}
          loading="lazy"
        />
      </div>
      <div className="kf-lane">
        <span className="kf-lane__name">Camera</span>
        <span className="pf-kfspan" style={{ left: "30%", width: `${span * 100}%` }} />
        <AnimatePresence initial={false}>
          {[0.3, 0.3 + span].map((at, i) => (
            <motion.span
              key={`${move.id}-${i}`}
              className="pf-kf"
              data-sel={i === 0 ? "true" : undefined}
              style={{ left: `${at * 100}%`, rotate: 45 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ ...SPRING, delay: i * 0.08 }}
            />
          ))}
        </AnimatePresence>
        <span className="wave-head camera-demo__head" />
      </div>
    </div>
  );
}

const LYRICS = [
  { at: "0:12", text: "First line of your song" },
  { at: "0:16", text: "The next one, right on time" },
  { at: "0:21", text: "And the one after that" },
];

/** Timed lines on the left, the line that is due fading in over the scene. */
export function LyricsDemo({ templateId = "halo" }: { templateId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index] = useCycle(LYRICS.length, 2400, ref);

  return (
    <div ref={ref} className="pf-card__demo lyrics-demo">
      <ol className="lyrics-demo__lines">
        {LYRICS.map((line, i) => (
          <li key={line.at} aria-current={i === index ? "true" : undefined}>
            <span>{line.at}</span> {line.text}
          </li>
        ))}
      </ol>
      <div className="media-box lyrics-demo__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="media"
          src={`/thumbnails/templates/${templateId}.jpg`}
          alt=""
          width={480}
          height={270}
          loading="lazy"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className="lyrics-demo__line"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {LYRICS[index].text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

const LENGTHS = [
  { value: "all", label: "Whole track" },
  { value: "15", label: "15 s" },
  { value: "30", label: "30 s" },
  { value: "60", label: "60 s" },
];

/** The export choices. Options the free plan does not have are locked, readable, and say so when picked. */
export function ExportDemo({
  resolutions,
  frameRates,
}: {
  resolutions: { value: string; label: string; isLocked: boolean }[];
  frameRates: { value: string; label: string; isLocked: boolean }[];
}) {
  const [resolution, setResolution] = useState(resolutions[0].value);
  const [frameRate, setFrameRate] = useState(frameRates[0].value);
  const [length, setLength] = useState("all");
  const isPremium =
    resolutions.some((r) => r.value === resolution && r.isLocked) ||
    frameRates.some((r) => r.value === frameRate && r.isLocked);

  return (
    <div className="pf-card__demo export-demo">
      <div className="export-demo__row">
        <span className="pf-label">Resolution</span>
        <Seg isBlock label="Resolution" options={resolutions} value={resolution} onChange={setResolution} />
      </div>
      <div className="export-demo__row">
        <span className="pf-label">Frame rate</span>
        <Seg isBlock label="Frame rate" options={frameRates} value={frameRate} onChange={setFrameRate} />
      </div>
      <div className="export-demo__row">
        <span className="pf-label">Length</span>
        <Seg isBlock label="Length" options={LENGTHS} value={length} onChange={setLength} />
      </div>
      <AnimatePresence initial={false}>
        {isPremium && (
          <motion.div
            className="export-demo__note"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="pf-banner pf-banner--premium" role="status">
              <Crown className="pf-i" aria-hidden />
              <span>
                <b>That one is part of Premium.</b> On the free plan the video is exported at the
                unlocked settings.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The five signals, each with a bar that moves the way the signal does. */
export function SignalBars({
  signals,
}: {
  signals: { sig: string; label: string; text: string }[];
}) {
  const ref = useRef<HTMLUListElement>(null);
  const clock = useSignalClock(ref);
  return (
    <ul ref={ref} className="sigs">
      {signals.map((signal) => (
        <li key={signal.sig} data-sig={signal.sig}>
          <span className="sigs__name">
            <span className="pf-dot" />
            {signal.label}
          </span>
          <span className="sigs__text">{signal.text}</span>
          <span className="sigs__bar" aria-hidden>
            <motion.span style={{ scaleX: clock[signal.sig as SignalKey] }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

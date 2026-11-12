"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioVisualizer3D } from "../../../remotion/compositions/AudioVisualizer3D";
import type { SceneDocument } from "../../../remotion/scene/definitions";
import type {
  SceneEditorHooks,
  TransformTool,
} from "../../../remotion/scene/SceneRenderer";
import { ASPECTS, outputSize, type AspectKey } from "../../../remotion/types";
import { Maximize2, MousePointer2, Move, Music, RotateCw } from "lucide-react";

/** The preview is drawn at the smallest export size of the chosen format. */
const PREVIEW_RESOLUTION = "720p";
/** Room kept free around the picture inside the stage. */
const BEZEL = 0;

const TOOLS: { value: TransformTool; label: string; icon: typeof Move }[] = [
  { value: "off", label: "Select only", icon: MousePointer2 },
  { value: "move", label: "Move", icon: Move },
  { value: "rotate", label: "Rotate", icon: RotateCw },
  { value: "scale", label: "Scale", icon: Maximize2 },
];

/**
 * The stage: the live 3D picture in its export format, fitted into whatever
 * space the layout gives it, on a dotted well. A small toolbar floats above
 * it. It has no playback controls of its own - those live in the transport
 * bar. While paused, clicking an element selects it and the chosen tool's
 * handles let you move, rotate or scale it right in the picture.
 */
export function Preview({
  audioUrl,
  durationInFrames,
  fps,
  aspect,
  watermark,
  scene,
  initiallyMuted,
  isLoading,
  onPlayer,
  onPickFile,
  onLoadDemo,
  notice,
  badges = [],
  selectedId,
  onSelect,
  onTransform,
}: {
  audioUrl: string | null;
  durationInFrames: number;
  fps: number;
  aspect: AspectKey;
  /** Shows the free plan's mark, exactly where a render would have it. */
  watermark: boolean;
  scene: SceneDocument;
  initiallyMuted: boolean;
  isLoading: boolean;
  onPlayer: (player: PlayerRef | null) => void;
  onPickFile: (file: File) => void;
  /** Loads the demo track that ships with the app. */
  onLoadDemo: () => void;
  /** Floats over the stage's lower left corner (the first-visit card). */
  notice?: React.ReactNode;
  /** Shown as badges in the picture's corner, e.g. "16:9" and "720p". */
  badges?: string[];
  selectedId: string | null;
  onSelect: SceneEditorHooks["onSelect"];
  onTransform: SceneEditorHooks["onTransform"];
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState<TransformTool>("move");
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Frames the preview actually produced during the last second of playback.
  const [measuredFps, setMeasuredFps] = useState<number | null>(null);

  const handlePlayer = useCallback(
    (instance: PlayerRef | null) => {
      setPlayer(instance);
      onPlayer(instance);
    },
    [onPlayer],
  );

  useEffect(() => {
    if (!player) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setMeasuredFps(null);
    };

    // Count the frames shown per second, so smoothness is a number that can
    // be read off the screen instead of a feeling.
    let frames = 0;
    let since = performance.now();
    const onFrame = () => {
      frames++;
      const now = performance.now();
      if (now - since < 1000) return;
      if (player.isPlaying()) setMeasuredFps(Math.round((frames * 1000) / (now - since)));
      frames = 0;
      since = now;
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("frameupdate", onFrame);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("frameupdate", onFrame);
    };
  }, [player]);

  useEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setArea({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The handles would only be in the way of a playing video.
  const activeTool = isPlaying ? "off" : tool;
  const inputProps = useMemo(
    () => ({
      audioSrc: audioUrl ?? "",
      scene,
      appBase: "",
      watermark,
      editor: { selectedId, tool: activeTool, onSelect, onTransform },
    }),
    [audioUrl, scene, watermark, selectedId, activeTool, onSelect, onTransform],
  );

  // Largest box of the chosen format (plus bezel) that fits into the
  // available area.
  const ratio = ASPECTS[aspect].ratio;
  const composition = outputSize(aspect, PREVIEW_RESOLUTION);
  const maxWidth = Math.max(0, area.width - BEZEL);
  const maxHeight = Math.max(0, area.height - BEZEL);
  const width = Math.floor(Math.min(maxWidth, maxHeight * ratio));
  const height = Math.floor(width / ratio);

  return (
    <section className="ed__stage" aria-label="Preview">
      <div className="pf-toolbar ed__tools" role="toolbar" aria-label="Tools">
        {TOOLS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            className="pf-btn pf-btn--ghost pf-btn--icon"
            aria-pressed={tool === value}
            aria-label={label}
            title={label}
            onClick={() => setTool(value)}
          >
            <Icon className="pf-i" aria-hidden />
          </button>
        ))}
      </div>
      <span className="ed__hint hidden xl:block">
        {isPlaying
          ? "Pause to edit in the picture."
          : "Click an element to select it, drag the handles to change it."}
      </span>
      {isPlaying && measuredFps !== null && (
        <span className="ed__fps" title="Frames the preview showed in the last second">
          {measuredFps} / {fps} fps
        </span>
      )}

      <div ref={areaRef} className="ed__area">
        {width > 0 &&
          (audioUrl ? (
            <div className="ed__frame" style={{ width, height }}>
              <Player
                ref={handlePlayer}
                component={AudioVisualizer3D}
                inputProps={inputProps}
                durationInFrames={durationInFrames}
                compositionWidth={composition.width}
                compositionHeight={composition.height}
                fps={fps}
                style={{ width, height }}
                controls={false}
                initiallyMuted={initiallyMuted}
                clickToPlay={false}
                doubleClickToFullscreen={false}
                spaceKeyToPlayOrPause={false}
                loop
                acknowledgeRemotionLicense
              />
              <span className="ed__badges">
                {badges.map((badge) => (
                  <span key={badge} className="pf-badge pf-badge--solid">
                    {badge}
                  </span>
                ))}
              </span>
            </div>
          ) : (
            // Without a track the first-visit card sits under the drop zone;
            // floating, it would cover it.
            <div className="flex w-full max-w-[520px] flex-col gap-3">
              <DropZone isLoading={isLoading} onPickFile={onPickFile} onLoadDemo={onLoadDemo} />
              {notice}
            </div>
          ))}
      </div>

      {audioUrl && notice && <div className="ed__notice">{notice}</div>}
    </section>
  );
}

function DropZone({
  isLoading,
  onPickFile,
  onLoadDemo,
}: {
  isLoading: boolean;
  onPickFile: (file: File) => void;
  onLoadDemo: () => void;
}) {
  return (
    <div className="pf-drop w-full gap-4 px-8 py-10">
      <span className="pf-drop__icon h-14 w-14">
        <Music className="pf-i pf-i--lg" aria-hidden />
      </span>
      <span className="font-display text-[22px] leading-tight font-semibold tracking-[-0.015em] text-ink-1">
        {isLoading ? "Reading the track" : "Drop a track to start"}
      </span>
      <span className="pf-drop__hint max-w-[36ch]">
        MP3, WAV, M4A, AAC, OGG or FLAC. It stays in your browser until you export or save.
      </span>
      {!isLoading && (
        <span className="pf-row justify-center">
          <label className="pf-btn pf-btn--cta pf-btn--lg cursor-pointer">
            Choose a file
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" onClick={onLoadDemo} className="pf-btn pf-btn--secondary pf-btn--lg">
            Use the demo track
          </button>
        </span>
      )}
    </div>
  );
}

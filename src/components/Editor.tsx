"use client";

import { Player } from "@remotion/player";
import { useCallback, useRef, useState } from "react";
import { AudioVisualizer3D } from "../../remotion/compositions/AudioVisualizer3D";
import {
  DEFAULT_RESOLUTION,
  DEFAULT_VISUALIZER_SETTINGS,
  RESOLUTIONS,
  SCENES,
  type ResolutionKey,
  type VisualizerSettings,
} from "../../remotion/types";
import { Knob } from "@/components/ui/Knob";
import { Panel } from "@/components/ui/Panel";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";

const FPS = 30;
const BAR_COUNT_OPTIONS = [16, 32, 64, 128];

function probeAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () =>
      reject(new Error("Could not read this audio file."));
    audio.src = url;
  });
}

export function Editor() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationInFrames, setDurationInFrames] = useState<number | null>(
    null,
  );
  const [settings, setSettings] = useState<VisualizerSettings>(
    DEFAULT_VISUALIZER_SETTINGS,
  );
  const [resolution, setResolution] =
    useState<ResolutionKey>(DEFAULT_RESOLUTION);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioKeyRef = useRef<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setRenderedUrl(null);
      audioKeyRef.current = null;

      const blobUrl = URL.createObjectURL(file);
      try {
        const duration = await probeAudioDuration(blobUrl);
        setAudioFile(file);
        setAudioUrl(blobUrl);
        setDurationInFrames(Math.max(1, Math.ceil(duration * FPS)));
      } catch {
        setError("This file could not be read as audio.");
      }
    },
    [],
  );

  const updateSetting = useCallback(
    <K extends keyof VisualizerSettings>(
      key: K,
      value: VisualizerSettings[K],
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const pollJobStatus = useCallback((jobId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await fetch(`/api/render/${jobId}`);
          if (!response.ok) {
            throw new Error("Could not check the render job status.");
          }
          const data = await response.json();
          setRenderProgress(data.progress ?? 0);

          if (data.status === "DONE") {
            resolve(data.url as string);
            return;
          }
          if (data.status === "FAILED") {
            reject(new Error(data.error || "Render failed."));
            return;
          }
          setTimeout(poll, 1000);
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
  }, []);

  const handleRender = useCallback(async () => {
    if (!audioFile) return;
    setError(null);
    setRenderedUrl(null);
    setRenderProgress(0);

    try {
      let audioKey = audioKeyRef.current;

      if (!audioKey) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("audio", audioFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        setIsUploading(false);

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json().catch(() => null);
          throw new Error(data?.error || "Upload failed.");
        }

        const uploadData = await uploadResponse.json();
        audioKey = uploadData.key as string;
        audioKeyRef.current = audioKey;
      }

      setIsRendering(true);
      const renderResponse = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioKey, settings, resolution }),
      });

      if (!renderResponse.ok) {
        const data = await renderResponse.json().catch(() => null);
        throw new Error(data?.error || "Render failed.");
      }

      const { jobId } = await renderResponse.json();
      const url = await pollJobStatus(jobId);
      setRenderedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsUploading(false);
      setIsRendering(false);
    }
  }, [audioFile, settings, resolution, pollJobStatus]);

  const isBusy = isUploading || isRendering;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-cream">
          Audio Visualizer
        </h1>
        <p className="mt-1 text-sm text-steel">
          Patch in a track, dial in the look, print it to video.
        </p>
      </div>

      {/* SCOPE */}
      <div className="relative rounded-[10px] border border-hairline bg-panel p-2 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]">
        <Rivet className="left-2 top-2" />
        <Rivet className="right-2 top-2" />
        <Rivet className="bottom-2 left-2" />
        <Rivet className="bottom-2 right-2" />
        {audioUrl && durationInFrames ? (
          <Player
            component={AudioVisualizer3D}
            inputProps={{ audioSrc: audioUrl, ...settings }}
            durationInFrames={durationInFrames}
            compositionWidth={1280}
            compositionHeight={720}
            fps={FPS}
            style={{ width: "100%", borderRadius: 6, overflow: "hidden" }}
            controls
            loop
            clickToPlay
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-md bg-chassis">
            <InputJack
              hasFile={Boolean(audioFile)}
              fileName={audioFile?.name}
              onFileChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {audioUrl && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Panel label="Input">
            <InputJack
              hasFile={Boolean(audioFile)}
              fileName={audioFile?.name}
              onFileChange={handleFileChange}
              compact
            />
          </Panel>

          <Panel label="Scene">
            <div className="flex h-full flex-col items-start justify-center gap-2">
              <SegmentedSelector
                options={SCENES.map((s) => ({ value: s.id, label: s.label }))}
                value={settings.scene}
                onChange={(v) => updateSetting("scene", v)}
              />
            </div>
          </Panel>

          <Panel label="Shape">
            <div className="flex flex-wrap justify-around gap-3">
              <SegmentedSelector
                options={BAR_COUNT_OPTIONS.map((n) => ({
                  value: n,
                  label: String(n),
                }))}
                value={settings.barCount}
                onChange={(v) => updateSetting("barCount", v)}
              />
              <Knob
                label="Radius"
                value={settings.radius}
                min={1}
                max={10}
                step={0.1}
                onChange={(v) => updateSetting("radius", v)}
                formatValue={(v) => v.toFixed(1)}
              />
              <Knob
                label="Width"
                value={settings.barWidth}
                min={0.05}
                max={1}
                step={0.01}
                onChange={(v) => updateSetting("barWidth", v)}
                formatValue={(v) => v.toFixed(2)}
              />
              <Knob
                label="Height"
                value={settings.heightScale}
                min={1}
                max={10}
                step={0.1}
                onChange={(v) => updateSetting("heightScale", v)}
                formatValue={(v) => v.toFixed(1)}
              />
            </div>
          </Panel>

          <Panel label="Color">
            <div className="flex justify-around gap-3">
              <Knob
                label="Hue Start"
                value={settings.hueStart}
                min={0}
                max={360}
                step={1}
                onChange={(v) => updateSetting("hueStart", v)}
                formatValue={(v) => `${Math.round(v)}°`}
              />
              <Knob
                label="Hue End"
                value={settings.hueEnd}
                min={0}
                max={720}
                step={1}
                onChange={(v) => updateSetting("hueEnd", v)}
                formatValue={(v) => `${Math.round(v)}°`}
              />
            </div>
          </Panel>

          <Panel label="Motion">
            <div className="flex justify-around gap-3">
              <Knob
                label="Camera"
                value={settings.cameraSpeed}
                min={0}
                max={2}
                step={0.01}
                onChange={(v) => updateSetting("cameraSpeed", v)}
                formatValue={(v) => `${v.toFixed(2)}x`}
              />
            </div>
          </Panel>

          <Panel label="Output" className="sm:col-span-2 lg:col-span-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SegmentedSelector
                options={Object.entries(RESOLUTIONS).map(([key, r]) => ({
                  value: key as ResolutionKey,
                  label: r.label,
                }))}
                value={resolution}
                onChange={setResolution}
              />

              <div className="flex flex-1 flex-col gap-2 sm:max-w-xs">
                <button
                  type="button"
                  onClick={handleRender}
                  disabled={isBusy}
                  className="rounded-xl border border-hairline bg-panel-raised px-6 py-3 font-sans text-sm font-semibold tracking-wide text-cream shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_6px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_0_16px_rgba(255,138,61,0.45)] hover:text-amber disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading
                    ? "UPLOADING…"
                    : isRendering
                      ? `RENDERING ${Math.round(renderProgress * 100)}%`
                      : "RENDER"}
                </button>

                {isRendering && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-chassis">
                    <div
                      className="h-full bg-amber shadow-[0_0_16px_rgba(255,138,61,0.45)] transition-[width] duration-300"
                      style={{ width: `${Math.round(renderProgress * 100)}%` }}
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                {renderedUrl && (
                  <a
                    href={renderedUrl}
                    download
                    className="font-mono text-xs text-amber underline"
                  >
                    Download video
                  </a>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Rivet({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute z-10 h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.5),rgba(0,0,0,0.6))] ${className}`}
    />
  );
}

function InputJack({
  hasFile,
  fileName,
  onFileChange,
  compact = false,
}: {
  hasFile: boolean;
  fileName?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md ${
        compact ? "py-2" : "py-8"
      }`}
    >
      <span
        className={`relative flex items-center justify-center rounded-full border-2 border-dashed ${
          hasFile ? "border-amber-dim" : "border-hairline"
        } ${compact ? "h-12 w-12" : "h-16 w-16"} transition-colors group-hover:border-amber`}
      >
        <svg
          width={compact ? 18 : 22}
          height={compact ? 18 : 22}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            className={hasFile ? "fill-amber" : "fill-steel"}
          />
          <path
            d="M12 2v6M12 16v6M2 12h6M16 12h6"
            stroke={hasFile ? "var(--patch-amber)" : "var(--steel-label)"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {hasFile && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber shadow-[0_0_8px_rgba(255,138,61,0.8)]" />
        )}
      </span>
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {hasFile ? "Loaded" : "Input"}
      </span>
      {fileName && (
        <span className="max-w-[180px] truncate font-mono text-xs text-cream">
          {fileName}
        </span>
      )}
      {!hasFile && !compact && (
        <span className="text-xs text-steel">Click to select a track</span>
      )}
      <input
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
        className="hidden"
        onChange={onFileChange}
      />
    </label>
  );
}

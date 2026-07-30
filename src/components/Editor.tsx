"use client";

import { Player } from "@remotion/player";
import { useCallback, useRef, useState } from "react";
import { AudioVisualizer3D } from "../../remotion/compositions/AudioVisualizer3D";
import {
  DEFAULT_VISUALIZER_SETTINGS,
  type VisualizerSettings,
} from "../../remotion/types";

const FPS = 30;
const BAR_COUNT_OPTIONS = [16, 32, 64, 128];

function probeAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () =>
      reject(new Error("Audiodatei konnte nicht gelesen werden."));
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
        setError("Die Datei konnte nicht als Audio gelesen werden.");
      }
    },
    [],
  );

  const updateSetting = useCallback(
    <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => {
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
            throw new Error("Job-Status konnte nicht abgefragt werden.");
          }
          const data = await response.json();
          setRenderProgress(data.progress ?? 0);

          if (data.status === "DONE") {
            resolve(data.url as string);
            return;
          }
          if (data.status === "FAILED") {
            reject(new Error(data.error || "Rendern fehlgeschlagen."));
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
          throw new Error(data?.error || "Upload fehlgeschlagen.");
        }

        const uploadData = await uploadResponse.json();
        audioKey = uploadData.key as string;
        audioKeyRef.current = audioKey;
      }

      setIsRendering(true);
      const renderResponse = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioKey, settings }),
      });

      if (!renderResponse.ok) {
        const data = await renderResponse.json().catch(() => null);
        throw new Error(data?.error || "Rendern fehlgeschlagen.");
      }

      const { jobId } = await renderResponse.json();
      const url = await pollJobStatus(jobId);
      setRenderedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setIsUploading(false);
      setIsRendering(false);
    }
  }, [audioFile, settings, pollJobStatus]);

  const isBusy = isUploading || isRendering;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 text-zinc-50">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Eigenes Audio in einen 3D-Visualizer verwandeln
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Song hochladen, Vorschau live anpassen, als MP4 rendern &mdash;
          direkt hier im Browser.
        </p>
      </div>

      <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-10 text-center hover:border-zinc-500">
        <span className="text-sm text-zinc-300">
          {audioFile ? audioFile.name : "Audiodatei auswählen (WAV, MP3, ...)"}
        </span>
        <span className="text-xs text-zinc-500">Klicken oder Datei hierher ziehen</span>
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {audioUrl && durationInFrames && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <Player
            component={AudioVisualizer3D}
            inputProps={{ audioSrc: audioUrl, ...settings }}
            durationInFrames={durationInFrames}
            compositionWidth={1280}
            compositionHeight={720}
            fps={FPS}
            style={{ width: "100%" }}
            controls
            loop
            clickToPlay
            acknowledgeRemotionLicense
          />

          <div className="flex flex-col gap-4 text-sm">
            <label className="flex flex-col gap-1">
              Balkenanzahl
              <select
                value={settings.barCount}
                onChange={(e) =>
                  updateSetting("barCount", Number(e.target.value))
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
              >
                {BAR_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <SliderField
              label="Radius"
              value={settings.radius}
              min={1}
              max={10}
              step={0.1}
              onChange={(v) => updateSetting("radius", v)}
            />
            <SliderField
              label="Balkenbreite"
              value={settings.barWidth}
              min={0.05}
              max={1}
              step={0.01}
              onChange={(v) => updateSetting("barWidth", v)}
            />
            <SliderField
              label="Höhen-Skalierung"
              value={settings.heightScale}
              min={1}
              max={10}
              step={0.1}
              onChange={(v) => updateSetting("heightScale", v)}
            />
            <SliderField
              label="Farbton Start"
              value={settings.hueStart}
              min={0}
              max={360}
              step={1}
              onChange={(v) => updateSetting("hueStart", v)}
            />
            <SliderField
              label="Farbton Ende"
              value={settings.hueEnd}
              min={0}
              max={720}
              step={1}
              onChange={(v) => updateSetting("hueEnd", v)}
            />
            <SliderField
              label="Kamera-Geschwindigkeit"
              value={settings.cameraSpeed}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => updateSetting("cameraSpeed", v)}
            />

            <button
              type="button"
              onClick={handleRender}
              disabled={isBusy}
              className="mt-2 rounded-md bg-white px-4 py-2 font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUploading
                ? "Wird hochgeladen..."
                : isRendering
                  ? `Wird gerendert... ${Math.round(renderProgress * 100)}%`
                  : "Video rendern"}
            </button>

            {isRendering && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-white transition-[width] duration-300"
                  style={{ width: `${Math.round(renderProgress * 100)}%` }}
                />
              </div>
            )}

            {error && <p className="text-red-400">{error}</p>}

            {renderedUrl && (
              <div className="flex flex-col gap-2 rounded-md border border-zinc-700 p-3">
                <p className="text-zinc-300">Fertig!</p>
                <a
                  href={renderedUrl}
                  download
                  className="text-white underline"
                >
                  Video herunterladen
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-zinc-500">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

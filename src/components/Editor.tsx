"use client";

import { getAudioData, type MediaUtilsAudioData } from "@remotion/media-utils";
import type { PlayerRef } from "@remotion/player";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  SceneDocument,
  SceneElement,
} from "../../remotion/scene/definitions";
import {
  DEFAULT_TEMPLATE,
  TEMPLATES,
  cloneScene,
} from "../../remotion/scene/templates";
import { DEFAULT_RESOLUTION, type ResolutionKey } from "../../remotion/types";
import { Preview } from "@/components/editor/Preview";
import { Sidebar, type CollapsedSections } from "@/components/editor/Sidebar";
import { Transport } from "@/components/editor/Transport";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { useStoredState } from "@/lib/useStoredState";

const FPS = 30;
const SEEK_KEY_SECONDS = 5;

const SIDEBAR = { min: 240, max: 520, default: 320 };
const TRANSPORT = { min: 88, max: 320, default: 132 };
const NO_COLLAPSED_SECTIONS: CollapsedSections = {};

type Track = {
  file: File;
  url: string;
  audioData: MediaUtilsAudioData;
  durationInFrames: number;
};

/** True while the user is typing or operating a control that uses the keys itself. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, button, a, [role=slider], [role=separator]"),
  );
}

export function Editor() {
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const [scene, setScene] = useState<SceneDocument>(() =>
    cloneScene(DEFAULT_TEMPLATE.scene),
  );
  // Which template the scene still equals; null as soon as it was edited.
  const [templateId, setTemplateId] = useState<string | null>(
    DEFAULT_TEMPLATE.id,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    DEFAULT_TEMPLATE.focusElementId,
  );
  const [resolution, setResolution] =
    useState<ResolutionKey>(DEFAULT_RESOLUTION);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Layout the user arranged for themselves; remembered across visits.
  const [sidebarWidth, setSidebarWidth] = useStoredState(
    "editor.sidebarWidth",
    SIDEBAR.default,
  );
  const [transportHeight, setTransportHeight] = useStoredState(
    "editor.transportHeight",
    TRANSPORT.default,
  );
  const [collapsed, setCollapsed] = useStoredState(
    "editor.collapsedSections",
    NO_COLLAPSED_SECTIONS,
  );
  const [muted, setMuted] = useStoredState("editor.muted", false);

  const audioKeyRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);

  const loadFile = useCallback(async (file: File) => {
    const loadId = ++loadIdRef.current;
    setError(null);
    setRenderedUrl(null);
    setIsLoadingTrack(true);
    audioKeyRef.current = null;

    const url = URL.createObjectURL(file);
    try {
      // Decoded once here; the preview's composition asks for the same URL
      // and gets this exact object from Remotion's cache, so the waveform and
      // the scenes share one audio analysis.
      const audioData = await getAudioData(url);
      if (loadId !== loadIdRef.current) return;

      setTrack((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return {
          file,
          url,
          audioData,
          durationInFrames: Math.max(
            1,
            Math.ceil(audioData.durationInSeconds * FPS),
          ),
        };
      });
    } catch {
      URL.revokeObjectURL(url);
      if (loadId === loadIdRef.current) {
        setError("This file could not be read as audio.");
      }
    } finally {
      if (loadId === loadIdRef.current) setIsLoadingTrack(false);
    }
  }, []);

  const changeScene = useCallback((next: SceneDocument) => {
    setScene(next);
    setTemplateId(null);
  }, []);

  // Dragging the gizmo in the picture changes an element's transform.
  const transformElement = useCallback(
    (
      id: string,
      patch: Partial<Pick<SceneElement, "position" | "rotation" | "scale">>,
    ) => {
      setScene((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === id ? { ...element, ...patch } : element,
        ),
      }));
      setTemplateId(null);
    },
    [],
  );

  const loadTemplate = useCallback(
    (id: string) => {
      const template = TEMPLATES.find((t) => t.id === id);
      if (!template) return;
      if (
        templateId === null &&
        !window.confirm(
          "Replace your current scene with this template? Your changes will be lost.",
        )
      ) {
        return;
      }
      setScene(cloneScene(template.scene));
      setTemplateId(template.id);
      setSelectedId(template.focusElementId);
    },
    [templateId],
  );

  // Keep the player's mute state in line with the remembered preference.
  useEffect(() => {
    if (!player) return;
    if (muted) player.mute();
    else player.unmute();
  }, [player, muted]);

  // The 3D canvas draws its very first frame before the post-processing pass
  // is ready, which leaves a freshly loaded track showing a black picture
  // until something changes. Stepping one frame forward and back redraws it.
  // (Preview only - the server render is not affected.)
  useEffect(() => {
    if (!player) return;
    const timeout = setTimeout(() => {
      if (player.isPlaying() || player.getCurrentFrame() !== 0) return;
      player.seekTo(1);
      requestAnimationFrame(() => player.seekTo(0));
    }, 150);
    return () => clearTimeout(timeout);
  }, [player]);

  // Space plays/pauses, arrow keys jump - unless a control has the focus.
  const durationInFrames = track?.durationInFrames ?? 1;
  useEffect(() => {
    if (!player) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isInteractiveTarget(e.target)) return;

      if (e.code === "Space") {
        e.preventDefault();
        player.toggle();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const next =
          player.getCurrentFrame() + direction * SEEK_KEY_SECONDS * FPS;
        player.seekTo(Math.min(durationInFrames - 1, Math.max(0, next)));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [player, durationInFrames]);

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
    if (!track) return;
    setError(null);
    setRenderedUrl(null);
    setRenderProgress(0);

    try {
      let audioKey = audioKeyRef.current;

      if (!audioKey) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("audio", track.file);
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
        body: JSON.stringify({ audioKey, scene, resolution }),
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
  }, [track, scene, resolution, pollJobStatus]);

  const toggleSection = useCallback(
    (id: string) => setCollapsed({ ...collapsed, [id]: !collapsed[id] }),
    [collapsed, setCollapsed],
  );

  const layout = {
    "--sidebar-w": `${sidebarWidth}px`,
    "--transport-h": `${transportHeight}px`,
  } as CSSProperties;

  return (
    <div
      className="editor-grid"
      style={layout}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        e.preventDefault();
        loadFile(file);
      }}
    >
      <Sidebar
        scene={scene}
        onSceneChange={changeScene}
        templateId={templateId}
        onLoadTemplate={loadTemplate}
        selectedId={selectedId}
        onSelect={setSelectedId}
        resolution={resolution}
        onResolutionChange={setResolution}
        collapsed={collapsed}
        onToggleSection={toggleSection}
        render={{
          canRender: Boolean(track),
          isUploading,
          isRendering,
          progress: renderProgress,
          error,
          renderedUrl,
        }}
        onRender={handleRender}
      />

      <ResizeHandle
        orientation="vertical"
        label="Resize settings panel"
        className="editor-handle editor-handle-v"
        value={sidebarWidth}
        min={SIDEBAR.min}
        max={SIDEBAR.max}
        defaultValue={SIDEBAR.default}
        onChange={setSidebarWidth}
      />

      <Preview
        key={`preview:${track?.url ?? "empty"}`}
        audioUrl={track?.url ?? null}
        durationInFrames={durationInFrames}
        fps={FPS}
        scene={scene}
        initiallyMuted={muted}
        isLoading={isLoadingTrack}
        onPlayer={setPlayer}
        onPickFile={loadFile}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onTransform={transformElement}
      />

      <ResizeHandle
        orientation="horizontal"
        label="Resize timeline"
        className="editor-handle editor-handle-h"
        value={transportHeight}
        min={TRANSPORT.min}
        max={TRANSPORT.max}
        defaultValue={TRANSPORT.default}
        onChange={setTransportHeight}
        invert
      />

      <Transport
        key={`transport:${track?.url ?? "empty"}`}
        player={track ? player : null}
        audioData={track?.audioData ?? null}
        fileName={track?.file.name ?? null}
        durationInFrames={durationInFrames}
        fps={FPS}
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
        onPickFile={loadFile}
      />
    </div>
  );
}

"use client";

import { getAudioData, type MediaUtilsAudioData } from "@remotion/media-utils";
import type { PlayerRef } from "@remotion/player";
import { useSession } from "next-auth/react";
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
import { sanitizeScene } from "../../remotion/scene/sanitize";
import {
  DEFAULT_TEMPLATE,
  TEMPLATES,
  cloneScene,
} from "../../remotion/scene/templates";
import {
  DEFAULT_ASPECT,
  DEFAULT_FRAME_RATE,
  DEFAULT_RESOLUTION,
  type AspectKey,
  type FrameRate,
  type ResolutionKey,
} from "../../remotion/types";
import { Preview } from "@/components/editor/Preview";
import {
  Sidebar,
  type CollapsedSections,
  type SaveStatus,
} from "@/components/editor/Sidebar";
import { Transport } from "@/components/editor/Transport";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { TIER_LIMITS, clampToTier, type TierName } from "@/lib/tiers";
import { useSceneHistory } from "@/lib/useSceneHistory";
import { useStoredState } from "@/lib/useStoredState";
import {
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeResolution,
} from "@/lib/visualizerSettings";

// The preview always runs at 60 frames per second: at 30 fast-moving
// particles look jerky on any modern screen, however idle the machine is.
// The export frame rate is chosen separately (see `frameRate` below).
const FPS = 60;
const SEEK_KEY_SECONDS = 5;
const DEFAULT_TITLE = "Untitled project";

const SIDEBAR = { min: 240, max: 520, default: 320 };
const TRANSPORT = { min: 88, max: 320, default: 132 };
const NO_COLLAPSED_SECTIONS: CollapsedSections = {};

type Track = {
  /** Shown in the transport bar. */
  name: string;
  /** The chosen file; null when the track came from a saved project. */
  file: File | null;
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

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return (data?.error as string | undefined) || fallback;
}

/**
 * The editor. `initialProjectId` opens a saved project, `initialTemplateId`
 * starts from a built-in template, `initialSceneId` from a saved (shared)
 * one; with none of them it starts from the default template.
 * Give it a `key` that changes with those, so switching projects starts
 * from a clean slate.
 */
export function Editor({
  initialProjectId = null,
  initialTemplateId = null,
  initialSceneId = null,
}: {
  initialProjectId?: string | null;
  initialTemplateId?: string | null;
  initialSceneId?: string | null;
}) {
  const startTemplate =
    TEMPLATES.find((t) => t.id === initialTemplateId) ?? DEFAULT_TEMPLATE;
  const { status: sessionStatus } = useSession();

  const [track, setTrack] = useState<Track | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(Boolean(initialProjectId));
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const history = useSceneHistory(() => cloneScene(startTemplate.scene));
  const { scene, change: recordScene, reset: resetScene } = history;
  // Which template the scene still equals; null as soon as it was edited.
  const [templateId, setTemplateId] = useState<string | null>(startTemplate.id);
  const [selectedId, setSelectedId] = useState<string | null>(
    startTemplate.focusElementId,
  );
  // What the user chose. What is actually used is lowered to what their
  // plan allows (see `resolution` / `frameRate` below), so a project saved
  // on Premium opens fine on the free plan and gets its settings back
  // after an upgrade.
  const [chosenResolution, setResolution] =
    useState<ResolutionKey>(DEFAULT_RESOLUTION);
  const [aspect, setAspect] = useState<AspectKey>(DEFAULT_ASPECT);
  const [chosenFrameRate, setFrameRate] = useState<FrameRate>(DEFAULT_FRAME_RATE);
  // The visitor's plan. Free until the server says otherwise.
  const [tier, setTier] = useState<TierName>("FREE");
  const { resolution, fps: frameRate } = clampToTier(
    tier,
    chosenResolution,
    chosenFrameRate,
  );

  useEffect(() => {
    if (sessionStatus === "loading") return;
    let isCancelled = false;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => {
        if (!isCancelled && me?.tier === "PREMIUM") setTier("PREMIUM");
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [sessionStatus]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved-project state.
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    initialProjectId ? "saved" : "unsaved",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // Storage key of the track once it is on the server (upload or saved project).
  const audioKeyRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);

  /** Decodes audio from a URL and makes it the current track. */
  const loadTrack = useCallback(
    async (source: { name: string; file: File | null; url: string }) => {
      const loadId = ++loadIdRef.current;
      setError(null);
      setRenderedUrl(null);
      setIsLoadingTrack(true);

      try {
        // Decoded once here; the preview's composition asks for the same URL
        // and gets this exact object from Remotion's cache, so the waveform
        // and the scenes share one audio analysis.
        const audioData = await getAudioData(source.url);
        if (loadId !== loadIdRef.current) return false;

        setTrack((previous) => {
          if (previous?.file) URL.revokeObjectURL(previous.url);
          return {
            ...source,
            audioData,
            durationInFrames: Math.max(
              1,
              Math.ceil(audioData.durationInSeconds * FPS),
            ),
          };
        });
        return true;
      } catch {
        if (source.file) URL.revokeObjectURL(source.url);
        if (loadId === loadIdRef.current) {
          setError("This file could not be read as audio.");
        }
        return false;
      } finally {
        if (loadId === loadIdRef.current) setIsLoadingTrack(false);
      }
    },
    [],
  );

  const loadFile = useCallback(
    async (file: File) => {
      audioKeyRef.current = null;
      const ok = await loadTrack({
        name: file.name,
        file,
        url: URL.createObjectURL(file),
      });
      if (ok) setSaveStatus("unsaved");
    },
    [loadTrack],
  );

  // Open a saved project: its scene, its settings and its track.
  useEffect(() => {
    if (!initialProjectId) return;
    let isCancelled = false;

    (async () => {
      const response = await fetch(`/api/projects/${initialProjectId}`);
      if (isCancelled) return;
      if (!response.ok) {
        setIsLoadingTrack(false);
        setProjectId(null);
        setSaveStatus("unsaved");
        setError(await readError(response, "This project could not be opened."));
        return;
      }

      const project = await response.json();
      if (isCancelled) return;
      const loadedScene = sanitizeScene(project.scene);
      resetScene(loadedScene);
      setTemplateId(null);
      setSelectedId(loadedScene.elements[0]?.id ?? null);
      setResolution(sanitizeResolution(project.resolution));
      setAspect(sanitizeAspect(project.aspect));
      setFrameRate(sanitizeFrameRate(project.fps));
      setTitle(project.title);
      audioKeyRef.current = project.audioKey;

      await loadTrack({
        name: project.audioName,
        file: null,
        url: `/api/files/${project.audioKey}`,
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialProjectId, loadTrack, resetScene]);

  // Start from a saved template somebody shared by link.
  useEffect(() => {
    if (!initialSceneId || initialProjectId) return;
    let isCancelled = false;

    (async () => {
      const response = await fetch(`/api/scenes/${initialSceneId}`);
      if (isCancelled) return;
      if (!response.ok) {
        setError(await readError(response, "This template could not be opened."));
        return;
      }
      const shared = await response.json();
      if (isCancelled) return;
      const loadedScene = sanitizeScene(shared.scene);
      resetScene(loadedScene);
      setTemplateId(null);
      setSelectedId(loadedScene.elements[0]?.id ?? null);
      setTitle(shared.title);
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialSceneId, initialProjectId, resetScene]);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const changeScene = useCallback(
    (next: SceneDocument) => {
      recordScene(next);
      setTemplateId(null);
      markUnsaved();
    },
    [markUnsaved, recordScene],
  );

  // Dragging the gizmo in the picture changes an element's transform.
  const transformElement = useCallback(
    (
      id: string,
      patch: Partial<Pick<SceneElement, "position" | "rotation" | "scale">>,
    ) => {
      recordScene((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === id ? { ...element, ...patch } : element,
        ),
      }));
      setTemplateId(null);
      markUnsaved();
    },
    [markUnsaved, recordScene],
  );

  const loadTemplate = useCallback(
    (id: string) => {
      const template = TEMPLATES.find((t) => t.id === id);
      if (!template) return;
      if (
        templateId === null &&
        !window.confirm(
          "Replace your current scene with this template? You can undo it.",
        )
      ) {
        return;
      }
      // A step of its own in the history: loading a template by mistake
      // can be undone.
      recordScene(cloneScene(template.scene), { merge: false });
      setTemplateId(template.id);
      setSelectedId(template.focusElementId);
      markUnsaved();
    },
    [templateId, markUnsaved, recordScene],
  );

  // Warn before edits are lost. An untouched template is not worth a
  // warning; an edited scene that is not saved is - whether or not the
  // visitor is logged in.
  const hasUnsavedEdits = saveStatus !== "saved" && templateId === null;
  useEffect(() => {
    if (!hasUnsavedEdits) return;

    // Closing the tab, reloading, typing another address.
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();

    // Links inside the app (projects page, log in, ...) change the page
    // without unloading it, so the browser's own warning never appears.
    // Caught on the document before the link's own handler runs.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (link.origin !== window.location.origin) return;
      if (window.confirm("Leave the editor? Your unsaved changes will be lost.")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [hasUnsavedEdits]);

  // One of the user's own templates replaces the scene (undoable).
  const loadScene = useCallback(
    (next: SceneDocument) => {
      if (
        templateId === null &&
        !window.confirm(
          "Replace your current scene with this template? You can undo it.",
        )
      ) {
        return;
      }
      const loadedScene = sanitizeScene(next);
      recordScene(loadedScene, { merge: false });
      setTemplateId(null);
      setSelectedId(loadedScene.elements[0]?.id ?? null);
      markUnsaved();
    },
    [templateId, markUnsaved, recordScene],
  );

  // Undo and redo. After either, the scene no longer equals a template.
  const { undo: undoScene, redo: redoScene, canUndo, canRedo } = history;
  const undo = useCallback(() => {
    undoScene();
    setTemplateId(null);
    markUnsaved();
  }, [undoScene, markUnsaved]);
  const redo = useCallback(() => {
    redoScene();
    setTemplateId(null);
    markUnsaved();
  }, [redoScene, markUnsaved]);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (Cmd on a Mac). Text fields keep their
  // own undo while the cursor is in them.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("textarea, [contenteditable=true]") ||
          (target instanceof HTMLInputElement &&
            !["range", "checkbox", "color", "file"].includes(target.type)))
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

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

  /** The track's storage key - uploading the file first if that has not happened yet. */
  const ensureAudioKey = useCallback(async () => {
    if (audioKeyRef.current) return audioKeyRef.current;
    if (!track?.file) throw new Error("Load a track first.");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", track.file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await readError(response, "Upload failed."));
      const data = await response.json();
      audioKeyRef.current = data.key as string;
      return audioKeyRef.current;
    } finally {
      setIsUploading(false);
    }
  }, [track]);

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
      const audioKey = await ensureAudioKey();

      setIsRendering(true);
      const renderResponse = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioKey,
          scene,
          resolution,
          aspect,
          fps: frameRate,
        }),
      });
      if (!renderResponse.ok) {
        throw new Error(await readError(renderResponse, "Render failed."));
      }

      const { jobId } = await renderResponse.json();
      const url = await pollJobStatus(jobId);
      setRenderedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsRendering(false);
    }
  }, [track, scene, resolution, aspect, frameRate, ensureAudioKey, pollJobStatus]);

  const handleSave = useCallback(async () => {
    if (!track) return;
    setSaveError(null);
    setSaveStatus("saving");

    try {
      const audioKey = await ensureAudioKey();
      const response = await fetch(
        projectId ? `/api/projects/${projectId}` : "/api/projects",
        {
          method: projectId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            audioKey,
            audioName: track.name,
            scene,
            resolution,
            aspect,
            fps: frameRate,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await readError(response, "Saving failed."));
      }

      const saved = await response.json();
      setTitle(saved.title);
      if (!projectId) {
        setProjectId(saved.id);
        // Reloading the page now reopens this project.
        window.history.replaceState(null, "", `/editor?project=${saved.id}`);
      }
      setSaveStatus("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Saving failed.");
      setSaveStatus("unsaved");
    }
  }, [track, projectId, title, scene, resolution, aspect, frameRate, ensureAudioKey]);

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
        project={{
          title,
          onTitleChange: (next) => {
            setTitle(next);
            markUnsaved();
          },
          isLoggedIn: sessionStatus === "authenticated",
          hasTrack: Boolean(track),
          status: saveStatus,
          error: saveError,
          onSave: handleSave,
        }}
        scene={scene}
        onSceneChange={changeScene}
        templateId={templateId}
        onLoadTemplate={loadTemplate}
        onLoadScene={loadScene}
        selectedId={selectedId}
        onSelect={setSelectedId}
        resolution={resolution}
        onResolutionChange={(next) => {
          setResolution(next);
          markUnsaved();
        }}
        aspect={aspect}
        onAspectChange={(next) => {
          setAspect(next);
          markUnsaved();
        }}
        tier={tier}
        frameRate={frameRate}
        onFrameRateChange={(next) => {
          setFrameRate(next);
          markUnsaved();
        }}
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
        aspect={aspect}
        watermark={TIER_LIMITS[tier].watermark}
        scene={scene}
        initiallyMuted={muted}
        isLoading={isLoadingTrack}
        onPlayer={setPlayer}
        onPickFile={loadFile}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onTransform={transformElement}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
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
        fileName={track?.name ?? null}
        durationInFrames={durationInFrames}
        fps={FPS}
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
        onPickFile={loadFile}
      />
    </div>
  );
}

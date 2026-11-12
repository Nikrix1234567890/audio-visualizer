"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  DEFAULT_TEMPO,
  LOOK_PARAMS,
  TEMPO_LIMITS,
  TRANSFORM_LIMITS,
  createElement,
  type Binding,
  type Bindings,
  type ElementType,
  type Keyframe,
  type ParamValue,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from "../../../remotion/scene/definitions";
import { withKeyframes } from "../../../remotion/scene/keyframes";
import {
  duplicateElement,
  moveElement,
  removeElement,
} from "../../../remotion/scene/sceneOps";
import {
  PALETTES,
  applyPalette,
  paletteGradient,
} from "../../../remotion/scene/palettes";
import { TEMPLATES } from "../../../remotion/scene/templates";
import {
  ASPECTS,
  FRAME_RATES,
  RESOLUTIONS,
  outputSize,
  type AspectKey,
  type FrameRate,
  type ResolutionKey,
} from "../../../remotion/types";
import { BindableSlider } from "@/components/editor/BindableSlider";
import { CameraMoves } from "@/components/editor/CameraMoves";
import { ElementList } from "@/components/editor/ElementList";
import { ExportLength } from "@/components/editor/ExportLength";
import { MyTemplates } from "@/components/editor/MyTemplates";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { ParamControls } from "@/components/editor/ParamControls";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { SliderRow } from "@/components/ui/SliderRow";
import {
  TIER_LIMITS,
  isFrameRateAllowed,
  isResolutionAllowed,
  type TierName,
} from "@/lib/tiers";
import type { ExportRange } from "@/lib/visualizerSettings";

export type CollapsedSections = Record<string, boolean>;

export type SaveStatus = "unsaved" | "saving" | "saved";

export type ProjectState = {
  title: string;
  onTitleChange: (title: string) => void;
  isLoggedIn: boolean;
  hasTrack: boolean;
  status: SaveStatus;
  error: string | null;
  onSave: () => void;
};

export type RenderState = {
  canRender: boolean;
  isUploading: boolean;
  isRendering: boolean;
  progress: number;
  /** Renders still ahead in the queue, or null once ours has started. */
  ahead: number | null;
  error: string | null;
  renderedUrl: string | null;
};

const AXES = ["X", "Y", "Z"] as const;

/** A copy of `bindings` with one target set, or removed when `binding` is null. */
function withBinding(
  bindings: Bindings,
  key: string,
  binding: Binding | null,
): Bindings {
  const next = { ...bindings };
  if (binding) next[key] = binding;
  else delete next[key];
  return next;
}

export function Sidebar({
  project,
  scene,
  onSceneChange,
  templateId,
  onLoadTemplate,
  onLoadScene,
  selectedId,
  onSelect,
  resolution,
  onResolutionChange,
  aspect,
  onAspectChange,
  tier,
  frameRate,
  exportRange,
  onExportRangeChange,
  trackSeconds,
  onFrameRateChange,
  collapsed,
  onToggleSection,
  render,
  onRender,
}: {
  project: ProjectState;
  scene: SceneDocument;
  onSceneChange: (scene: SceneDocument) => void;
  /** The template the scene still matches, or null once it was edited. */
  templateId: string | null;
  onLoadTemplate: (id: string) => void;
  /** Replaces the scene with one of the user's own templates. */
  onLoadScene: (scene: SceneDocument) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  resolution: ResolutionKey;
  onResolutionChange: (value: ResolutionKey) => void;
  aspect: AspectKey;
  onAspectChange: (value: AspectKey) => void;
  /** The visitor's plan: decides which output options are locked. */
  tier: TierName;
  frameRate: FrameRate;
  /** The section of the track to export, or null for all of it. */
  exportRange: ExportRange | null;
  onExportRangeChange: (range: ExportRange | null) => void;
  /** Length of the loaded track in seconds; 0 without one. */
  trackSeconds: number;
  onFrameRateChange: (value: FrameRate) => void;
  collapsed: CollapsedSections;
  onToggleSection: (id: string) => void;
  render: RenderState;
  onRender: () => void;
}) {
  const section = (id: string, label: string, children: ReactNode) => (
    <Section
      label={label}
      isCollapsed={Boolean(collapsed[id])}
      onToggle={() => onToggleSection(id)}
    >
      {children}
    </Section>
  );

  // Set when a locked output option was clicked: points at the upgrade.
  const [showUpgrade, setShowUpgrade] = useState(false);

  const selected = scene.elements.find((e) => e.id === selectedId) ?? null;

  const updateElement = (id: string, patch: Partial<SceneElement>) =>
    onSceneChange({
      ...scene,
      elements: scene.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });

  const addElement = (type: ElementType) => {
    const element = createElement(type);
    onSceneChange({ ...scene, elements: [...scene.elements, element] });
    onSelect(element.id);
  };

  /** A copy right below the original, selected so it can be moved away. */
  const duplicate = (id: string) => {
    const result = duplicateElement(scene, id);
    if (!result) return;
    onSceneChange(result.scene);
    onSelect(result.id);
  };

  const remove = (id: string) => {
    const result = removeElement(scene, id);
    onSceneChange(result.scene);
    if (id === selectedId) onSelect(result.nextId);
  };

  const isBusy = render.isUploading || render.isRendering;
  const percent = Math.round(render.progress * 100);

  return (
    <aside className="editor-area-side surface-texture flex min-h-0 flex-col bg-surface lg:overflow-y-auto">
      {section(
        "project",
        "Project",
        <>
          <input
            aria-label="Project title"
            value={project.title}
            maxLength={80}
            onChange={(e) => project.onTitleChange(e.target.value)}
            className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink shadow-scope-recessed outline-none focus:border-accent"
          />

          {project.isLoggedIn ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={project.onSave}
                  disabled={!project.hasTrack || project.status !== "unsaved"}
                  className="rounded-md border border-line bg-surface-raised px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-ink uppercase shadow-control-raised outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:text-ink"
                >
                  {project.status === "saving" ? "Saving…" : "Save"}
                </button>
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      project.status === "saved"
                        ? "bg-accent shadow-glow-active"
                        : "bg-accent-dim"
                    }`}
                  />
                  {project.status === "saved" ? "Saved" : "Not saved"}
                </span>
              </div>
              {!project.hasTrack && (
                <p className="text-xs text-muted">
                  Load a track to save - a project keeps its track.
                </p>
              )}
              <Link
                href="/dashboard"
                className="text-xs text-muted underline hover:text-accent"
              >
                All projects
              </Link>
            </>
          ) : (
            <p className="text-xs text-muted">
              <Link href="/login?callbackUrl=/editor" className="text-accent underline">
                Log in
              </Link>{" "}
              to save this project to your account. Logging in reloads the
              page, so do it before you start.
            </p>
          )}

          {project.error && (
            <p className="text-xs text-red-400">{project.error}</p>
          )}
        </>,
      )}

      {section(
        "template",
        "Template",
        <>
          <ul className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((template) => {
              const isActive = template.id === templateId;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onLoadTemplate(template.id)}
                    className={`group flex w-full flex-col overflow-hidden rounded-md border text-left outline-none transition-all focus-visible:border-accent ${
                      isActive
                        ? "border-accent-dim shadow-glow-active"
                        : "border-line hover:border-accent-dim"
                    }`}
                  >
                    <Thumbnail
                      src={`/thumbnails/templates/${template.id}.jpg`}
                      video={`/previews/${template.id}.mp4`}
                      dimmed={!isActive}
                    />
                    <span
                      className={`truncate px-2 py-1.5 font-mono text-[10px] tracking-[0.06em] uppercase ${
                        isActive ? "text-accent" : "text-muted group-hover:text-ink"
                      }`}
                    >
                      {template.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted">
            A template is a starting point. Add, remove and change its
            elements below.
          </p>
          {project.isLoggedIn && (
            <MyTemplates scene={scene} onLoad={onLoadScene} />
          )}
        </>,
      )}

      {section(
        "colours",
        "Colours",
        <>
          <ul className="grid grid-cols-4 gap-2">
            {PALETTES.map((palette) => (
              <li key={palette.id}>
                <button
                  type="button"
                  title={`Recolour the scene: ${palette.label}`}
                  onClick={() => onSceneChange(applyPalette(scene, palette))}
                  className="group flex w-full flex-col items-center gap-1 outline-none"
                >
                  <span
                    className="h-7 w-full rounded-md border border-line shadow-control-raised group-hover:border-accent-dim group-focus-visible:border-accent"
                    style={{ background: paletteGradient(palette) }}
                  />
                  <span className="font-mono text-[10px] tracking-[0.06em] text-muted uppercase group-hover:text-ink">
                    {palette.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Recolours every element at once. Fine-tune single elements below.
          </p>
        </>,
      )}

      {section(
        "elements",
        "Elements",
        <ElementList
          elements={scene.elements}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleVisible={(id) => {
            const element = scene.elements.find((e) => e.id === id);
            if (element) updateElement(id, { visible: !element.visible });
          }}
          onRemove={remove}
          onDuplicate={duplicate}
          onMove={(from, to) => onSceneChange(moveElement(scene, from, to))}
          onAdd={addElement}
        />,
      )}

      {selected &&
        section(
          "selected",
          `Selected: ${selected.name}`,
          <ElementInspector
            key={selected.id}
            element={selected}
            onChange={(patch) => updateElement(selected.id, patch)}
          />,
        )}

      {section(
        "camera",
        "Camera",
        <>
        <ParamControls
          defs={CAMERA_PARAMS}
          values={scene.camera}
          onChange={(key, value) =>
            onSceneChange({ ...scene, camera: { ...scene.camera, [key]: value } })
          }
          bindings={scene.cameraBindings}
          onBindingChange={(key, binding) =>
            onSceneChange({
              ...scene,
              cameraBindings: withBinding(scene.cameraBindings, key, binding),
            })
          }
          keyframes={scene.cameraKeyframes}
          onKeyframesChange={(key, keys, plain) =>
            onSceneChange({
              ...scene,
              cameraKeyframes: withKeyframes(scene.cameraKeyframes, key, keys),
              camera:
                plain === undefined ? scene.camera : { ...scene.camera, [key]: plain },
            })
          }
        />
        <CameraMoves scene={scene} onSceneChange={onSceneChange} />
        </>,
      )}

      {section(
        "look",
        "Look",
        <ParamControls
          defs={LOOK_PARAMS.filter(
            (def) => scene.look.fog || !def.key.startsWith("fog") || def.key === "fog",
          )}
          values={scene.look}
          onChange={(key, value) =>
            onSceneChange({ ...scene, look: { ...scene.look, [key]: value } })
          }
          bindings={scene.lookBindings}
          onBindingChange={(key, binding) =>
            onSceneChange({
              ...scene,
              lookBindings: withBinding(scene.lookBindings, key, binding),
            })
          }
          keyframes={scene.lookKeyframes}
          onKeyframesChange={(key, keys, plain) =>
            onSceneChange({
              ...scene,
              lookKeyframes: withKeyframes(scene.lookKeyframes, key, keys),
              look: plain === undefined ? scene.look : { ...scene.look, [key]: plain },
            })
          }
        />,
      )}

      {section(
        "output",
        "Output",
        <>
          <SegmentedSelector
            stretch
            options={Object.entries(ASPECTS).map(([key, a]) => ({
              value: key as AspectKey,
              label: a.label,
            }))}
            value={aspect}
            onChange={onAspectChange}
          />
          <SegmentedSelector
            stretch
            options={Object.entries(RESOLUTIONS).map(([key, r]) => ({
              value: key as ResolutionKey,
              label: r.label,
              locked: !isResolutionAllowed(tier, key as ResolutionKey),
            }))}
            value={resolution}
            onChange={onResolutionChange}
            onLocked={() => setShowUpgrade(true)}
          />
          <SegmentedSelector
            stretch
            options={FRAME_RATES.map((fps) => ({
              value: fps,
              label: `${fps} fps`,
              locked: !isFrameRateAllowed(tier, fps),
            }))}
            value={frameRate}
            onChange={onFrameRateChange}
            onLocked={() => setShowUpgrade(true)}
          />
          <ExportLength
            range={exportRange}
            duration={trackSeconds}
            onChange={onExportRangeChange}
          />
          <p className="font-mono text-[11px] tracking-[0.06em] text-muted tabular-nums">
            {outputSize(aspect, resolution).width} x{" "}
            {outputSize(aspect, resolution).height} px
          </p>
          {tier === "FREE" ? (
            <p
              className={`text-xs ${showUpgrade ? "text-ink" : "text-muted"}`}
            >
              Free plan: up to {TIER_LIMITS.FREE.maxResolution},{" "}
              {TIER_LIMITS.FREE.frameRates.join(" / ")} fps, with a small
              watermark.{" "}
              <Link href="/pricing" className="text-accent underline">
                Go Premium
              </Link>{" "}
              for 4K, 60 fps and no watermark.
            </p>
          ) : (
            <p className="text-xs text-muted">
              60 fps is as smooth as the preview; 30 fps renders in half the
              time.
            </p>
          )}

          <button
            type="button"
            onClick={onRender}
            disabled={!render.canRender || isBusy}
            className={`rounded-xl border border-line bg-surface-raised px-6 py-3 font-sans text-sm font-semibold tracking-wide shadow-control-raised transition-shadow hover:text-accent hover:shadow-glow-active disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-ink disabled:hover:shadow-control-raised ${
              render.isRendering ? "text-accent shadow-glow-active" : "text-ink"
            }`}
          >
            {render.isUploading ? (
              "UPLOADING…"
            ) : render.isRendering && render.ahead !== null ? (
              <span className="font-mono">
                {render.ahead > 0 ? `WAITING - ${render.ahead} AHEAD` : "STARTING…"}
              </span>
            ) : render.isRendering ? (
              <span className="font-mono">RENDERING {percent}%</span>
            ) : (
              "RENDER"
            )}
          </button>

          {render.isRendering && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full bg-accent shadow-glow-active transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {!render.canRender && (
            <p className="text-xs text-muted">Load a track to render.</p>
          )}
          {render.error && (
            <p className="text-xs text-red-400">{render.error}</p>
          )}
          {render.renderedUrl && (
            <a
              href={render.renderedUrl}
              download
              className="font-mono text-xs text-accent underline"
            >
              Download video
            </a>
          )}
        </>,
      )}
    </aside>
  );
}

/** Name, parameters and transform of the selected element. */
function ElementInspector({
  element,
  onChange,
}: {
  element: SceneElement;
  onChange: (patch: Partial<SceneElement>) => void;
}) {
  const def = ELEMENT_DEFS[element.type];

  const setAxis = (key: "position" | "rotation", axis: number, value: number) => {
    const next = [...element[key]] as Vec3;
    next[axis] = value;
    onChange({ [key]: next });
  };

  const setBinding = (key: string, binding: Binding | null) =>
    onChange({ bindings: withBinding(element.bindings, key, binding) });

  /** Sets a target's keyframes and, when the animation ends, its plain value. */
  const setKeyframes = (key: string, keys: Keyframe[] | null, plain?: number) => {
    const patch: Partial<SceneElement> = {
      keyframes: withKeyframes(element.keyframes, key, keys),
    };
    if (plain !== undefined) {
      const [name, axis] = key.split(".");
      if (name === "scale") patch.scale = plain;
      else if (name === "position" || name === "rotation") {
        const next = [...element[name]] as Vec3;
        next[Number(axis)] = plain;
        patch[name] = next;
      } else patch.params = { ...element.params, [key]: plain };
    }
    onChange(patch);
  };

  const tempo = element.tempo ?? DEFAULT_TEMPO;

  return (
    <>
      <label className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
          Name
        </span>
        <input
          value={element.name}
          maxLength={40}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={(e) => {
            if (!e.target.value.trim()) onChange({ name: def.label });
          }}
          className="min-w-0 flex-1 border-b border-line bg-transparent text-right text-sm text-ink outline-none focus:border-accent"
        />
      </label>

      <ParamControls
        defs={def.params}
        values={element.params}
        onChange={(key: string, value: ParamValue) =>
          onChange({ params: { ...element.params, [key]: value } })
        }
        bindings={element.bindings}
        onBindingChange={setBinding}
        keyframes={element.keyframes}
        onKeyframesChange={setKeyframes}
      />

      <SubHeading>Tempo</SubHeading>
      <SegmentedSelector
        stretch
        options={[
          { value: "wave" as const, label: "Wave" },
          { value: "beat" as const, label: "On the beat" },
        ]}
        value={tempo.mode}
        onChange={(mode) => onChange({ tempo: { ...tempo, mode } })}
      />
      <SliderRow
        label="Tempo swing"
        value={tempo.amount}
        {...TEMPO_LIMITS.amount}
        onChange={(amount) => onChange({ tempo: { ...tempo, amount } })}
      />
      {tempo.amount > 0 && tempo.mode === "wave" && (
        <SliderRow
          label="Swing length"
          value={tempo.period}
          {...TEMPO_LIMITS.period}
          unit="s"
          onChange={(period) => onChange({ tempo: { ...tempo, period } })}
        />
      )}
      <p className="text-xs text-muted">
        {tempo.mode === "beat"
          ? "The motion surges on every beat and falls into slow motion until the next."
          : "Lets the motion slow down and speed up again in a wave. At 1 it comes to a brief standstill."}
      </p>

      <SubHeading>Position</SubHeading>
      {AXES.map((axis, i) => (
        <BindableSlider
          key={`position-${axis}`}
          label={`Position ${axis}`}
          value={element.position[i]}
          {...TRANSFORM_LIMITS.position}
          onChange={(v) => setAxis("position", i, v)}
          binding={element.bindings[`position.${i}`]}
          onBindingChange={(b) => setBinding(`position.${i}`, b)}
          keyframes={element.keyframes?.[`position.${i}`]}
          onKeyframesChange={(keys, plain) => setKeyframes(`position.${i}`, keys, plain)}
        />
      ))}

      <SubHeading>Rotation</SubHeading>
      {AXES.map((axis, i) => (
        <BindableSlider
          key={`rotation-${axis}`}
          label={`Rotation ${axis}`}
          value={element.rotation[i]}
          {...TRANSFORM_LIMITS.rotation}
          unit="°"
          onChange={(v) => setAxis("rotation", i, v)}
          binding={element.bindings[`rotation.${i}`]}
          onBindingChange={(b) => setBinding(`rotation.${i}`, b)}
          keyframes={element.keyframes?.[`rotation.${i}`]}
          onKeyframesChange={(keys, plain) => setKeyframes(`rotation.${i}`, keys, plain)}
        />
      ))}

      <SubHeading>Size</SubHeading>
      <BindableSlider
        label="Scale"
        value={element.scale}
        {...TRANSFORM_LIMITS.scale}
        unit="x"
        onChange={(v) => onChange({ scale: v })}
        binding={element.bindings.scale}
        onBindingChange={(b) => setBinding("scale", b)}
        keyframes={element.keyframes?.scale}
        onKeyframesChange={(keys, plain) => setKeyframes("scale", keys, plain)}
      />
    </>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 border-t border-line pt-3 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
      {children}
    </div>
  );
}

function Section({
  label,
  isCollapsed,
  onToggle,
  children,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-mono text-[11px] tracking-[0.12em] text-muted uppercase outline-none hover:text-ink focus-visible:text-accent"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          aria-hidden
          className={`shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
        >
          <path d="M2 1l4 3-4 3z" fill="currentColor" />
        </svg>
        <span className="truncate">{label}</span>
      </button>
      {!isCollapsed && (
        <div className="flex flex-col gap-4 px-4 pb-5">{children}</div>
      )}
    </section>
  );
}

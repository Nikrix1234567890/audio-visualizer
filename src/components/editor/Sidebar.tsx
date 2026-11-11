"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  LOOK_PARAMS,
  MAX_ELEMENTS,
  TRANSFORM_LIMITS,
  createElement,
  createElementId,
  type Binding,
  type Bindings,
  type ElementType,
  type ParamValue,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from "../../../remotion/scene/definitions";
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
import { ElementList } from "@/components/editor/ElementList";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { ParamControls } from "@/components/editor/ParamControls";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";

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
  selectedId,
  onSelect,
  resolution,
  onResolutionChange,
  aspect,
  onAspectChange,
  frameRate,
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
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  resolution: ResolutionKey;
  onResolutionChange: (value: ResolutionKey) => void;
  aspect: AspectKey;
  onAspectChange: (value: AspectKey) => void;
  frameRate: FrameRate;
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
  const duplicateElement = (id: string) => {
    const index = scene.elements.findIndex((e) => e.id === id);
    if (index < 0 || scene.elements.length >= MAX_ELEMENTS) return;
    const original = scene.elements[index];
    const copy: SceneElement = {
      ...original,
      id: createElementId(),
      name: `${original.name} copy`.slice(0, 40),
      position: [...original.position],
      rotation: [...original.rotation],
      params: { ...original.params },
      bindings: { ...original.bindings },
    };
    const elements = [...scene.elements];
    elements.splice(index + 1, 0, copy);
    onSceneChange({ ...scene, elements });
    onSelect(copy.id);
  };

  const moveElement = (from: number, to: number) => {
    if (from === to) return;
    const elements = [...scene.elements];
    const [moved] = elements.splice(from, 1);
    elements.splice(to, 0, moved);
    onSceneChange({ ...scene, elements });
  };

  const removeElement = (id: string) => {
    const remaining = scene.elements.filter((e) => e.id !== id);
    onSceneChange({ ...scene, elements: remaining });
    if (id === selectedId) onSelect(remaining[0]?.id ?? null);
  };

  const isBusy = render.isUploading || render.isRendering;
  const percent = Math.round(render.progress * 100);

  return (
    <aside className="editor-area-side chassis-grain flex min-h-0 flex-col bg-panel lg:overflow-y-auto">
      {section(
        "project",
        "Project",
        <>
          <input
            aria-label="Project title"
            value={project.title}
            maxLength={80}
            onChange={(e) => project.onTitleChange(e.target.value)}
            className="rounded-md border border-hairline bg-chassis px-2.5 py-1.5 text-sm text-cream shadow-scope-recessed outline-none focus:border-amber"
          />

          {project.isLoggedIn ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={project.onSave}
                  disabled={!project.hasTrack || project.status !== "unsaved"}
                  className="rounded-md border border-hairline bg-panel-raised px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-cream uppercase shadow-control-raised outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-hairline disabled:hover:text-cream"
                >
                  {project.status === "saving" ? "Saving…" : "Save"}
                </button>
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-steel uppercase">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      project.status === "saved"
                        ? "bg-amber shadow-glow-active"
                        : "bg-amber-dim"
                    }`}
                  />
                  {project.status === "saved" ? "Saved" : "Not saved"}
                </span>
              </div>
              {!project.hasTrack && (
                <p className="text-xs text-steel">
                  Load a track to save - a project keeps its track.
                </p>
              )}
              <Link
                href="/dashboard"
                className="text-xs text-steel underline hover:text-amber"
              >
                All projects
              </Link>
            </>
          ) : (
            <p className="text-xs text-steel">
              <Link href="/login?callbackUrl=/" className="text-amber underline">
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
                    className={`group flex w-full flex-col overflow-hidden rounded-md border text-left outline-none transition-all focus-visible:border-amber ${
                      isActive
                        ? "border-amber-dim shadow-glow-active"
                        : "border-hairline hover:border-amber-dim"
                    }`}
                  >
                    <Thumbnail
                      src={`/thumbnails/templates/${template.id}.jpg`}
                      dimmed={!isActive}
                    />
                    <span
                      className={`truncate px-2 py-1.5 font-mono text-[10px] tracking-[0.06em] uppercase ${
                        isActive ? "text-amber" : "text-steel group-hover:text-cream"
                      }`}
                    >
                      {template.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-steel">
            A template is a starting point. Add, remove and change its
            elements below.
          </p>
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
                    className="h-7 w-full rounded-md border border-hairline shadow-control-raised group-hover:border-amber-dim group-focus-visible:border-amber"
                    style={{ background: paletteGradient(palette) }}
                  />
                  <span className="font-mono text-[10px] tracking-[0.06em] text-steel uppercase group-hover:text-cream">
                    {palette.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-steel">
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
          onRemove={removeElement}
          onDuplicate={duplicateElement}
          onMove={moveElement}
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
        />,
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
            }))}
            value={resolution}
            onChange={onResolutionChange}
          />
          <SegmentedSelector
            stretch
            options={FRAME_RATES.map((fps) => ({ value: fps, label: `${fps} fps` }))}
            value={frameRate}
            onChange={onFrameRateChange}
          />
          <p className="font-mono text-[11px] tracking-[0.06em] text-steel tabular-nums">
            {outputSize(aspect, resolution).width} x{" "}
            {outputSize(aspect, resolution).height} px
          </p>
          <p className="text-xs text-steel">
            60 fps is as smooth as the preview; 30 fps renders in half the time.
          </p>

          <button
            type="button"
            onClick={onRender}
            disabled={!render.canRender || isBusy}
            className={`rounded-xl border border-hairline bg-panel-raised px-6 py-3 font-sans text-sm font-semibold tracking-wide shadow-control-raised transition-shadow hover:text-amber hover:shadow-glow-active disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-cream disabled:hover:shadow-control-raised ${
              render.isRendering ? "text-amber shadow-glow-active" : "text-cream"
            }`}
          >
            {render.isUploading ? (
              "UPLOADING…"
            ) : render.isRendering ? (
              <span className="font-mono">RENDERING {percent}%</span>
            ) : (
              "RENDER"
            )}
          </button>

          {render.isRendering && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-chassis">
              <div
                className="h-full bg-amber shadow-glow-active transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {!render.canRender && (
            <p className="text-xs text-steel">Load a track to render.</p>
          )}
          {render.error && (
            <p className="text-xs text-red-400">{render.error}</p>
          )}
          {render.renderedUrl && (
            <a
              href={render.renderedUrl}
              download
              className="font-mono text-xs text-amber underline"
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

  return (
    <>
      <label className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
          Name
        </span>
        <input
          value={element.name}
          maxLength={40}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={(e) => {
            if (!e.target.value.trim()) onChange({ name: def.label });
          }}
          className="min-w-0 flex-1 border-b border-hairline bg-transparent text-right text-sm text-cream outline-none focus:border-amber"
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
      />

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
      />
    </>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 border-t border-hairline pt-3 font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
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
    <section className="border-b border-hairline">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-mono text-[11px] tracking-[0.12em] text-steel uppercase outline-none hover:text-cream focus-visible:text-amber"
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

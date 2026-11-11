"use client";

import type { ReactNode } from "react";
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  LOOK_PARAMS,
  TRANSFORM_LIMITS,
  createElement,
  type Binding,
  type Bindings,
  type ElementType,
  type ParamValue,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from "../../../remotion/scene/definitions";
import { TEMPLATES } from "../../../remotion/scene/templates";
import { RESOLUTIONS, type ResolutionKey } from "../../../remotion/types";
import { BindableSlider } from "@/components/editor/BindableSlider";
import { ElementList } from "@/components/editor/ElementList";
import { ParamControls } from "@/components/editor/ParamControls";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";

export type CollapsedSections = Record<string, boolean>;

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
  scene,
  onSceneChange,
  templateId,
  onLoadTemplate,
  selectedId,
  onSelect,
  resolution,
  onResolutionChange,
  collapsed,
  onToggleSection,
  render,
  onRender,
}: {
  scene: SceneDocument;
  onSceneChange: (scene: SceneDocument) => void;
  /** The template the scene still matches, or null once it was edited. */
  templateId: string | null;
  onLoadTemplate: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  resolution: ResolutionKey;
  onResolutionChange: (value: ResolutionKey) => void;
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
        "template",
        "Template",
        <>
          <SegmentedSelector
            stretch
            options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
            value={templateId ?? ""}
            onChange={onLoadTemplate}
          />
          <p className="text-xs text-steel">
            A template is a starting point. Add, remove and change its
            elements below.
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
            options={Object.entries(RESOLUTIONS).map(([key, r]) => ({
              value: key as ResolutionKey,
              label: r.label,
            }))}
            value={resolution}
            onChange={onResolutionChange}
          />

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

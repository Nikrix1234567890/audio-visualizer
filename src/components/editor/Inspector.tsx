"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  CAMERA_PARAMS,
  DEFAULT_TEMPO,
  ELEMENT_DEFS,
  LOOK_PARAMS,
  TEMPO_LIMITS,
  TRANSFORM_LIMITS,
  type Binding,
  type Bindings,
  type Keyframe,
  type ParamValue,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from "../../../remotion/scene/definitions";
import { withKeyframes } from "../../../remotion/scene/keyframes";
import { duplicateElement, moveElement, removeElement } from "../../../remotion/scene/sceneOps";
import { BindableSlider } from "@/components/editor/BindableSlider";
import { CameraMoves } from "@/components/editor/CameraMoves";
import { ElementList } from "@/components/editor/ElementList";
import { ParamControls } from "@/components/editor/ParamControls";
import { Section } from "@/components/ui/Section";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { SliderRow } from "@/components/ui/SliderRow";

export type InspectorTab = "element" | "camera" | "look";
export type CollapsedSections = Record<string, boolean>;

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "element", label: "Element" },
  { id: "camera", label: "Camera" },
  { id: "look", label: "Look" },
];

const AXES = ["X", "Y", "Z"] as const;

/** A copy of `bindings` with one target set, or removed when `binding` is null. */
function withBinding(bindings: Bindings, key: string, binding: Binding | null): Bindings {
  const next = { ...bindings };
  if (binding) next[key] = binding;
  else delete next[key];
  return next;
}

/**
 * The right side of the editor: what is in the scene, and the settings of
 * what is selected - the element, the camera or the look.
 */
export function Inspector({
  scene,
  onSceneChange,
  selectedId,
  onSelect,
  tab,
  onTab,
  collapsed,
  onToggleSection,
  onAddClick,
}: {
  scene: SceneDocument;
  onSceneChange: (scene: SceneDocument) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  collapsed: CollapsedSections;
  onToggleSection: (id: string) => void;
  /** Opens the library's element catalogue. */
  onAddClick: () => void;
}) {
  const selected = scene.elements.find((e) => e.id === selectedId) ?? null;

  const updateElement = (id: string, patch: Partial<SceneElement>) =>
    onSceneChange({
      ...scene,
      elements: scene.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });

  const section = (id: string, label: string, children: ReactNode) => (
    <Section
      label={label}
      isCollapsed={Boolean(collapsed[id])}
      onToggle={() => onToggleSection(id)}
    >
      {children}
    </Section>
  );

  return (
    <aside className="ed__insp" aria-label="Scene and settings">
      <div className="ed__insphead">
        Scene
        <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" onClick={onAddClick}>
          <Plus className="pf-i pf-i--sm" aria-hidden />
          Add
        </button>
      </div>
      <div className="ed__layers">
        <ElementList
          elements={scene.elements}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleVisible={(id) => {
            const element = scene.elements.find((e) => e.id === id);
            if (element) updateElement(id, { visible: !element.visible });
          }}
          onRemove={(id) => {
            const result = removeElement(scene, id);
            onSceneChange(result.scene);
            if (id === selectedId) onSelect(result.nextId);
          }}
          onDuplicate={(id) => {
            // A copy right below the original, selected so it can be moved away.
            const result = duplicateElement(scene, id);
            if (!result) return;
            onSceneChange(result.scene);
            onSelect(result.id);
          }}
          onMove={(from, to) => onSceneChange(moveElement(scene, from, to))}
        />
      </div>

      <div className="pf-tabs pf-tabs--motion border-t border-line-1" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="pf-tab"
            aria-selected={tab === id}
            onClick={() => onTab(id)}
          >
            {label}
            {tab === id && (
              <motion.span
                layoutId="inspector-tab"
                className="pf-tab__line"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="ed__scroll" role="tabpanel">
        {tab === "element" &&
          (selected ? (
            <ElementInspector
              key={selected.id}
              element={selected}
              onChange={(patch) => updateElement(selected.id, patch)}
              section={section}
            />
          ) : (
            <div className="pf-empty">
              <span className="pf-empty__title">Nothing selected</span>
              <span>Select an element in the picture or the list to change it.</span>
            </div>
          ))}

        {tab === "camera" && (
          <>
            {section(
              "camera",
              "Position and motion",
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
              />,
            )}
            {section(
              "cameraMoves",
              "Moves at the playhead",
              <CameraMoves scene={scene} onSceneChange={onSceneChange} />,
            )}
          </>
        )}

        {tab === "look" &&
          section(
            "look",
            "Light and atmosphere",
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
      </div>
    </aside>
  );
}

/** Name, parameters, tempo and transform of the selected element. */
function ElementInspector({
  element,
  onChange,
  section,
}: {
  element: SceneElement;
  onChange: (patch: Partial<SceneElement>) => void;
  section: (id: string, label: string, children: ReactNode) => ReactNode;
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
      {section(
        "element",
        def.label,
        <>
          <label className="pf-inlinefield">
            <span className="pf-rowlabel">Name</span>
            <input
              value={element.name}
              maxLength={40}
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim()) onChange({ name: def.label });
              }}
              className="pf-input"
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
        </>,
      )}

      {section(
        "transform",
        "Position, rotation, size",
        <>
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
        </>,
      )}

      {section(
        "tempo",
        "Tempo",
        <>
          <SegmentedSelector
            stretch
            label="Tempo swing"
            options={[
              { value: "wave" as const, label: "Wave" },
              { value: "beat" as const, label: "On the beat" },
            ]}
            value={tempo.mode}
            onChange={(mode) => onChange({ tempo: { ...tempo, mode } })}
          />
          <SliderRow
            label="Swing"
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
          <p className="pf-note">
            {tempo.mode === "beat"
              ? "The motion surges on every beat and falls into slow motion until the next."
              : "The motion slows down and speeds up again in a wave. At 1 it comes to a brief standstill."}
          </p>
        </>,
      )}
    </>
  );
}

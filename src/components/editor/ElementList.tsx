"use client";

import { Box, Copy, Eye, EyeOff, GripVertical, Image as ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  ELEMENT_DEFS,
  MAX_ELEMENTS,
  type ElementType,
  type SceneElement,
} from "../../../remotion/scene/definitions";
import { signalName } from "@/components/editor/BindableSlider";

/** Elements that show the user's own file - there is no stock picture of them. */
export const FILE_ELEMENTS: ElementType[] = ["image", "model"];

/** The signals that drive an element, each once, in a fixed order. */
function signalsOf(element: SceneElement): string[] {
  const used = new Set(Object.values(element.bindings).map((b) => signalName(b.source)));
  return ["bass", "mid", "high", "level", "beat"].filter((name) => used.has(name));
}

/**
 * Everything in the scene, one row per element: a picture of it, its name,
 * a dot for every signal that drives it, and - on hover - duplicate, remove
 * and show/hide. Click a row to select it, drag it to change the order.
 */
export function ElementList({
  elements,
  selectedId,
  onSelect,
  onToggleVisible,
  onRemove,
  onDuplicate,
  onMove,
}: {
  elements: SceneElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  /** Moves the element at index `from` to index `to`. */
  onMove: (from: number, to: number) => void;
}) {
  // Row being dragged and the row it is currently held over.
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const isFull = elements.length >= MAX_ELEMENTS;

  if (elements.length === 0) {
    return (
      <div className="pf-empty py-5">
        <span className="pf-empty__title">An empty stage</span>
        <span>Add an element from the library, or start from a template.</span>
      </div>
    );
  }

  return (
    <ul className="pf-layers" aria-label="Elements of the scene">
      {elements.map((element, index) => {
        const isSelected = element.id === selectedId;
        const isDropTarget = dragFrom !== null && dragOver === index && dragFrom !== index;
        const def = ELEMENT_DEFS[element.type];
        return (
          <li
            key={element.id}
            draggable
            data-selected={isSelected || undefined}
            data-hidden={!element.visible || undefined}
            data-drop={isDropTarget || undefined}
            data-dragging={dragFrom === index || undefined}
            className="pf-layer"
            onDragStart={(e) => {
              // Firefox only starts a drag that carries some data.
              e.dataTransfer.setData("text/plain", element.name);
              e.dataTransfer.effectAllowed = "move";
              setDragFrom(index);
            }}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOver(index);
            }}
            onDrop={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.stopPropagation();
              onMove(dragFrom, index);
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setDragOver(null);
            }}
          >
            <span className="pf-layer__grip" aria-hidden>
              <GripVertical className="pf-i pf-i--sm" />
            </span>
            <button
              type="button"
              onClick={() => onSelect(element.id)}
              aria-pressed={isSelected}
              className="pf-layer__pick"
            >
              {FILE_ELEMENTS.includes(element.type) ? (
                <span className="pf-layer__thumb pf-layer__thumb--icon">
                  {element.type === "image" ? (
                    <ImageIcon className="pf-i pf-i--sm" aria-hidden />
                  ) : (
                    <Box className="pf-i pf-i--sm" aria-hidden />
                  )}
                </span>
              ) : (
                <span
                  className="pf-layer__thumb"
                  style={{ backgroundImage: `url(/thumbnails/elements/${element.type}.jpg)` }}
                />
              )}
              <span className="pf-layer__name">{element.name}</span>
              {element.name !== def.label && (
                <span className="pf-layer__type">{def.label}</span>
              )}
            </button>
            <span className="pf-layer__sigs">
              {signalsOf(element).map((name) => (
                <span key={name} className="pf-dot" data-sig={name} title={`Reacts to ${name}`} />
              ))}
            </span>
            <button
              type="button"
              className="pf-layer__btn pf-layer__btn--hover"
              aria-label={`Duplicate ${element.name}`}
              title="Duplicate"
              disabled={isFull}
              onClick={() => onDuplicate(element.id)}
            >
              <Copy className="pf-i" aria-hidden />
            </button>
            <button
              type="button"
              className="pf-layer__btn pf-layer__btn--hover"
              aria-label={`Remove ${element.name}`}
              title="Remove"
              onClick={() => onRemove(element.id)}
            >
              <Trash2 className="pf-i" aria-hidden />
            </button>
            <button
              type="button"
              className="pf-layer__btn"
              aria-label={element.visible ? `Hide ${element.name}` : `Show ${element.name}`}
              title={element.visible ? "Hide" : "Show"}
              onClick={() => onToggleVisible(element.id)}
            >
              {element.visible ? (
                <Eye className="pf-i" aria-hidden />
              ) : (
                <EyeOff className="pf-i" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

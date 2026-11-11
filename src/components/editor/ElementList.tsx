"use client";

import { useState } from "react";
import {
  ELEMENT_DEFS,
  ELEMENT_TYPES,
  MAX_ELEMENTS,
  type ElementType,
  type SceneElement,
} from "../../../remotion/scene/definitions";
import { Thumbnail } from "@/components/ui/Thumbnail";

/** Elements that show the user's own file - there is no stock picture of them. */
const FILE_ELEMENTS: ElementType[] = ["image", "model"];

/**
 * Everything in the scene, one row per element: click to select, the eye
 * hides or shows it, the cross removes it. "Add element" opens the catalogue
 * of element types.
 */
export function ElementList({
  elements,
  selectedId,
  onSelect,
  onToggleVisible,
  onRemove,
  onAdd,
}: {
  elements: SceneElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (type: ElementType) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const isFull = elements.length >= MAX_ELEMENTS;

  return (
    <div className="flex flex-col gap-2">
      {elements.length === 0 && (
        <p className="text-xs text-steel">
          The scene is empty. Add an element to get started.
        </p>
      )}

      <ul className="flex flex-col gap-1">
        {elements.map((element) => {
          const isSelected = element.id === selectedId;
          return (
            <li
              key={element.id}
              className={`flex items-center rounded-md border ${
                isSelected
                  ? "border-amber-dim bg-panel-raised"
                  : "border-transparent hover:border-hairline"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(element.id)}
                aria-pressed={isSelected}
                className="flex min-w-0 flex-1 items-baseline gap-2 px-2.5 py-2 text-left outline-none focus-visible:text-amber"
              >
                <span
                  className={`truncate text-sm ${
                    isSelected ? "text-amber" : "text-cream"
                  } ${element.visible ? "" : "opacity-40"}`}
                >
                  {element.name}
                </span>
                {element.name !== ELEMENT_DEFS[element.type].label && (
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.06em] text-steel uppercase">
                    {ELEMENT_DEFS[element.type].label}
                  </span>
                )}
              </button>

              <IconButton
                label={element.visible ? `Hide ${element.name}` : `Show ${element.name}`}
                onClick={() => onToggleVisible(element.id)}
                active={element.visible}
              >
                {element.visible ? (
                  <>
                    <path
                      d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                  </>
                ) : (
                  <path
                    d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM3 13L13 3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                )}
              </IconButton>

              <IconButton
                label={`Remove ${element.name}`}
                onClick={() => onRemove(element.id)}
              >
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </IconButton>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={isFull}
        aria-expanded={isAdding}
        onClick={() => setIsAdding(!isAdding)}
        className={`rounded-md border border-dashed px-3 py-2 font-mono text-[11px] tracking-[0.08em] uppercase outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:cursor-not-allowed disabled:opacity-40 ${
          isAdding ? "border-amber-dim text-amber" : "border-hairline text-steel"
        }`}
      >
        {isFull ? `Limit of ${MAX_ELEMENTS} elements reached` : "+ Add element"}
      </button>

      {isAdding && !isFull && (
        <ul className="grid grid-cols-2 gap-2">
          {ELEMENT_TYPES.map((type) => {
            const def = ELEMENT_DEFS[type];
            return (
              <li key={type}>
                <button
                  type="button"
                  title={def.description}
                  onClick={() => {
                    onAdd(type);
                    setIsAdding(false);
                  }}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-hairline bg-chassis text-left outline-none hover:border-amber-dim focus-visible:border-amber"
                >
                  {FILE_ELEMENTS.includes(type) ? (
                    <span className="flex aspect-video w-full items-center justify-center bg-panel font-mono text-[10px] tracking-[0.08em] text-steel uppercase">
                      Your file
                    </span>
                  ) : (
                    <Thumbnail src={`/thumbnails/elements/${type}.jpg`} dimmed />
                  )}
                  <span className="truncate px-2 pt-1.5 text-xs text-cream group-hover:text-amber">
                    {def.label}
                  </span>
                  <span className="mx-2 mb-1.5 line-clamp-2 text-[11px] leading-snug text-steel">
                    {def.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md outline-none hover:text-amber focus-visible:text-amber ${
        active ? "text-cream" : "text-steel"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

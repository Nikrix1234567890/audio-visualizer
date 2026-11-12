"use client";

import {
  Box,
  CircleHelp,
  Droplet,
  Image as ImageIcon,
  LayoutGrid,
  Plus,
  Search,
  Type,
} from "lucide-react";
import { useState } from "react";
import {
  ELEMENT_DEFS,
  ELEMENT_TYPES,
  MAX_ELEMENTS,
  type ElementType,
  type SceneDocument,
} from "../../../remotion/scene/definitions";
import { PALETTES, applyPalette, paletteGradient } from "../../../remotion/scene/palettes";
import { TEMPLATES } from "../../../remotion/scene/templates";
import { FILE_ELEMENTS } from "@/components/editor/ElementList";
import { MyTemplates } from "@/components/editor/MyTemplates";
import { Thumbnail } from "@/components/ui/Thumbnail";

export type LibraryTab = "templates" | "elements" | "media" | "text" | "palettes";

const TABS: { id: LibraryTab; label: string; icon: typeof Box }[] = [
  { id: "templates", label: "Templates", icon: LayoutGrid },
  { id: "elements", label: "Elements", icon: Box },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "palettes", label: "Palettes", icon: Droplet },
];

/** Elements that carry words; they live under "Text". */
const TEXT_ELEMENTS: ElementType[] = ["text", "trackTitle", "lyrics"];
const SHAPE_ELEMENTS = ELEMENT_TYPES.filter(
  (type) => !FILE_ELEMENTS.includes(type) && !TEXT_ELEMENTS.includes(type),
);

/** The icon rail on the left edge: it chooses what the library panel shows. */
export function LibraryRail({
  tab,
  onTab,
  onHelp,
}: {
  /** The open panel, or null while the library is closed. */
  tab: LibraryTab | null;
  onTab: (tab: LibraryTab | null) => void;
  onHelp: () => void;
}) {
  return (
    <nav className="pf-rail ed__rail" aria-label="Library">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="pf-rail__item"
          aria-pressed={tab === id}
          // Clicking the open one closes the panel and gives the stage the room.
          onClick={() => onTab(tab === id ? null : id)}
        >
          <Icon className="pf-i" aria-hidden />
          {label}
        </button>
      ))}
      <span className="pf-rail__spacer" />
      <button type="button" className="pf-rail__item" onClick={onHelp} title="Keyboard shortcuts (?)">
        <CircleHelp className="pf-i" aria-hidden />
        Help
      </button>
    </nav>
  );
}

/** What you can add to the scene: templates, elements, your files, text, palettes. */
export function LibraryPanel({
  tab,
  scene,
  templateId,
  isLoggedIn,
  onLoadTemplate,
  onLoadScene,
  onSceneChange,
  onAdd,
}: {
  tab: LibraryTab;
  scene: SceneDocument;
  /** The template the scene still matches, or null once it was edited. */
  templateId: string | null;
  isLoggedIn: boolean;
  onLoadTemplate: (id: string) => void;
  /** Replaces the scene with one of the user's own templates. */
  onLoadScene: (scene: SceneDocument) => void;
  onSceneChange: (scene: SceneDocument) => void;
  onAdd: (type: ElementType) => void;
}) {
  const [query, setQuery] = useState("");
  const isFull = scene.elements.length >= MAX_ELEMENTS;
  const matches = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase());

  const tile = (type: ElementType) => {
    const def = ELEMENT_DEFS[type];
    return (
      <button
        key={type}
        type="button"
        className="pf-ecard group"
        title={def.description}
        disabled={isFull}
        onClick={() => onAdd(type)}
      >
        <span className="pf-ecard__media">
          <Thumbnail src={`/thumbnails/elements/${type}.jpg`} />
        </span>
        <span className="pf-ecard__name">{def.label}</span>
        <span className="pf-ecard__add" aria-hidden>
          <Plus className="pf-i pf-i--sm" />
        </span>
      </button>
    );
  };

  const search = (placeholder: string) => (
    <label className="pf-inputwrap">
      <Search className="pf-i" aria-hidden />
      <input
        className="pf-input"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </label>
  );

  const limit = isFull && (
    <p className="pf-note">The scene holds {MAX_ELEMENTS} elements at most. Remove one to add another.</p>
  );

  if (tab === "templates") {
    const shown = TEMPLATES.filter((template) => matches(template.label));
    return (
      <>
        <div className="ed__libhead">
          Templates<span className="pf-tab__count">{TEMPLATES.length}</span>
        </div>
        <div className="ed__libbody">
          {search("Search templates")}
          <div className="ed__cards">
            {shown.map((template) => (
              <button
                key={template.id}
                type="button"
                className="pf-tcard pf-tcard--compact group"
                aria-current={template.id === templateId}
                onClick={() => onLoadTemplate(template.id)}
              >
                <Thumbnail
                  src={`/thumbnails/templates/${template.id}.jpg`}
                  video={`/previews/${template.id}.mp4`}
                />
                <span className="pf-tcard__body">
                  <span className="pf-tcard__name truncate">{template.label}</span>
                </span>
              </button>
            ))}
          </div>
          {shown.length === 0 && <p className="pf-note">No template is called that.</p>}
          <p className="pf-note">
            A template is a starting point. Add, remove and change its elements.
          </p>
          {isLoggedIn && <MyTemplates scene={scene} onLoad={onLoadScene} />}
        </div>
      </>
    );
  }

  if (tab === "elements") {
    const shown = SHAPE_ELEMENTS.filter(
      (type) => matches(ELEMENT_DEFS[type].label) || matches(ELEMENT_DEFS[type].description),
    );
    return (
      <>
        <div className="ed__libhead">
          Elements<span className="pf-tab__count">{SHAPE_ELEMENTS.length}</span>
        </div>
        <div className="ed__libbody">
          {search("Ring, tunnel, stars")}
          {limit}
          <div className="ed__tiles">{shown.map(tile)}</div>
          {shown.length === 0 && <p className="pf-note">No element matches that.</p>}
        </div>
      </>
    );
  }

  if (tab === "media") {
    return (
      <>
        <div className="ed__libhead">Media</div>
        <div className="ed__libbody">
          {limit}
          <button
            type="button"
            className="pf-drop pf-drop--inline"
            disabled={isFull}
            onClick={() => onAdd("image")}
          >
            <span className="pf-drop__icon">
              <ImageIcon className="pf-i" aria-hidden />
            </span>
            <span className="pf-stack gap-0.5">
              <span className="text-[13px] font-medium text-ink-1">Add a picture</span>
              <span className="pf-drop__hint">Your logo or cover art. PNG, JPG or WebP, up to 10 MB.</span>
            </span>
          </button>
          <button
            type="button"
            className="pf-drop pf-drop--inline"
            disabled={isFull}
            onClick={() => onAdd("model")}
          >
            <span className="pf-drop__icon">
              <Box className="pf-i" aria-hidden />
            </span>
            <span className="pf-stack gap-0.5">
              <span className="text-[13px] font-medium text-ink-1">Add a 3D model</span>
              <span className="pf-drop__hint">A .glb file, up to 50 MB.</span>
            </span>
          </button>
          <p className="pf-note">
            Adding one puts it into the scene; choose the file on the right, under Element.
          </p>
        </div>
      </>
    );
  }

  if (tab === "text") {
    return (
      <>
        <div className="ed__libhead">Text</div>
        <div className="ed__libbody">
          {limit}
          <div className="ed__tiles">{TEXT_ELEMENTS.map(tile)}</div>
          <p className="pf-note">
            Text is a line you type. Track title shows the name of your track. Lyrics shows timed
            lines that fade in and out.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ed__libhead">Palettes</div>
      <div className="ed__libbody">
        <p className="pf-note">One click recolours every element. Fine-tune single elements on the right.</p>
        <div className="pf-palettes" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className="pf-palette"
              title={`Recolour the scene: ${palette.label}`}
              onClick={() => onSceneChange(applyPalette(scene, palette))}
            >
              <span className="pf-palette__bar" style={{ background: paletteGradient(palette) }} />
              {palette.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

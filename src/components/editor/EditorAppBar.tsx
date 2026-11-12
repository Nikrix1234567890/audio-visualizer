"use client";

import { Check, Download, Redo2, Save, Undo2 } from "lucide-react";
import Link from "next/link";
import type { AspectKey } from "../../../remotion/types";
import { ASPECTS } from "../../../remotion/types";
import { Wordmark } from "@/components/Wordmark";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import type { TierName } from "@/lib/tiers";

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

/**
 * The editor's top bar. Left: the mark, the project's title and whether it
 * is saved. Middle: undo, redo and the format, because format changes the
 * stage. Right: the plan and Export, the view's one main action.
 */
export function EditorAppBar({
  project,
  aspect,
  onAspectChange,
  tier,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isExportOpen,
  isExporting,
  onToggleExport,
}: {
  project: ProjectState;
  aspect: AspectKey;
  onAspectChange: (value: AspectKey) => void;
  tier: TierName;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isExportOpen: boolean;
  /** A render is queued or running. */
  isExporting: boolean;
  onToggleExport: () => void;
}) {
  return (
    <header className="ed__bar">
      <Link
        href={project.isLoggedIn ? "/dashboard" : "/"}
        aria-label={project.isLoggedIn ? "Back to your projects" : "Back to the start page"}
        title={project.isLoggedIn ? "Your projects" : "Start page"}
      >
        <Wordmark markOnly />
      </Link>
      <span className="pf-sep" />
      <input
        aria-label="Project title"
        value={project.title}
        maxLength={80}
        onChange={(e) => project.onTitleChange(e.target.value)}
        className="pf-input pf-input--bare"
      />

      {project.isLoggedIn ? (
        project.status === "saved" ? (
          <span className="pf-badge pf-badge--success">
            <Check className="pf-i" aria-hidden />
            Saved
          </span>
        ) : (
          <button
            type="button"
            className="pf-btn pf-btn--secondary pf-btn--sm"
            disabled={!project.hasTrack || project.status === "saving"}
            aria-busy={project.status === "saving"}
            title={project.hasTrack ? "Save project (Ctrl+S)" : "Load a track to save: a project keeps its track"}
            onClick={project.onSave}
          >
            <Save className="pf-i pf-i--sm" aria-hidden />
            Save
          </button>
        )
      ) : (
        <Link
          href="/login?callbackUrl=/editor"
          className="pf-badge pf-badge--outline hidden sm:inline-flex"
          title="Logging in reloads the page, so do it before you start"
        >
          Log in to save
        </Link>
      )}
      {project.error && (
        <span className="pf-hint pf-hint--error hidden truncate md:inline">{project.error}</span>
      )}

      <span className="pf-spacer" />
      <button
        type="button"
        className="pf-btn pf-btn--ghost pf-btn--icon"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="pf-i" aria-hidden />
      </button>
      <button
        type="button"
        className="pf-btn pf-btn--ghost pf-btn--icon"
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="pf-i" aria-hidden />
      </button>
      <span className="pf-sep hidden sm:block" />
      <span className="hidden sm:block">
        <SegmentedSelector
          label="Format"
          options={Object.entries(ASPECTS).map(([key, a]) => ({
            value: key as AspectKey,
            label: a.label,
          }))}
          value={aspect}
          onChange={onAspectChange}
        />
      </span>
      <span className="pf-spacer" />

      {tier === "PREMIUM" ? (
        <span className="pf-badge pf-badge--premium hidden sm:inline-flex">Premium</span>
      ) : (
        <Link href="/pricing" className="pf-badge hidden sm:inline-flex" title="See what Premium adds">
          Free
        </Link>
      )}
      <button
        type="button"
        data-export-toggle
        className="pf-btn pf-btn--cta"
        aria-expanded={isExportOpen}
        onClick={onToggleExport}
      >
        <Download className="pf-i" aria-hidden />
        {isExporting ? "Exporting" : "Export"}
      </button>
    </header>
  );
}

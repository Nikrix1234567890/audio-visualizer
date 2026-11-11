"use client";

import type { ReactNode } from "react";
import {
  RESOLUTIONS,
  SCENES,
  type ResolutionKey,
  type VisualizerSettings,
} from "../../../remotion/types";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { SliderRow } from "@/components/ui/SliderRow";

const BAR_COUNT_OPTIONS = [16, 32, 64, 128];

export type SectionId = "scene" | "shape" | "color" | "motion" | "output";
export type CollapsedSections = Partial<Record<SectionId, boolean>>;

export type RenderState = {
  canRender: boolean;
  isUploading: boolean;
  isRendering: boolean;
  progress: number;
  error: string | null;
  renderedUrl: string | null;
};

export function Sidebar({
  settings,
  onSettingChange,
  resolution,
  onResolutionChange,
  collapsed,
  onToggleSection,
  render,
  onRender,
}: {
  settings: VisualizerSettings;
  onSettingChange: <K extends keyof VisualizerSettings>(
    key: K,
    value: VisualizerSettings[K],
  ) => void;
  resolution: ResolutionKey;
  onResolutionChange: (value: ResolutionKey) => void;
  collapsed: CollapsedSections;
  onToggleSection: (id: SectionId) => void;
  render: RenderState;
  onRender: () => void;
}) {
  const section = (id: SectionId, label: string, children: ReactNode) => (
    <Section
      label={label}
      isCollapsed={Boolean(collapsed[id])}
      onToggle={() => onToggleSection(id)}
    >
      {children}
    </Section>
  );

  const isBusy = render.isUploading || render.isRendering;
  const percent = Math.round(render.progress * 100);

  return (
    <aside className="editor-area-side chassis-grain flex min-h-0 flex-col bg-panel lg:overflow-y-auto">
      {section(
        "scene",
        "Scene",
        <SegmentedSelector
          stretch
          options={SCENES.map((s) => ({ value: s.id, label: s.label }))}
          value={settings.scene}
          onChange={(v) => onSettingChange("scene", v)}
        />,
      )}

      {section(
        "shape",
        "Shape",
        <>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
              Count
            </span>
            <SegmentedSelector
              stretch
              options={BAR_COUNT_OPTIONS.map((n) => ({
                value: n,
                label: String(n),
              }))}
              value={settings.barCount}
              onChange={(v) => onSettingChange("barCount", v)}
            />
          </div>
          <SliderRow
            label="Radius"
            value={settings.radius}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => onSettingChange("radius", v)}
          />
          {/* Terrain Wave draws lines, which have no width to set. */}
          {settings.scene !== "terrainWave" && (
            <SliderRow
              label="Width"
              value={settings.barWidth}
              min={0.05}
              max={1}
              step={0.01}
              onChange={(v) => onSettingChange("barWidth", v)}
            />
          )}
          <SliderRow
            label="Height"
            value={settings.heightScale}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => onSettingChange("heightScale", v)}
          />
        </>,
      )}

      {section(
        "color",
        "Color",
        <>
          <SliderRow
            label="Hue start"
            value={settings.hueStart}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => onSettingChange("hueStart", v)}
          />
          <SliderRow
            label="Hue end"
            value={settings.hueEnd}
            min={0}
            max={720}
            step={1}
            unit="°"
            onChange={(v) => onSettingChange("hueEnd", v)}
          />
        </>,
      )}

      {section(
        "motion",
        "Motion",
        <SliderRow
          label="Camera speed"
          value={settings.cameraSpeed}
          min={0}
          max={2}
          step={0.01}
          unit="x"
          onChange={(v) => onSettingChange("cameraSpeed", v)}
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
          className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
        >
          <path d="M2 1l4 3-4 3z" fill="currentColor" />
        </svg>
        {label}
      </button>
      {!isCollapsed && (
        <div className="flex flex-col gap-4 px-4 pb-5">{children}</div>
      )}
    </section>
  );
}

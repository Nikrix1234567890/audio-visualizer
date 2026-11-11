"use client";

import { useEffect } from "react";

const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "Space", does: "Play / pause" },
  { keys: "← / →", does: "Jump 5 seconds back / ahead" },
  { keys: "Ctrl + Z", does: "Undo" },
  { keys: "Ctrl + Shift + Z", does: "Redo" },
  { keys: "Ctrl + S", does: "Save the project" },
  { keys: "Ctrl + D", does: "Duplicate the selected element" },
  { keys: "Delete", does: "Remove the selected element" },
  { keys: "Alt + ← → ↑ ↓", does: "Nudge the selected element (with Shift: forwards / back)" },
  { keys: "?", does: "Show this list" },
];

const STEPS = [
  "Load a track - drop a file on the picture, or try the demo track.",
  "Pick a template on the left, or add elements one by one.",
  "Next to a fader, the round jack makes it react to the music and the diamond animates it over time.",
  "Choose a format under Output and press Render.",
];

/** A first-visit card with the four steps from a song to a video. */
export function FirstSteps({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex shrink-0 items-start gap-4 rounded-2xl border border-accent-dim bg-surface px-4 py-3">
      <ol className="grid flex-1 gap-x-6 gap-y-1.5 text-xs leading-relaxed text-muted sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="font-mono text-accent">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] text-muted uppercase outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent"
      >
        Got it
      </button>
    </div>
  );
}

/** The list of keyboard shortcuts, as a dialog over the editor. */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-control-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-muted outline-none hover:text-accent focus-visible:text-accent"
          >
            ✕
          </button>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-baseline justify-between gap-6">
              <dd className="text-muted">{shortcut.does}</dd>
              <dt className="shrink-0 font-mono text-xs text-ink">{shortcut.keys}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

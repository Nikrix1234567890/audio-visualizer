"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

export const SHORTCUTS: { keys: string[]; does: string }[] = [
  { keys: ["Space"], does: "Play or pause" },
  { keys: ["←", "→"], does: "Jump 5 seconds back or ahead" },
  { keys: ["Ctrl", "Z"], does: "Undo" },
  { keys: ["Ctrl", "Shift", "Z"], does: "Redo" },
  { keys: ["Ctrl", "S"], does: "Save the project" },
  { keys: ["Ctrl", "D"], does: "Duplicate the selected element" },
  { keys: ["Delete"], does: "Remove the selected element" },
  { keys: ["Alt", "← → ↑ ↓"], does: "Nudge the selected element (with Shift: forwards or back)" },
  { keys: ["?"], does: "Show this list" },
];

const STEPS = [
  "Load a track: drop a file on the picture, or use the demo track.",
  "Pick a template on the left, or add elements one by one.",
  "Right of a setting, the round jack makes it react to the music and the diamond animates it over time.",
  "Press Export, choose a format, and export.",
];

/** A first-visit card with the four steps from a song to a video. */
export function FirstSteps({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      className="ed__coach"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.3 }}
    >
      <b>From a song to a video</b>
      <ol>
        {STEPS.map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <button type="button" onClick={onDismiss} className="pf-btn pf-btn--accent pf-btn--sm">
        Got it
      </button>
    </motion.div>
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
    <motion.div
      className="ed__scrim"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="pf-dialog"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 460, damping: 34 }}
      >
        <div className="pf-dialog__head">
          <h2 className="pf-dialog__title">Keyboard shortcuts</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close"
            className="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm"
          >
            <X className="pf-i" aria-hidden />
          </button>
        </div>
        <div className="pf-dialog__body pt-3">
          <dl className="ed__shortcuts">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.does}>
                <dd>{shortcut.does}</dd>
                <dt>
                  {shortcut.keys.map((key) => (
                    <span key={key} className="pf-kbd">
                      {key}
                    </span>
                  ))}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </motion.div>
  );
}

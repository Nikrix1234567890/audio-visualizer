"use client";

import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

/**
 * Two to five exclusive choices, all visible. The pressed one sits on a
 * pill that slides to the next choice.
 */
export function SegmentedSelector<T extends string | number>({
  options,
  value,
  onChange,
  stretch = false,
  onLocked,
  label,
}: {
  /** A `locked` option stays readable, shows a gold lock and cannot be chosen (see `onLocked`). */
  options: { value: T; label: string; locked?: boolean; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  /** Fill the available width with equally wide segments. */
  stretch?: boolean;
  /** Called instead of `onChange` when a locked option is clicked. */
  onLocked?: (value: T) => void;
  /** What is being chosen, for screen readers. */
  label?: string;
}) {
  const pill = useId();

  return (
    <div
      role="group"
      aria-label={label}
      className={`pf-seg pf-seg--motion ${stretch ? "pf-seg--block" : ""}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            data-locked={option.locked || undefined}
            title={option.locked ? "Premium" : undefined}
            onClick={() =>
              option.locked ? onLocked?.(option.value) : onChange(option.value)
            }
            className="pf-seg__item"
          >
            {isActive && (
              <motion.span
                layoutId={pill}
                className="pf-seg__pill"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span className="pf-seg__text">
              {option.icon}
              {option.label}
              {option.locked && <Lock className="pf-i" aria-label="Premium" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

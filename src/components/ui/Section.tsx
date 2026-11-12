"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/** A collapsible group of controls in the inspector. */
export function Section({
  label,
  isCollapsed,
  onToggle,
  actions,
  children,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  /** Small buttons on the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pf-section" data-collapsed={isCollapsed || undefined}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          className="pf-section__head"
        >
          <ChevronDown className="pf-i pf-i--sm" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
        {actions && <span className="pf-section__actions pr-2">{actions}</span>}
      </div>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.3, 0.7, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="pf-section__body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

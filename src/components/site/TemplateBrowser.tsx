"use client";

import { Search } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useId, useRef, useState } from "react";
import { TemplateCard } from "./TemplateCard";
import type { TemplateSummary } from "./templateData";

/**
 * The template gallery: filter chips whose white pill slides to the chosen
 * one, an optional search field, and a grid that re-flows when the choice
 * changes. With `limit` it is the teaser on the landing page.
 */
export function TemplateBrowser({
  templates,
  categories,
  limit,
  hasSearch = false,
  opens = "detail",
}: {
  templates: TemplateSummary[];
  categories: { id: string; label: string }[];
  /** Show at most this many cards. */
  limit?: number;
  hasSearch?: boolean;
  /** Where a card leads: its own page, or straight into the editor. */
  opens?: "detail" | "editor";
}) {
  const pillId = useId();
  const gridRef = useRef<HTMLUListElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "0px 0px -8% 0px" });
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  // The first appearance is staggered; later changes re-flow at once.
  const [hasChanged, setHasChanged] = useState(false);

  const needle = query.trim().toLowerCase();
  const matches = templates.filter(
    (template) =>
      (category === "all" || template.categories.includes(category as never)) &&
      (needle === "" || template.label.toLowerCase().includes(needle)),
  );
  const shown = limit ? matches.slice(0, limit) : matches;

  const chips = [
    { id: "all", label: "All", count: templates.length },
    ...categories.map((c) => ({
      ...c,
      count: templates.filter((t) => t.categories.includes(c.id as never)).length,
    })),
  ];

  const choose = (id: string) => {
    setHasChanged(true);
    setCategory(id);
  };

  return (
    <div className="tb">
      <div className="tb__bar">
        <div className="lp-chips" role="group" aria-label="Filter templates by kind">
          {chips.map((chip) => {
            const isOn = chip.id === category;
            return (
              <button
                key={chip.id}
                type="button"
                className="pf-chip chip"
                aria-pressed={isOn}
                onClick={() => choose(chip.id)}
              >
                {isOn && (
                  <motion.span
                    layoutId={pillId}
                    className="chip__pill"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                <span className="chip__label">
                  {chip.label}
                  <span className="pf-chip__count">{chip.count}</span>
                </span>
              </button>
            );
          })}
        </div>
        {hasSearch && (
          <label className="pf-inputwrap tb__search">
            <span className="sr-only">Search templates by name</span>
            <Search className="pf-i" aria-hidden />
            <input
              type="search"
              className="pf-input pf-input--lg"
              placeholder="Search templates"
              value={query}
              onChange={(e) => {
                setHasChanged(true);
                setQuery(e.target.value);
              }}
            />
          </label>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {matches.length} {matches.length === 1 ? "template" : "templates"} shown
      </p>

      <ul ref={gridRef} className="lp-grid tb__grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((template, i) => (
            <motion.li
              key={template.id}
              layout
              className="s3"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={
                isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.97 }
              }
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{
                layout: { type: "spring", stiffness: 360, damping: 34 },
                default: { duration: 0.4, delay: hasChanged ? 0 : Math.min(i, 11) * 0.045 },
              }}
            >
              <TemplateCard
                template={template}
                href={
                  opens === "editor"
                    ? `/editor?template=${template.id}`
                    : `/templates/${template.id}`
                }
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {shown.length === 0 && (
        <div className="pf-empty">
          <span className="pf-empty__icon">
            <Search className="pf-i pf-i--lg" aria-hidden />
          </span>
          <span className="pf-empty__title">No template matches</span>
          <span>Try another name, or look through all of them.</span>
          <button
            type="button"
            className="pf-btn pf-btn--secondary mt-3"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Show all templates
          </button>
        </div>
      )}
    </div>
  );
}

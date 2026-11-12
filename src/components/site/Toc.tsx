"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * The table of contents of a long page. The mark slides to the section
 * that is being read.
 */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    // The section being read is the last one whose top has passed the upper third of the window.
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  return (
    <nav className="toc" aria-label="On this page">
      <p className="lp-eyebrow toc__title">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="toc__link"
              aria-current={active === item.id ? "location" : undefined}
            >
              {active === item.id && (
                <motion.span
                  layoutId="toc-mark"
                  className="toc__mark"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

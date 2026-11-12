"use client";

import { Plus } from "lucide-react";
import { animate, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { EASE } from "./kit";

export type Question = { question: string; answer: string };

/**
 * One question. It is a plain <details>, so it opens without scripts too;
 * with them the answer slides open and shut.
 */
function FaqItem({ question, answer, isOpen }: Question & { isOpen: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const running = useRef<ReturnType<typeof animate> | null>(null);
  const isReduced = useReducedMotion();

  const toggle = (e: React.MouseEvent) => {
    const details = detailsRef.current;
    const body = bodyRef.current;
    if (!details || !body || isReduced) return;
    e.preventDefault();
    running.current?.stop();

    const wasClosing = details.dataset.closing === "true";
    const willOpen = !details.open || wasClosing;
    const from = details.open ? body.offsetHeight : 0;
    if (willOpen) {
      details.open = true;
      delete details.dataset.closing;
    } else {
      details.dataset.closing = "true";
    }
    body.style.height = "auto";
    const to = willOpen ? body.offsetHeight : 0;
    body.style.height = `${from}px`;

    const controls = animate(
      body,
      { height: [from, to], opacity: willOpen ? 1 : 0 },
      { duration: 0.32, ease: EASE },
    );
    running.current = controls;
    controls.then(() => {
      if (running.current !== controls) return;
      if (!willOpen) {
        details.open = false;
        delete details.dataset.closing;
      }
      body.style.height = "";
      body.style.opacity = "";
    });
  };

  return (
    <details ref={detailsRef} open={isOpen}>
      <summary onClick={toggle}>
        {question}
        <Plus className="pf-i" aria-hidden />
      </summary>
      <div ref={bodyRef} className="faq-body">
        <p>{answer}</p>
      </div>
    </details>
  );
}

/** Questions and answers; the first one starts open. */
export function Faq({ items }: { items: Question[] }) {
  return (
    <div className="pf-faq">
      {items.map((item, i) => (
        <FaqItem key={item.question} {...item} isOpen={i === 0} />
      ))}
    </div>
  );
}

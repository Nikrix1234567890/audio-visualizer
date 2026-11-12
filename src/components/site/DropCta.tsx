"use client";

import { Music } from "lucide-react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { setPendingTrack } from "./pendingTrack";

/**
 * The drop zone of the closing call. A track dropped here is taken along
 * to the editor; the buttons simply open the editor.
 */
export function DropCta() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const [isOver, setIsOver] = useState(false);

  return (
    <motion.div
      ref={ref}
      className="pf-drop drop-cta"
      data-over={isOver ? "true" : undefined}
      animate={{ scale: isOver ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) setPendingTrack(file);
        router.push("/editor");
      }}
    >
      <motion.span
        className="pf-drop__icon"
        animate={isInView ? { y: [0, -5, 0] } : { y: 0 }}
        transition={
          isInView ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }
        }
      >
        <Music className="pf-i pf-i--lg" aria-hidden />
      </motion.span>
      <span className="pf-drop__title">Drop a track here</span>
      <span className="pf-drop__hint">
        MP3, WAV, M4A, AAC, OGG or FLAC. You carry on in the editor.
      </span>
      <span className="lp-row justify-center">
        <Link href="/editor" className="pf-btn pf-btn--cta pf-btn--lg">
          Open the editor
        </Link>
        <Link href="/templates" className="pf-btn pf-btn--secondary pf-btn--lg">
          Browse templates
        </Link>
      </span>
    </motion.div>
  );
}

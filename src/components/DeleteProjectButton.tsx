"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Deletes a saved project after asking once, then refreshes the list. */
export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  const remove = async () => {
    if (
      !window.confirm(`Delete "${title}"? This cannot be undone.`)
    ) {
      return;
    }
    setFailed(false);
    setIsDeleting(true);
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setIsDeleting(false);
    if (response.ok) router.refresh();
    else setFailed(true);
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isDeleting}
      className="shrink-0 rounded-md border border-hairline px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-steel uppercase outline-none hover:border-red-400 hover:text-red-400 focus-visible:border-red-400 disabled:opacity-50"
    >
      {isDeleting ? "Deleting…" : failed ? "Failed - retry" : "Delete"}
    </button>
  );
}

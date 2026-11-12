"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Sends a DELETE to `url` after asking once, then refreshes the page's data. */
export function DeleteButton({
  url,
  question,
  label = "Delete",
}: {
  url: string;
  question: string;
  /** What the button is called for screen readers, e.g. "Delete this video". */
  label?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  const remove = async () => {
    if (!window.confirm(question)) return;
    setFailed(false);
    setIsDeleting(true);
    const response = await fetch(url, { method: "DELETE" });
    setIsDeleting(false);
    if (response.ok) router.refresh();
    else setFailed(true);
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isDeleting}
      aria-label={label}
      title={label}
      className={`pf-btn pf-btn--sm ${failed ? "pf-btn--danger" : "pf-btn--ghost pf-btn--icon del-btn"}`}
    >
      {failed ? "Not deleted. Try again" : <Trash2 className="pf-i pf-i--sm" aria-hidden />}
    </button>
  );
}

"use client";

import { DeleteButton } from "@/components/DeleteButton";

/** Deletes a saved project after asking once, then refreshes the list. */
export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  return (
    <DeleteButton
      url={`/api/projects/${id}`}
      question={`Delete "${title}"? This cannot be undone.`}
      label={`Delete ${title}`}
    />
  );
}

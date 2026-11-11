"use client";

import { useCallback, useEffect, useState } from "react";
import type { SceneDocument } from "../../../remotion/scene/definitions";

type SavedScene = { id: string; title: string };

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return (data?.error as string | undefined) || fallback;
}

/**
 * The user's own templates: keep the current scene as one, load one, copy
 * its share link, delete it. A template holds the scene only - no track.
 */
export function MyTemplates({
  scene,
  onLoad,
}: {
  scene: SceneDocument;
  onLoad: (scene: SceneDocument) => void;
}) {
  const [scenes, setScenes] = useState<SavedScene[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/scenes");
    if (!response.ok) return;
    const data = await response.json();
    setScenes(data.scenes as SavedScene[]);
  }, []);

  useEffect(() => {
    // Loading the list is exactly what this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const save = async () => {
    const title = window.prompt("Name of the template", "My template");
    if (title === null) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, scene }),
      });
      if (!response.ok) throw new Error(await readError(response, "Saving failed."));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const load = async (id: string) => {
    setError(null);
    const response = await fetch(`/api/scenes/${id}`);
    if (!response.ok) {
      setError(await readError(response, "This template could not be loaded."));
      return;
    }
    onLoad((await response.json()).scene as SceneDocument);
  };

  const copyLink = async (id: string) => {
    const link = `${window.location.origin}/editor?scene=${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      // No clipboard access (an insecure origin, a denied permission):
      // show the link so it can be copied by hand.
      window.prompt("Copy this link", link);
    }
  };

  const remove = async (saved: SavedScene) => {
    if (!window.confirm(`Delete the template "${saved.title}"? Its share link stops working.`)) {
      return;
    }
    setError(null);
    const response = await fetch(`/api/scenes/${saved.id}`, { method: "DELETE" });
    if (!response.ok) setError(await readError(response, "Deleting failed."));
    await refresh();
  };

  const small =
    "shrink-0 rounded-md px-1.5 py-1 font-mono text-[10px] tracking-[0.06em] uppercase outline-none";

  return (
    <div className="flex flex-col gap-2 border-t border-hairline pt-3">
      <span className="font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
        My templates
      </span>

      {scenes && scenes.length > 0 && (
        <ul className="flex flex-col gap-1">
          {scenes.map((saved) => (
            <li
              key={saved.id}
              className="flex items-center rounded-md border border-transparent hover:border-hairline"
            >
              <button
                type="button"
                onClick={() => load(saved.id)}
                title="Load this template"
                className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm text-cream outline-none hover:text-amber focus-visible:text-amber"
              >
                {saved.title}
              </button>
              <button
                type="button"
                onClick={() => copyLink(saved.id)}
                title="Copy a link anyone can open this template with"
                className={`${small} ${
                  copiedId === saved.id ? "text-amber" : "text-steel hover:text-amber focus-visible:text-amber"
                }`}
              >
                {copiedId === saved.id ? "Copied" : "Link"}
              </button>
              <button
                type="button"
                onClick={() => remove(saved)}
                aria-label={`Delete ${saved.title}`}
                title="Delete"
                className={`${small} text-steel hover:text-red-400 focus-visible:text-red-400`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="rounded-md border border-dashed border-hairline px-3 py-2 font-mono text-[11px] tracking-[0.08em] text-steel uppercase outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "+ Save scene as template"}
      </button>
      <p className="text-xs text-steel">
        Keeps elements, camera and look - not the track. Pictures and 3D
        models stay private: someone opening your link sees the scene
        without them.
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

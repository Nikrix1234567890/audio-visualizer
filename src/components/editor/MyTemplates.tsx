"use client";

import { Plus, Trash2 } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-2 border-t border-line-1 pt-3">
      <span className="ed__group">Your templates</span>

      {scenes && scenes.length > 0 && (
        <ul className="pf-layers p-0">
          {scenes.map((saved) => (
            <li key={saved.id} className="pf-layer cursor-default">
              <button
                type="button"
                onClick={() => load(saved.id)}
                title="Load this template"
                className="pf-layer__pick pl-2"
              >
                <span className="pf-layer__name">{saved.title}</span>
              </button>
              <button
                type="button"
                onClick={() => copyLink(saved.id)}
                title="Copy a link anyone can open this template with"
                className="pf-btn pf-btn--ghost pf-btn--sm"
              >
                {copiedId === saved.id ? "Copied" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={() => remove(saved)}
                aria-label={`Delete ${saved.title}`}
                title="Delete"
                className="pf-layer__btn"
              >
                <Trash2 className="pf-i" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        aria-busy={isSaving}
        className="pf-btn pf-btn--secondary pf-btn--block"
      >
        <Plus className="pf-i" aria-hidden />
        Save scene as template
      </button>
      <p className="pf-note">
        Keeps elements, camera and look, not the track. Pictures and 3D
        models stay private: someone opening your link sees the scene
        without them.
      </p>
      {error && <p className="pf-hint pf-hint--error">{error}</p>}
    </div>
  );
}

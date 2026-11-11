"use client";

import { useState } from "react";
import {
  CAMERA_MOVES,
  applyCameraMove,
} from "../../../remotion/scene/cameraMoves";
import type { SceneDocument } from "../../../remotion/scene/definitions";
import { usePlayhead } from "@/components/editor/Playhead";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";

const DURATIONS = [1, 2, 4, 8];

/**
 * Ready-made camera moves. Clicking one writes its keyframes into the
 * camera, starting at the playhead - after that they are ordinary
 * keyframes on the faders above and on the timeline.
 */
export function CameraMoves({
  scene,
  onSceneChange,
}: {
  scene: SceneDocument;
  onSceneChange: (scene: SceneDocument) => void;
}) {
  const playhead = usePlayhead();
  const [duration, setDuration] = useState(4);

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-3">
      <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        Camera moves
      </span>
      <SegmentedSelector
        stretch
        options={DURATIONS.map((seconds) => ({ value: seconds, label: `${seconds} s` }))}
        value={duration}
        onChange={setDuration}
      />
      <ul className="grid grid-cols-2 gap-1.5">
        {CAMERA_MOVES.map((move) => (
          <li key={move.id}>
            <button
              type="button"
              title={move.description}
              onClick={() =>
                onSceneChange(applyCameraMove(scene, move, playhead.now(), duration))
              }
              className="w-full rounded-md border border-line px-2 py-1.5 font-mono text-[11px] tracking-[0.06em] text-muted uppercase outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent"
            >
              {move.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Starts at the playhead and takes the chosen time. Go to another
        moment and add the next one.
      </p>
    </div>
  );
}

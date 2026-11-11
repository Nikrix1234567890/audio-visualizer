"use client";

import type { PlayerRef } from "@remotion/player";
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

/** How often keyframed faders follow the playing video. */
const REFRESH_MS = 80;

/**
 * Where the playhead is, for controls that depend on the current time
 * (keyframed faders). A store rather than React state: only the controls
 * that subscribe re-render while the video plays, not the whole sidebar.
 */
export type Playhead = {
  subscribe: (listener: () => void) => () => void;
  /** The time the subscribers were last told about, in seconds. */
  getTime: () => number;
  /** The exact time right now, in seconds - for placing a keyframe. */
  now: () => number;
  seek: (seconds: number) => void;
};

const STILL: Playhead = {
  subscribe: () => () => {},
  getTime: () => 0,
  now: () => 0,
  seek: () => {},
};

const PlayheadContext = createContext<Playhead>(STILL);
export const PlayheadProvider = PlayheadContext.Provider;

/** A playhead that follows `player`. Stable for as long as the player is. */
export function usePlayheadStore(player: PlayerRef | null, fps: number): Playhead {
  return useMemo(() => {
    if (!player) return STILL;

    const listeners = new Set<() => void>();
    let time = player.getCurrentFrame() / fps;
    let lastNotified = 0;

    const onFrame = (e: { detail: { frame: number } }) => {
      const at = performance.now();
      // Every frame while paused (seeking, stepping); a dozen times a
      // second while playing.
      if (player.isPlaying() && at - lastNotified < REFRESH_MS) return;
      lastNotified = at;
      time = e.detail.frame / fps;
      listeners.forEach((listener) => listener());
    };
    const onPause = () => {
      time = player.getCurrentFrame() / fps;
      listeners.forEach((listener) => listener());
    };

    return {
      subscribe(listener) {
        if (listeners.size === 0) {
          time = player.getCurrentFrame() / fps;
          player.addEventListener("frameupdate", onFrame);
          player.addEventListener("pause", onPause);
        }
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) {
            player.removeEventListener("frameupdate", onFrame);
            player.removeEventListener("pause", onPause);
          }
        };
      },
      getTime: () => time,
      now: () => player.getCurrentFrame() / fps,
      seek: (seconds) => player.seekTo(Math.max(0, Math.round(seconds * fps))),
    };
  }, [player, fps]);
}

export function usePlayhead(): Playhead {
  return useContext(PlayheadContext);
}

/** The playhead's time in seconds; re-renders the caller as it moves. */
export function usePlayheadTime(): number {
  const playhead = useContext(PlayheadContext);
  return useSyncExternalStore(playhead.subscribe, playhead.getTime, () => 0);
}

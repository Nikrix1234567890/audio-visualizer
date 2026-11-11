import { useCallback, useMemo, useReducer } from "react";
import type { SceneDocument } from "../../remotion/scene/definitions";

/** Steps that can be taken back. Scenes are small, so this costs little. */
const MAX_STEPS = 100;
/**
 * Changes that follow each other this quickly count as one step: dragging a
 * slider or a handle produces dozens of changes, but is one thing to undo.
 */
const MERGE_WINDOW_MS = 600;

type State = {
  past: SceneDocument[];
  present: SceneDocument;
  future: SceneDocument[];
  /** When the last mergeable change happened; 0 = the next one starts a new step. */
  lastChangeAt: number;
};

type Action =
  | { type: "change"; next: (current: SceneDocument) => SceneDocument; at: number; merge: boolean }
  | { type: "reset"; scene: SceneDocument }
  | { type: "undo" }
  | { type: "redo" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "change": {
      const present = action.next(state.present);
      if (present === state.present) return state;
      const continues =
        action.merge &&
        state.past.length > 0 &&
        action.at - state.lastChangeAt < MERGE_WINDOW_MS;
      return {
        past: continues
          ? state.past
          : [...state.past, state.present].slice(-MAX_STEPS),
        present,
        future: [],
        lastChangeAt: action.merge ? action.at : 0,
      };
    }
    case "reset":
      return { past: [], present: action.scene, future: [], lastChangeAt: 0 };
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastChangeAt: 0,
      };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
        lastChangeAt: 0,
      };
    }
  }
}

/**
 * The scene being edited, with undo and redo.
 *
 * `change` records a step (quick successive changes merge into one unless
 * `merge` is false); `reset` replaces the scene and forgets the history -
 * for opening a project, which is not something to undo.
 */
export function useSceneHistory(initial: () => SceneDocument) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: initial(),
    future: [],
    lastChangeAt: 0,
  }));

  const change = useCallback(
    (
      next: SceneDocument | ((current: SceneDocument) => SceneDocument),
      { merge = true }: { merge?: boolean } = {},
    ) =>
      dispatch({
        type: "change",
        next: typeof next === "function" ? next : () => next,
        at: performance.now(),
        merge,
      }),
    [],
  );
  const reset = useCallback(
    (scene: SceneDocument) => dispatch({ type: "reset", scene }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return useMemo(
    () => ({
      scene: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      change,
      reset,
      undo,
      redo,
    }),
    [state, change, reset, undo, redo],
  );
}

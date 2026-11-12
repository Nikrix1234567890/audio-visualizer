// A track dropped on a page outside the editor, handed over to the editor.
// Going from that page to /editor does not reload the browser tab, so the
// file can wait here for the moment in between. The editor may call
// takePendingTrack() once when it starts and load what it gets.

let pending: File | null = null;

export function setPendingTrack(file: File) {
  pending = file;
}

/** The waiting track, if any. It is handed out once. */
export function takePendingTrack(): File | null {
  const file = pending;
  pending = null;
  return file;
}

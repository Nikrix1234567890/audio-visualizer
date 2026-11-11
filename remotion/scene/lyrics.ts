// Timed lyrics: lines of text that each appear at their own moment.
//
// Written one line per row, each starting with its time:
//
//   0:12 First line
//   0:16.5 Second line
//   0:21
//
// A row with only a time clears the screen. The times of karaoke files
// ("[00:12.50] First line", the .lrc format) are understood as well.

export type LyricLine = { t: number; text: string };

/** How long the last line stays if nothing follows it, in seconds. */
const LAST_LINE_SECONDS = 6;

const TIMED = /^\[?(\d{1,3}):(\d{1,2}(?:[.,]\d{1,3})?)\]?\s*(.*)$/;

/** The rows that start with a time, in order. Rows without one are ignored. */
export function parseLyrics(source: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const row of source.split("\n")) {
    const match = TIMED.exec(row.trim());
    if (!match) continue;
    const seconds = Number(match[1]) * 60 + Number(match[2].replace(",", "."));
    if (Number.isFinite(seconds)) lines.push({ t: seconds, text: match[3].trim() });
  }
  return lines.sort((a, b) => a.t - b.t);
}

/**
 * What is on screen at second `time`: the line and how visible it is
 * (0..1). A line fades in over `fade` seconds and out again just before
 * the next one starts.
 */
export function lyricAt(
  lines: LyricLine[],
  time: number,
  fade: number,
): { text: string; opacity: number } {
  let index = -1;
  for (let i = 0; i < lines.length && lines[i].t <= time; i++) index = i;
  if (index < 0) return { text: "", opacity: 0 };

  const line = lines[index];
  const end = lines[index + 1]?.t ?? line.t + LAST_LINE_SECONDS;
  if (time >= end || !line.text) return { text: "", opacity: 0 };
  if (fade <= 0) return { text: line.text, opacity: 1 };

  // Never let the two fades overlap on a very short line.
  const ramp = Math.min(fade, (end - line.t) / 2);
  const opacity = Math.min(1, (time - line.t) / ramp, (end - time) / ramp);
  return { text: line.text, opacity: Math.max(0, opacity) };
}

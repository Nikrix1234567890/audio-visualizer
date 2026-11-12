# Timeline

Time, left to right: ruler, the track's waveform, one lane per animated setting.

- **Waveform**: unplayed bars `ink-4`, played bars `accent`. Beats are `sig-beat` ticks along its bottom edge.
- **Lanes**: one per animated setting, labelled "Element, setting". Keyframes are diamonds (`ink-1`; the selected one `accent` with the glow); a hold keyframe is a square. A hairline joins the first and last keyframe of a lane.
- **Playhead**: a 1px `accent` line with a flag on the ruler, across every lane.
- **Export section**: an `accent` wash with two draggable edges and a label; outside it the waveform is unchanged.
- Click the ruler to jump, drag a keyframe to move it, Alt-drag to copy, Delete removes it. With "Snap keyframes to beats" on, dragging snaps to the nearest beat tick.
- Lane headers are 168px wide and carry the setting's diamond, so a keyframe can be added at the playhead from here.

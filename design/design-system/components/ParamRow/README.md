# ParamRow

One number in the inspector: a scrub field, its audio jack and its keyframe diamond.

- The field is the slider. The fill shows the value inside its range; drag sideways to change it, double-click or press Enter to type, arrow keys step, Shift is ten steps, Alt a tenth.
- **Jack** (round): unlit means no audio. Click to open SignalPatch. Lit, it takes the colour of its signal, and a bar under the fill shows the range the audio adds on top.
- **Diamond**: outline grey is off, outline accent means the value is animated, filled accent means a keyframe sits exactly at the playhead.
- A value that cannot react or animate (counts, speeds) shows a small lock in place of both, with a tooltip that says why.
- Label left, value right in the mono face with its unit. Labels are sentence case, never caps.
- The consumer provides label, value, min, max, step, unit, and optionally the signal, its amount and the keyframe state.

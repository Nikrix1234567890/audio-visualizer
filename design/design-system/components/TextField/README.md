# TextField

A labelled text input, select or text area.

- The label is always visible above the field; a placeholder is an example, never the label.
- 32px in the editor, `lg` (40px) on account pages. `bare` has no border until hovered: the project title in the app bar.
- An error sets `aria-invalid="true"` and puts one sentence under the field that says how to fix it.
- The consumer provides the label, the value and the validation message.

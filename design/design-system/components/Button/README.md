# Button

One action. Six looks, four sizes, and an icon-only form.

- **cta** (white): the one thing the view is for. At most one per view: "Open the editor" on a marketing page, "Export" in the editor, "Log in" on the login page.
- **accent**: confirms inside a popover or dialog when a cta is already on screen.
- **secondary**: every other action that needs to look like a button.
- **ghost**: toolbar and row actions; icon-only buttons are ghost by default. A toggled-on ghost button uses `aria-pressed="true"` and turns `accent-soft`.
- **premium**: only for upgrading. **danger**: only for deleting, and only as the confirming button.
- Sizes: `sm` 24px (rows, section headers), default 32px (editor), `lg` 40px (account pages, nav), `xl` 48px (hero and closing call).
- Label: verb first, sentence case, no full stop: "Save project", "Export", "Delete project". While working, set `aria-busy="true"`; the label is replaced by a spinner and the width does not change.
- An icon-only button always has an `aria-label` and a Tooltip.

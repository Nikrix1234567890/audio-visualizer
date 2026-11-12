# Dialog

Stops the user for a decision that cannot be undone, over a `scrim`.

- Title is the question, naming the thing: "Delete "Night drive visual"?". Body says exactly what is lost.
- Buttons name the outcomes ("Keep project", "Delete project"), never OK / Cancel. The safe choice is on the left and has focus.
- Use only for deleting and for leaving unsaved work. Everything else is undoable and gets a Toast with Undo instead.

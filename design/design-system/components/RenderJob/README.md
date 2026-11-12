# RenderJob

One render in the queue: picture, title, size, progress, and the one thing you can do with it.

- Three states: rendering (progress bar, percentage, time left, Cancel), queued (position badge), done (Download). A failed job shows a `danger` Banner in place of the meta line.
- Numbers are in the mono face with tabular figures so they do not jump while counting.
- Used in the export popover's queue and on the dashboard.

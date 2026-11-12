# ExportPopover

Opens from Export in the app bar: format, resolution, frame rate, length, then the one button.

- Every option is a SegmentedControl, so all choices and what is locked are visible at once.
- The summary line states the result before the click: pixel size, length, a time estimate.
- On the free plan a `premium` Banner says in one sentence what Premium adds. A locked segment opens the same message with Upgrade.
- After Export the popover turns into the queue: RenderJob rows, newest first.

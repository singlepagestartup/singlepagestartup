# Tasks to stages

Each task has one state row per active stage in its primary funnel. The
`variant` identifies the current stage, completed stages and stages that are
still pending. A `required` stage must run before the task can complete. Adding
a stage to a funnel makes it required for existing open tasks. If it precedes
the current stage, the task switches to the added stage and resumes its
interrupted work after the prerequisite is complete. Closed tasks retain
their recorded states.

Rows with `variant = history` record task commands, their original IDs,
revisions, stage, status and comments. The operation key and digest identify
retries. A task transition updates the state rows and appends its history
entry in the same transaction.

A customer message and its pending work share the same history row. The
first enqueue sets `queuedAt`. Deferring work moves a pending row to the back
of the queue. Acknowledgement clears `pending` and keeps `queuedAt` so a
retried enqueue cannot reopen completed work.

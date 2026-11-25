# Stage

A stage defines one step in a CRM workflow, including its actions, waiting
policy and optional work configuration. Workflow commands use its key.
Relations and historical records use its UUID. The funnel-to-stage relation
sets its position. Removing a stage from a funnel preserves its task history.

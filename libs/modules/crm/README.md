# CRM Module

## 1. Purpose of the Module

CRM captures form submissions and tracks store tasks through the current funnel configuration. Forms, steps, inputs, options, requests and widgets own data collection. A task’s stage history records actions, assignments and outcomes.

### It solves the following tasks:

- Defines forms with localized metadata.
- Builds multi-step form structures with ordered inputs.
- Captures form submissions as requests.
- Provides option lists and file attachments for select inputs.
- Embeds forms into widgets and layouts.

### Typical use cases:

- Contact forms and lead capture workflows.
- Multi-step onboarding forms.
- Surveys with selectable options and media.
- Admin tooling for configuring CRM flows.

---

## 2. Models

| Model                                 | Purpose                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| [funnel](./models/funnel/README.md)   | Store funnel configuration and save command                  |
| [stage](./models/stage/README.md)     | One named workflow stage with its actions and waiting policy |
| [task](./models/task/README.md)       | Store task and its current stage, assignment and next action |
| [form](./models/form/README.md)       | Form configuration and metadata                              |
| [input](./models/input/README.md)     | Input field definitions for forms                            |
| [option](./models/option/README.md)   | Selectable options for inputs                                |
| [request](./models/request/README.md) | Submitted form payloads                                      |
| [step](./models/step/README.md)       | Steps that group inputs in forms                             |
| [widget](./models/widget/README.md)   | Widgets that embed CRM forms                                 |

---

## 3. Relations

| Relation                                                                                                               | Purpose                                              |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [forms-to-requests](./relations/forms-to-requests/README.md)                                                           | Link forms to submitted requests                     |
| [forms-to-steps](./relations/forms-to-steps/README.md)                                                                 | Order steps within forms                             |
| [inputs-to-options](./relations/inputs-to-options/README.md)                                                           | Attach options to inputs                             |
| [options-to-file-storage-module-files](./relations/options-to-file-storage-module-files/README.md)                     | Attach files to options                              |
| [steps-to-inputs](./relations/steps-to-inputs/README.md)                                                               | Order inputs within steps                            |
| [widgets-to-forms](./relations/widgets-to-forms/README.md)                                                             | Embed forms inside widgets                           |
| [funnels-to-stages](./relations/funnels-to-stages/README.md)                                                           | Order stages within a funnel                         |
| [funnels-to-tasks](./relations/funnels-to-tasks/README.md)                                                             | Link tasks to their primary and related funnels      |
| [tasks-to-stages](./relations/tasks-to-stages/README.md)                                                               | Record each task revision, stage, status and comment |
| [funnels-to-ecommerce-module-stores-to-products](./relations/funnels-to-ecommerce-module-stores-to-products/README.md) | Bind a funnel to offers in its store                 |
| [tasks-to-ecommerce-module-stores-to-products](./relations/tasks-to-ecommerce-module-stores-to-products/README.md)     | Link tasks and catalog offers                        |
| [tasks-to-ecommerce-module-orders](./relations/tasks-to-ecommerce-module-orders/README.md)                             | Link tasks and orders                                |

---

## Store workflows

Call the CRM services through the application assembly. RBAC owns the
authenticated storefront and staff routes. It verifies the store grant and
derives the actor, customer and assignment identity from server-side records.
The workflow models and relations expose a read-only `GET /admin-records` list for both administration interfaces. RBAC requires an explicit role grant or root access. Changes to workflow records go through the authenticated workspace commands.

- `funnel.save` validates the stage graph and applies the configuration to
  new and open tasks. To edit an existing funnel, pass its current revision.
  Move or close open tasks before removing their stage. Saving a changed
  waiting policy updates scheduled reminders and deadlines.
- `funnel.resolve` checks form, offer and store-wide bindings in that order and reports a conflict between equally specific matches.
- An AI stage can select Social skills linked to its configured store agent.
  Each run checks that its current agent can use every selected skill before
  sending work to a provider. Automatic AI assignments follow the configured
  agent when a task enters a stage with skills. Manual assignments and human
  handoffs stay in place. A change to how an assigned stage runs or how its
  work is funded invalidates in-flight work under the earlier assignment revision.
- `task.open` links the task to its funnel and writes the first stage history entry
  in one transaction. Closing retains the last stage.
- `task.assign` advances the assignment revision. `task.transition` checks
  the task revision, stage action, actor and evidence. An assigned executor
  also needs the current assignment revision and an unexpired assignment.
  Use `task.withWork` when a local write must commit under the same assignment
  check. Use the durable caller event as the operation key for retries.
- `task.listDue` finds timers for one store. `task.applyTimer` commits a
  reminder or expiry and advances the schedule. Sending an external reminder
  uses the resulting event ID as the delivery key. Reply, stage entry and
  assignment changes invalidate superseded keys.
- `task.list` and `task.history` return `items` with a `nextCursor` when
  another page exists. Treat the cursor as opaque and keep the same filters.

A store may link several offers to a funnel. Select the offer explicitly when a
product has several offers in one store. A task can link to multiple offers
and orders. The task read model provides their IDs and retains the primary
selection for existing callers. RBAC owns the customer and assignee links.

The standard migration copies existing stage definitions, links, operation
keys, message IDs and pending work before removing the former columns. The
cutover retains superseded publication and relation records in the
`sps_crm_archive` schema. Historical entries keep their IDs so pending jobs
and existing references continue to resolve.

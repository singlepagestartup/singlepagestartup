# CRM Module

## 1. Purpose of the Module

CRM captures form submissions and tracks store tasks through published funnels. Forms, steps, inputs, options, requests and widgets own data collection. A task keeps the publication it started with and records every change in its history.

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

| Model                                                       | Purpose                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [funnel](./models/funnel/README.md)                         | Editable store draft and publication commands                |
| [funnel-publication](./models/funnel-publication/README.md) | Immutable version of a funnel                                |
| [task](./models/task/README.md)                             | Store task and its current stage, assignment and next action |
| [task-event](./models/task-event/README.md)                 | Append-only audit entries for a task                         |
| [form](./models/form/README.md)                             | Form configuration and metadata                              |
| [input](./models/input/README.md)                           | Input field definitions for forms                            |
| [option](./models/option/README.md)                         | Selectable options for inputs                                |
| [request](./models/request/README.md)                       | Submitted form payloads                                      |
| [step](./models/step/README.md)                             | Steps that group inputs in forms                             |
| [widget](./models/widget/README.md)                         | Widgets that embed CRM forms                                 |

---

## 3. Relations

| Relation                                                                                           | Purpose                          |
| -------------------------------------------------------------------------------------------------- | -------------------------------- |
| [forms-to-requests](./relations/forms-to-requests/README.md)                                       | Link forms to submitted requests |
| [forms-to-steps](./relations/forms-to-steps/README.md)                                             | Order steps within forms         |
| [inputs-to-options](./relations/inputs-to-options/README.md)                                       | Attach options to inputs         |
| [options-to-file-storage-module-files](./relations/options-to-file-storage-module-files/README.md) | Attach files to options          |
| [steps-to-inputs](./relations/steps-to-inputs/README.md)                                           | Order inputs within steps        |
| [widgets-to-forms](./relations/widgets-to-forms/README.md)                                         | Embed forms inside widgets       |

---

## Store workflows

Call the CRM services through the application assembly. RBAC owns the
authenticated storefront and staff routes. It verifies the store grant and
derives the actor, customer and assignment identity from server-side records.
The CRM model and relation paths describe Consistency resources and expose no
generic HTTP operations.

- `funnel.saveDraft` keeps a revision on each store's editable draft.
  `funnel.publish` validates the stage graph and snapshots the draft.
  `funnel.resolve` checks published form, offer, product and store-wide
  bindings in that order and reports a conflict between equally specific
  matches. `funnel.listPublications` reads the version history.
- `task.open` pins a publication and writes the first event in one transaction.
  A task stays on that version until a manager explicitly maps it to a stage of
  another publication and records a reason. Closing retains the last stage.
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

CRM relations enforce references from funnels to stores and publications and
from tasks to publications, events, products, offers and orders. Tasks keep
the product, offer and order IDs in their history after Ecommerce deletes a
draft or catalog entry. A task's customer and assignment IDs refer to
subjects resolved by RBAC.

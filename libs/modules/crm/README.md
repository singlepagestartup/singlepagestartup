# CRM Module

## 1. Purpose of the Module

The CRM module defines form-driven data collection flows and the content structures needed to capture user requests. It includes form schemas, steps, inputs, options, and requests, plus widgets and relations that assemble them into interactive experiences.

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

| Model                                 | Purpose                           |
| ------------------------------------- | --------------------------------- |
| [form](./models/form/README.md)       | Form configuration and metadata   |
| [input](./models/input/README.md)     | Input field definitions for forms |
| [option](./models/option/README.md)   | Selectable options for inputs     |
| [request](./models/request/README.md) | Submitted form payloads           |
| [step](./models/step/README.md)       | Steps that group inputs in forms  |
| [widget](./models/widget/README.md)   | Widgets that embed CRM forms      |

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

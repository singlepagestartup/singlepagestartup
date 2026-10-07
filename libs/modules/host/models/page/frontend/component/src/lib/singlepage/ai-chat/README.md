# AI Chat pages

Host composes AI Chat views under `/ai-chat/`: landing, register, login,
settings, help, tokens, project creation and project workspace. The bounded
Next route lives in `apps/host/app/ai-chat/[[...path]]/page.tsx`. Existing
generated page routes retain their own variants.

| Owner                     | Variants and responsibility                                         |
| ------------------------- | ------------------------------------------------------------------- |
| Host / Page               | Page composition, route selection and account context               |
| Website Builder / Widget  | Landing, help content and the SPS AI Chat header                    |
| RBAC / Identity           | Registration and login forms                                        |
| RBAC / Subject            | Password settings and account controls                              |
| Ecommerce / Order         | Token package selection and purchase summary                        |
| Social / Chat             | Project creation, upload and setup state; landing walkthrough       |
| Social / Chats to Threads | Document and topic selection, reviewed context and project workflow |
| Social / Thread           | Composer and sidebar entries                                        |
| Social / Message          | Conversation messages and source attachments                        |
| Knowledge / Document      | Section editor and reviewed document versions                       |
| File Storage / File       | File previews, references and generated asset metadata              |

The shared controls use Tailwind classes, Radix Select and AlertDialog,
registered Phosphor SVG geometry and the Onest font. Named colors and the
font token live in `apps/host/styles/presets/sps.css`. Host and Storybook
import the same theme. Runtime delivery assets live under
`apps/host/public/sps`; Design retains the original masters.

Module views import no Studio files, raw Markdown loaders, SDK providers
or presentation fixtures. Storybook supplies account values and project
fixtures through props. Workspace projections reuse these views and supply
their reviewed Markdown copy.

Publish reviewed copy and delivery assets with:

```sh
bun tools/studio/products/publish-ai-chat.ts
bun tools/studio/products/publish-ai-chat.ts --check
```

Interactive state currently runs in the browser: draft edits, file attachments,
reviewed versions and project topics. Analysis retains supplied text and
references; AI generation, binary text extraction, durable project storage,
authentication mutations, support delivery and payment execution still require
SDK adapters. Account balance defaults to unavailable until the caller supplies
it. Storybook account and project values are fixtures.

Future data adapters must use the owning modules' SDK providers and relation
`variant="find"` queries with `apiProps.params.filters.and`. Keep those adapters
out of the static Storybook projections.

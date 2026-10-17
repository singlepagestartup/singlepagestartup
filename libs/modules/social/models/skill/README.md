# Social Skill

`social.skill` stores reusable instructions that can be linked to one or more
social profiles through `profiles-to-skills`.

A skill has no draft, active, or archived lifecycle. A persisted skill exists
and is available to its linked profiles; removing it uses the model's delete
flow. The relation controls which profiles can use the skill.

## Fields

- `title` and `adminTitle` identify the skill.
- `slug` is the stable command identifier used by chat skill mentions.
- `description` contains the reusable instructions.
- `variant` selects the rendering variant.
- `className` provides the standard optional Tailwind class extension.

## AI Chat document professions

Each new AI Chat assistant receives five separate Skill records with non-empty instructions:

| Document    | Command prefix                     |
| ----------- | ---------------------------------- |
| Brief.md    | `ai-chat-account-manager`          |
| Strategy.md | `ai-chat-strategist`               |
| Brand.md    | `ai-chat-communication-strategist` |
| Design.md   | `ai-chat-brand-designer`           |
| Products.md | `ai-chat-business-analyst`         |

The server creates each record from the fixed instructions in
`libs/shared/utils/src/lib/constants/ai-chat-skill-templates.ts` and links it to
the new assistant. Each command appends that profile's ID to the prefix, such
as `ai-chat-account-manager-<profile-id>`. Creating a project requires no
preconfigured Skill rows, Studio import or Publisher flow. Subsequent setup
attempts reuse those records and links without overwriting edited descriptions.
Descriptions and titles can be edited through the existing scoped Skill API;
built-in profession commands remain stable. These records are excluded from the
shared catalogue and cannot be linked to another profile through the scoped API.
Already linked legacy shared commands remain readable for existing assistants;
when both versions are linked, document requests use the profile's own record.

The server gives document messages the profile's actual slash command and Skill ID.
Generation reads the current instructions once for each request. Ordinary
AI Chat threads can read all profile Knowledge but do not automatically
activate these five professions.
An explicit `/skill-slug` in the current message activates that connected
skill for the request.

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

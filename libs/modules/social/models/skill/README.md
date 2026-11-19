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

## AI Chat skills

People create and link Skills through the scoped API. A chat request can use a
linked skill by including its `/skill-slug` command.

Legacy AI Chat skills with a Profile ID in the reserved command slug are
private to that Profile. The scoped API excludes them from the shared
catalogue, protects their command slugs and allows owners to edit their titles
and instructions.

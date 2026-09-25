---
name: unslop
description: Remove AI-written tells from human-facing prose in any language while preserving meaning, facts, voice, terminology, and intent. Apply as the final editing pass to Markdown, documentation, READMEs, reports, proposals, emails, UI copy, release notes, slide text, and other writing meant to be read by people.
---

# unslop

Canonical source: `.agents/contracts/editorial-pass.md`.

Read the canonical contract completely and apply it to the text in hand. Its
rules, its scope and its completion check are the whole of this skill.

Load `.agents/references/unslop-patterns.md` while editing: it lists the shapes
that break those rules, with a rewrite for each, and the self-audit questions to
ask before returning the text. Both files are provider-neutral, so Codex and
every other provider edit against the same rules.

Return the revised text without explaining every change unless an editorial
report is requested.

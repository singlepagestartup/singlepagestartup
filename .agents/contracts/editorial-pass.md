# Final editorial pass

Apply this contract whenever an agent writes or returns prose intended for a
person: workspace documents, research, plans, reports, issue and PR text,
handoffs, documentation, interface copy, presentation text, emails, comments,
and the prose around technical results.

Run the pass after the content is complete and its facts, evidence, links,
identifiers, paths, commands, required structure, and approval state are
correct. This is the final content-editing step before the text is stored,
published, or returned.

Codex loads `.codex/skills/unslop/SKILL.md`. Other providers apply this contract
directly. The requested language and the author's intended voice remain in
force.

## Editing rules

- Read the complete text in context before changing it.
- Preserve meaning, facts, uncertainty, attribution, terminology, numbers,
  citations, links, formatting, and the operator's voice.
- Remove generic filler, repeated conclusions, empty importance framing, vague
  authority, unsupported benefits, marketing inflation, fake conversational
  transitions, and phrases that merely announce what the text is doing.
- Replace abstract or ambiguous wording with the actual actor, action,
  condition, decision, input, or result when the source supports it.
- Prefer ordinary words and sentences that are natural in the requested
  language. Do not translate unless the artifact calls for translation.
- Keep a caveat when it carries material information, but state the condition
  directly instead of adding defensive boilerplate.
- Do not add facts, examples, guarantees, evidence, metrics, praise, urgency,
  or certainty to make the text sound stronger.
- Do not edit source code, machine-readable values, logs, quoted material,
  legal text, or exact commands unless the task explicitly requires it. Edit
  only the surrounding human-facing prose.
- Do not mention the editorial pass inside the artifact.

## Completion check

Before returning the text, check that every paragraph has a specific purpose,
every claim is as precise as its evidence allows, one concept keeps one name,
and no sentence sounds reusable in an unrelated project without changes.

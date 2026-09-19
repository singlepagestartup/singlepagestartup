# Final editorial pass

Apply this contract whenever an agent writes or returns prose intended for a
person: workspace documents, research, plans, reports, issue and PR text,
handoffs, documentation, interface copy, presentation text, emails, comments,
and the prose around technical results.

Run the pass after the content is complete and its facts, evidence, links,
identifiers, paths, commands, required structure, and approval state are
correct. This is the final content-editing step before the text is stored,
published, or returned.

`.agents/references/unslop-patterns.md` lists the shapes that break these rules
and a rewrite for each. Load it while editing prose; the rules below stand on
their own while reading a role. Every provider uses the same two files. The
requested language and the author's intended voice remain in force.

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
- Write every statement as a state rather than as the event that produced it. A
  state may be past, future, or current; the act of deciding is not a state.
  "Tokens do not expire" is the statement; "the operator decided on 3 May that
  tokens do not expire" is a record of a conversation. Dates, names, and
  approval belong to the attribution beside the statement, in fields such as
  `source`, `date`, `accessed`, and `confirmation`, never inside the statement
  itself. An alternative that was rejected is not a state and does not appear
  next to the one in force; replace the obsolete statement instead of contrasting
  the two.
- Do not edit source code, machine-readable values, logs, quoted material,
  legal text, or exact commands unless the task explicitly requires it. Edit
  only the surrounding human-facing prose.
- Do not mention the editorial pass inside the artifact.

## Completion check

Before returning the text, check that every paragraph has a specific purpose,
every claim is as precise as its evidence allows, one concept keeps one name,
no sentence names who decided something or when outside an attribution field,
and no sentence sounds reusable in an unrelated project without changes.

For a workspace document the state rule is also executable:
`npm run singlepagestartup:pipeline:check` reports a date that sits inside a
statement and wording that contrasts an earlier edition with the one in force.
It checks the shapes, not the judgment, so a clean report does not replace this
pass.

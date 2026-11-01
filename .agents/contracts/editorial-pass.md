# Final editorial pass

Apply this contract whenever an agent writes or returns prose intended for a
person: workspace documents, research, plans, reports, issue and PR text,
handoffs, documentation, interface copy, presentation text, emails, comments,
and the prose around technical results.

Run the pass after the content is complete and its facts, evidence, links,
identifiers, paths, commands, required structure, and scope are
correct. This is the final content-editing step before the text is stored,
published, or returned.

`.agents/references/unslop-patterns.md` lists the shapes that break these rules
and a rewrite for each. Load it while editing prose; the rules below stand on
their own while reading a role. Every provider uses the same two files. The
requested language and the author's intended voice remain in force.

For Russian, read `.agents/references/unslop-ru.md`; for English, read
`.agents/references/unslop-en.md`. For mixed-language documents, apply each
reference to its passages without translating them. Then apply the shared
clarity pass in `.agents/references/infostyle.md`. Other languages use the
shared rules and retain their natural syntax.

## Inputs and scope

Use the supplied text, its reader, purpose and format. Infer these from the
document and task when they are clear. Ask only when a missing fact would
change the offer, instruction or conclusion; edit independent passages while
that question is open. Do not invent a benefit to replace vague wording.

For Workspace, edit the active source owned by the selected project layer.
Keep IDs, paths, headings used by parsers, query strings, evidence labels,
required metadata, quotations and transcripts intact. Explicitly requested
structural changes take precedence; retired approval metadata is removed
when the current Studio schema is applied. Editable display copy in
Markdown, slide data or UI content is prose even when stored in YAML or JSON;
edit its values only, preserving keys, types, links and behavior. Follow the
source used by the live preview so exports and the displayed text agree.
Do not copy framework business facts into a downstream project.

## Two editing passes

First remove empty framing, repetition and invented contrasts. Then repair
the explanation: who acts, what happens, why it matters to this reader, and
what the reader can do next. Explain necessary terms at first use and join
cause to consequence. Read the complete result after both passes. A checklist
or word replacement script is not a substitute for editing the argument.

Do not require a word count, a statistic in every paragraph, an editing score
or a fixed report structure. A short button and a detailed article need
different amounts of explanation. Preserve useful detail and the author's
voice. Give a change report only when requested; for edits to files, briefly
identify the scope and any unresolved factual questions.

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
  `source`, `date`, and `accessed`, never inside the statement
  itself. An alternative that was rejected is not a state and does not appear
  next to the one in force; replace the obsolete statement instead of contrasting
  the two.
- Preserve source code, machine identifiers, logs, quotations, legal text and
  exact commands. Only reader-facing copy fields are editable under the
  Workspace rule above; never alter their surrounding data structure.
- Do not mention the editorial pass inside the artifact.

## Substance before polish

For business documents apply `.agents/contracts/research-ownership.md` before
this pass. Editing generic wording does not replace research. A conclusion
must answer the document's question using the collected evidence. Do not
present work assigned to the operator as findings. Explain actual features,
conditions and consequences for this product; remove headings with no useful
content. Keep unavailable facts unknown without disguising missing work as
advice to the reader.

## Completion check

Before returning the text, check that every paragraph has a specific purpose,
every claim is as precise as its evidence allows, one concept keeps one name,
no sentence names who decided something or when outside an attribution field,
and no sentence sounds reusable in an unrelated project without changes.
The reader must also be able to follow the explanation without guessing an
actor, an omitted object, an acronym or the link between two statements.

In the Brief and product descriptions, state the actual business model, current
capability or planned outcome directly. Remove generic sentences saying that
comparative measurements, numerical targets or proof are absent when they do not
help the reader make a decision. Keep concrete research limitations beside the
finding they qualify; do not promote plans or hypotheses to verified facts.

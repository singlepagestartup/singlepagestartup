---
name: unslop
description: Remove AI-written tells from human-facing prose in any language while preserving meaning, facts, voice, terminology, and intent. Apply as the final editing pass to Markdown, documentation, READMEs, reports, proposals, emails, UI copy, release notes, slide text, and other writing meant to be read by people.
---

# Unslop for human-facing prose

Make the text read like it was written deliberately by a competent human for a specific reader.

This is an editing pass, not a content-generation pass. Preserve the author's meaning, facts, stance, level of certainty, domain terminology, and intended tone. Do not make the text bland just to make it sound "clean."

## When to apply

Apply this skill to prose intended for people, in the language requested for
the artifact, especially:

- Markdown and documentation
- READMEs and guides
- reports, briefs, proposals, specs, and memos
- emails, announcements, and release notes
- product and UI copy
- slide and document text
- generated artifact prose
- technical explanations
- research summaries
- internal strategy documents
- customer-facing content

The examples below are in English, but the editing principles apply by
function rather than by literal phrase. Preserve the grammar, punctuation,
register, idiom, and sentence rhythm of the requested language. Do not make
non-English text sound translated from English.

Do not apply these rules mechanically to source code, machine-readable data, logs, quoted material, legal text, or exact commands. Edit those only when the task explicitly requires it.

## Core workflow

1. Read the whole text before editing.
2. Identify the audience, purpose, tone, and claims that must survive.
3. Scan for the patterns below.
4. Rewrite only where the text becomes clearer, more specific, or more natural.
5. Read the result again as a skeptical human editor.
6. Ask: "What still makes this sound generated, generic, padded, or performative?"
7. Fix those parts without changing the substance.

Do not announce this process inside the artifact. Return clean prose.

## Non-negotiables

### Preserve meaning

Do not introduce new facts, claims, examples, numbers, citations, guarantees, or implications.

Do not remove a caveat merely because it makes a sentence less elegant.

Do not strengthen uncertain language beyond the available evidence.

Do not weaken a strong opinion when the author clearly intended one.

### Preserve real terminology

Use the exact name of a product, API, type, command, file, flag, component, metric, role, or business concept when one exists.

Do not replace a precise technical term with a decorative synonym.

Use one name for one concept. Repeating the correct term is better than synonym cycling.

### Preserve the author's voice

The goal is not corporate neutrality.

Keep humor, bluntness, skepticism, confidence, informality, restraint, or personality when those are intentional.

Remove generated mannerisms, not human character.

## Patterns to detect and fix

### 1. Generic claims

Cut sentences that could be pasted unchanged into almost any project, company, product, or article.

Bad:
"Performance and scalability are important for modern applications."

Better:
"The endpoint starts timing out when the result set exceeds 50,000 rows."

If a sentence says nothing specific to the subject, make it concrete or remove it.

### 2. Empty importance framing

Remove phrases whose only job is to announce that something matters.

Common examples:

- "It is important to note that"
- "It is worth mentioning that"
- "A key consideration is"
- "One crucial aspect is"
- "Needless to say"
- "It should be emphasized that"
- "Of particular importance is"

State the fact directly.

### 3. Vague attribution

Do not write:

- "experts say"
- "research suggests"
- "many developers believe"
- "industry best practices recommend"
- "it is widely accepted that"
- "studies have shown"

Name the source when the source is available.

Otherwise rewrite the claim so it does not borrow authority it cannot support.

### 4. Superficial participle clauses

Watch for trailing clauses that pretend to explain an effect without adding information:

- "highlighting..."
- "ensuring..."
- "showcasing..."
- "reflecting..."
- "fostering..."
- "underscoring..."
- "demonstrating..."

Delete them or replace them with the actual mechanism or consequence.

Weak:
"The system caches responses, improving performance."

Better:
"The system caches responses for 60 seconds, which removes repeated database reads for identical requests."

### 5. AI-favored vocabulary

Prefer ordinary words over vocabulary that sounds selected for rhetorical polish.

Common smells include:

- delve
- crucial
- pivotal
- intricate
- tapestry
- testament
- underscore
- vibrant
- interplay
- realm
- landscape when used abstractly
- leverage when "use" is enough
- utilize
- facilitate
- robust when no concrete property follows
- seamless
- holistic
- transformative
- multifaceted
- nuanced when it adds no actual nuance
- comprehensive when the scope is not actually comprehensive
- meaningful when the meaning is not specified
- impactful
- dynamic
- ever-evolving
- cutting-edge

These words are not banned.

Keep them when they are the normal, precise word in context.

### 6. Fancy substitutes for simple verbs

Prefer the direct verb.

Instead of:

- "serves as" -> often "is"
- "stands as" -> often "is"
- "boasts" -> usually "has"
- "utilizes" -> "uses"
- "facilitates" -> "helps" or name the actual action
- "enables the ability to" -> "lets" or a direct verb
- "provides users with the ability to" -> often "lets users"
- "makes use of" -> "uses"
- "is designed to support" -> often "supports"

Use the simpler form unless the longer wording carries real meaning.

### 7. Template contrasts

Generated prose overuses constructions such as:

- "not just X, but Y"
- "it's not about X, it's about Y"
- "more than just"
- "not merely"
- "rather than simply"
- "goes beyond"

Use them only when the contrast is real and necessary.

Otherwise state the stronger point directly.

### 8. Forced groups of three

Do not force every explanation into three bullets, three adjectives, three examples, or three clauses.

Use the number of items the subject actually requires.

### 9. Synonym cycling

Do not rename the same thing every sentence to avoid repetition.

Bad:
"the service", "the platform", "the solution", "the system" for the same product.

Pick the correct term and repeat it.

### 10. False ranges

Avoid "from X to Y" when X and Y are not endpoints on a meaningful scale.

Bad:
"from developer experience to business outcomes"

List the actual topics instead.

### 11. Abstract technical metaphors

Replace metaphorical nouns with the concrete mechanism when possible.

Watch for words such as:

- substrate
- vector
- nexus
- primitive when not used in its real technical sense
- scaffolding as a vague metaphor
- north star
- flywheel
- wedge
- ratchet
- surface when a more precise noun exists
- layer when it does not refer to a real architectural layer
- foundation when it is only rhetorical

Name the component, constraint, mechanism, action, or outcome instead.

### 12. Feeling instead of mechanism

Replace claims about how something "feels" with what it actually does.

Weak:
"The API stays out of your way."

Better:
"The API exposes three methods and requires no global configuration."

Weak:
"SQL remains close at hand."

Better:
"`.toSQL()` returns the exact query string before execution."

Weak:
"The workflow feels lightweight."

Better:
"The workflow adds one config file and no runtime dependency."

Prefer behavior, constraints, examples, and numbers over mood.

### 13. Filler

Cut phrases that add length without adding information.

Examples:

- "in order to" -> "to"
- "due to the fact that" -> "because"
- "at this point in time" -> "now"
- "it should be noted that" -> delete
- "in the context of" -> often delete or replace with a direct relationship
- "with regard to" -> often "about"
- "in terms of" -> often delete
- "the fact that" -> usually simplify
- "for the purpose of" -> often "to"
- "a number of" -> use the number, "several", or delete

### 14. Excessive hedging

Keep uncertainty that is real. Remove stacked uncertainty.

Bad:
"It could potentially be possible that this may cause..."

Better:
"This may cause..."

Bad:
"It appears that this might possibly indicate..."

Better:
"This may indicate..."

Never convert an uncertain claim into a certain one merely to sound decisive.

### 15. Weak verb plus adverb

Prefer a precise verb, a concrete outcome, or a measurement.

Weak:
"significantly improves performance"

Better:
"cuts median render time from 180 ms to 95 ms"

Weak:
"greatly simplifies deployment"

Better:
"removes the separate migration step"

If no measurement exists, do not invent one.

Use the most accurate plain description available.

### 16. Passive voice without a reason

Prefer an explicit actor when the actor matters.

Weak:
"The configuration is loaded at startup."

Better:
"The server loads the configuration at startup."

Passive voice is fine when the actor is unknown, irrelevant, or intentionally omitted.

Do not turn this into a blanket ban on passive voice.

### 17. Nominalization and corporate prose

Turn noun-heavy constructions back into actions.

Weak:
"perform an evaluation of"
Better:
"evaluate"

Weak:
"provide an explanation of"
Better:
"explain"

Weak:
"make a determination"
Better:
"decide"

Weak:
"carry out an implementation"
Better:
"implement"

Do not make a sentence sound official at the cost of readability.

### 18. Dense sentences

If a reader must backtrack to understand the grammar, split the sentence.

Keep one main thought per sentence.

A sentence may still be long when it carries one coherent thought with necessary conditions.

Do not make every sentence short. Human prose needs rhythm.

### 19. Over-compression

Do not turn prose into cryptic notes unless the format calls for notes.

Weak:
"Bad date -> exit 2, no write."

Better:
"The parser rejects an invalid date, exits with code 2, and writes nothing."

Keep articles, verbs, and connective words when they make the sentence easier to read.

### 20. Repeated sentence shape

Generated text often produces paragraphs where every sentence has the same length and grammar.

Vary rhythm naturally.

Do not manufacture variation for its own sake.

### 21. Excessive headings

Do not create a heading for every paragraph.

Use headings to expose real structure, not to decorate the page.

A short document may need no headings at all.

### 22. Inline-label list spam

Watch for repeated items shaped like:

- "**Performance:** Performance improves..."
- "**Security:** Security is handled..."
- "**Scalability:** Scalability allows..."

Use a real list when the items are parallel.

Use prose when they form an argument.

Do not repeat the label in the sentence.

### 23. Boldface as emphasis noise

Do not bold every important noun, product name, acronym, or conclusion.

Use emphasis only where a human editor would expect the reader to need it.

If half the paragraph is bold, the emphasis has failed.

### 24. Title Case everywhere

For prose headings, prefer sentence case unless the product's style guide requires another convention.

Do not alter official names.

### 25. Decorative punctuation

Do not use punctuation as a substitute for structure.

Watch for repeated rhetorical:

- em dashes
- semicolons
- colons
- ellipses
- parentheses
- slashes used as prose

Em dashes are valid punctuation in languages that use them. Do not ban them,
but follow the conventions of the requested language.

Remove them only when they are being used as a habitual dramatic pause instead of normal sentence structure.

### 26. Decorative emoji

Remove emoji used as visual furniture in serious documentation, reports, specs, and technical artifacts.

Keep them when the medium, brand voice, or author intentionally uses them.

### 27. Chatbot residue

Remove assistant-facing phrases from finished artifacts:

- "Of course"
- "Certainly"
- "Absolutely"
- "Great question"
- "You're absolutely right"
- "I hope this helps"
- "Let me know if you'd like..."
- "Here is the revised version"
- "Below is..."
- "Happy to help"
- "Feel free to..."
- "If you want, I can..."

The artifact should contain the artifact, not the conversation around it.

### 28. Sycophancy

Remove praise that is unrelated to the content.

Bad:
"You're absolutely right, and this is a great approach."

Better:
"The approach avoids a second network round trip."

State what is correct, incorrect, risky, useful, or unclear and why.

### 29. Generic introductions

Cut openings that merely announce the topic.

Weak:
"In today's rapidly evolving software landscape, observability has become increasingly important."

Better:
"This service emits traces for HTTP requests, queue jobs, and database queries."

Weak:
"When it comes to building reliable systems, testing plays a crucial role."

Better:
"The release pipeline blocks deployment unless unit and integration tests pass."

Start where the information starts.

### 30. Generic conclusions

Do not end with vague optimism, summary theater, or a synthetic call to action.

Weak:
"With these improvements in place, the future looks promising."

Better:
"The next release will remove the compatibility shim after all clients migrate to v3."

Weak:
"Overall, this approach offers a robust and scalable foundation for future growth."

Better:
"This design keeps writes in PostgreSQL and moves analytics reads to ClickHouse."

If there is no concrete conclusion, stop.

### 31. Unnecessary recap

Do not restate the same conclusion in the introduction, body, and final paragraph.

Repeat only when repetition serves navigation in a long document.

### 32. Invented reader benefits

Do not claim that something is:

- easier
- faster
- safer
- simpler
- more intuitive
- more maintainable
- more scalable
- more flexible
- more user-friendly

unless the text explains why.

Replace the adjective with the mechanism.

Weak:
"This makes onboarding easier."

Better:
"New contributors only need Node.js and one `.env` file to run the project locally."

### 33. Mannered prose

Remove aphorisms, slogans, fake profundity, and literary flourishes when literal wording is clearer.

Bad:
"Wire it or delete it."
Better:
"Connect the handler to the runtime, or remove the unused code."

Bad:
"This is the north star for the architecture."
Better:
"This constraint determines the architecture."

Bad:
"Complexity is the tax we pay for flexibility."
Better:
"The plugin system adds two abstraction layers and three extension points."

Keep actual jokes and deliberate voice.

Remove manufactured cleverness.

### 34. Excessive rhetorical questions

Generated prose often asks questions only to answer them immediately.

Weak:
"So what does this mean in practice? It means..."

Better:
"In practice, this means..."

Keep a rhetorical question only when it genuinely improves the voice or structure.

### 35. Fake conversationality

Do not inject casual language merely to sound human.

Watch for:

- "Here's the thing"
- "The good news?"
- "The catch?"
- "Let's be honest"
- "Let's unpack this"
- "Let's dive in"
- "Let's take a closer look"
- "You might be wondering"

These are not banned.

Use them only when they match the author's real voice and improve the text.

### 36. Empty confidence words

Remove words that simulate conviction without adding evidence:

- clearly
- obviously
- undoubtedly
- unquestionably
- certainly
- naturally

Keep them only when the statement really is clear from context.

### 37. Empty precision words

Watch for technical-sounding words that add no actual precision:

- architecture
- infrastructure
- framework
- ecosystem
- layer
- pipeline
- workflow
- system
- platform
- solution

Use them when they refer to a real thing.

Replace them when they are being used as generic nouns for "stuff."

### 38. Overexplaining obvious transitions

Cut transitions that narrate the document instead of moving it forward.

Examples:

- "Now that we have covered X, let's move on to Y."
- "Before we dive into X, it is important to understand Y."
- "With that in mind, let's take a look at..."
- "Having established that..."

Use a heading or start the next point directly.

### 39. Artificial balance

Do not force every claim into symmetrical pros and cons.

Do not add a downside merely to appear balanced.

Do not add a benefit merely to avoid sounding negative.

Represent the evidence and the author's intent accurately.

### 40. Marketing inflation

Remove promotional adjectives that are unsupported by evidence.

Watch for:

- revolutionary
- groundbreaking
- best-in-class
- world-class
- game-changing
- next-generation
- state-of-the-art
- powerful
- elegant
- effortless
- frictionless
- blazing-fast

Keep them only when the text provides a defensible reason or they are part of quoted brand language.

## Artifact-specific rules

When editing a text artifact:

- Do not insert commentary about the editing process into the artifact.
- Do not add a preface such as "Below is the improved version."
- Preserve links, citations, footnotes, code spans, code blocks, filenames, paths, command names, API names, and identifiers.
- Do not silently "correct" technical facts that you cannot verify.
- Do not rewrite quoted material as if it were the author's prose.
- Preserve intentional formatting unless it contributes to the problem.
- Keep tables when the information is genuinely tabular.
- Do not turn ordinary prose into tables merely for visual structure.
- Keep lists when items are truly parallel.
- Do not convert every paragraph into bullets.
- Do not add a summary unless the document needs one for navigation or decision-making.
- Preserve explicit requirements and constraints even when they make the prose less elegant.

## Technical-writing rules

For technical text:

- Prefer the real symbol name over a descriptive synonym.
- Prefer executable examples over abstract claims.
- Name who performs an action: compiler, browser, worker, server, user, build step.
- State conditions before consequences when that improves scanning.
- Keep one canonical term for each concept.
- Preserve exact commands and flags.
- Distinguish observed behavior from interpretation.
- Distinguish current behavior from proposed behavior.
- If a number matters, use the number when known.
- Never fabricate a number to make the prose more concrete.
- Prefer actual failure modes over vague risk language.
- Prefer explicit dependencies over words such as "integration" or "connectivity."
- Prefer exact state changes over abstract lifecycle language.
- Prefer exact inputs and outputs over words such as "data" when the type is known.

## Product and business writing rules

For product, strategy, and business prose:

- Name the customer, user, team, or buyer when relevant.
- Replace generic value language with the specific change in behavior, cost, time, risk, or capability.
- Separate evidence from positioning.
- Do not describe a feature as a benefit unless the connection is clear.
- Avoid invented urgency.
- Avoid fake certainty about markets, users, competitors, or future outcomes.
- Do not use metrics without context.
- Do not make "AI-powered" or similar labels carry the argument by themselves.
- Avoid slogans unless the artifact explicitly calls for slogans.

Weak:
"This unlocks significant value for teams."

Better:
"Support agents can now refund an order without asking an engineer to run a script."

## Email and message rules

For email, chat, and direct messages:

- Remove greetings or sign-offs only when they are unnecessary for the medium.
- Do not make every sentence polished to the point of sounding formal.
- Keep contractions when the voice is conversational.
- Avoid fake enthusiasm.
- Avoid excessive gratitude.
- Do not add "Hope you're well" automatically.
- Do not add a closing question unless a response is actually needed.
- Keep requests explicit: who needs to do what, by when, and why.
- Prefer one clear ask over several vague asks.

## Documentation rules

For docs and READMEs:

- Start with what the thing is or how to use it, not with broad context.
- Put prerequisites before setup steps.
- Put warnings before the action they constrain.
- Prefer examples that can be copied.
- Do not narrate every obvious step.
- Avoid repeating the same instruction in prose and code unless the repetition helps prevent mistakes.
- Keep section names descriptive, not clever.
- Do not add an FAQ section unless there are real recurring questions.

## Self-audit

Before returning human-facing prose, ask:

1. Could any sentence appear unchanged in an unrelated project? If yes, make it specific or cut it.
2. Did I leave any phrase whose only purpose is to sound important?
3. Did I borrow authority from unnamed experts, research, or "best practices"?
4. Did I use a fancy word where a normal one is clearer?
5. Did I rename the same concept for variety?
6. Did I overuse bullets, headings, bold text, colons, or rhetorical dashes?
7. Does every benefit claim name a mechanism or evidence?
8. Did I preserve uncertainty where uncertainty is real?
9. Did I accidentally flatten the author's personality?
10. Did I change any fact, number, identifier, quote, citation, or technical claim?
11. Is there any chatbot residue left in the artifact?
12. Did I introduce fake conversationality to make the prose seem human?
13. Did I add symmetry, praise, confidence, or marketing language that the evidence does not justify?
14. Does the text rely on abstract nouns where a concrete actor or action would be clearer?
15. What still makes this look machine-written?

Fix what remains.

## Output behavior

When this skill is used as an editing pass, output the revised text without explaining every change unless the user asks for an editorial report.

If the source contains a factual ambiguity, contradiction, or unsupported claim that cannot be safely resolved from context, preserve it and flag it outside the artifact rather than inventing a correction.

The final text should be specific, readable, economical, and recognizably written for its actual audience.

It should not sound "less AI" by sounding artificially casual, choppy, cynical, slang-heavy, or deliberately imperfect.

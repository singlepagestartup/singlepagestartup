---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: implemented-locally
---

# Document confirmation and useful review headers

The operator requested a document-owned confirmation parameter, status in the
header, useful purpose/help text, removal of the repeated body title, and
correct behavior across singlepage/startup inheritance.

## Result

- Primary Markdown review documents and their shared templates start with
  `confirmation.confirmed: false` in YAML frontmatter. Sales and Assets use
  the same root key in YAML. Empty startup sources remain empty.
- Existing whole-document Strategy (2026-08-10, SP-EV-053) and Brand
  (2026-08-11, SP-EV-058) confirmations were migrated from the recorded
  decisions. Other documents were not automatically approved. Scoped font,
  palette, reference, or scope decisions do not approve complete documents.
- Confirmation stores the user, date, attribution, and reviewed body's SHA256.
  The current body must match the stamp. Metadata and outer whitespace are
  excluded; body edits invalidate it. This is a review marker, not a digital
  signature or independent verification of claims.
- `tools/studio/workspace/document.ts` is shared by the agent loader and
  browser. `document-review.ts --file <workspace source>` returns the effective
  fingerprint without writing consent. It also accepts product Markdown/Sales.
- `ArtifactBrowser`, `ProjectDesign`, and product document views show a status
  badge with its source layer and purpose/usage guidance. Markdown frontmatter
  stays hidden. Only the leading H1 is suppressed when the page supplies its
  title; source headings and section headings remain intact.

## Inheritance behavior

| Case                                              | Effective confirmation                                          |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Empty startup                                     | Inherit singlepage text and attributed singlepage status        |
| Changed startup without own approval              | Unconfirmed startup                                             |
| Startup explicitly sets false                     | False overrides base true, even without body content            |
| Startup confirms inherited/partly overridden text | Stamp covers the complete resolved body                         |
| A retained singlepage section changes             | Prior startup confirmation becomes invalid                      |
| An overridden base section changes                | Confirmation survives because reviewed text is unchanged        |
| Source view of a partial startup document         | Display local fragment; evaluate approval against resolved text |
| Startup defines products                          | Atomic catalog selects its own product documents and statuses   |

Inherited singlepage confirmation does not approve a downstream client's stage.
The workflow, lifecycle/reconciliation contracts, relevant agent gates, README
files, templates, and AGENTS/CLAUDE explain that rule. The Decision Profile
reflects the owning document's approval instead of authoring a second decision.
GitHub baseline detection accepts valid metadata and retains legacy approved-row
support only for historical strategy sources without metadata. Startup approval
is checked against its base at the same published commit.

## Verification

- 63 Studio tests passed, including partial inheritance, metadata-only approval
  and rejection, inherited Evidence validation, changed fingerprints, source
  projection, helper resolution, YAML, and existing presentation/design behavior.
- 5 GitHub reconciliation tests passed, including metadata precedence, stale
  stamps, legacy baselines, and metadata-only startup adoption.
- Workspace validator self-check passed; 28 singlepage entries, 15 imports and
  exports. Storybook production build passed.
- `tsc --noEmit -p apps/studio/tsconfig.json`, targeted Prettier check, and
  `git diff --check` passed.
- Real browser checks: Business has one document H1 and useful header copy;
  unconfirmed Business, inherited confirmed Strategy, unconfirmed Design,
  product Research and Sales display correct labels; frontmatter stays hidden.
  At 390px the header wraps without clipping. No browser console errors were
  reported during the checks. Viewport restored and Business left open.

## Scope and continuity

The fingerprint validates only the effective body of this document. Changes to
other upstream documents do not automatically invalidate its UI status; see
`2026-09-11-studio-status-dependency-audit.md` for the confirmed gap and proposed
follow-up. Same-document layer inheritance and cross-document dependency
invalidation are separate mechanisms.

The pre-development cursor remains at `30-design`, in progress. No new business
decisions, whole-document approvals, market findings, Git commits, or remote
writes were created. Existing local PDF/export work was preserved. Evidence
removal remains an earlier analysis/recommendation in
`2026-09-11-studio-evidence-audit.md`; this change only adds its review status.

## PR 235 CodeQL review, 2026-09-11

Inspected the bot review against PR head `266b1da29f`. The aggregate CodeQL
check fails on two new high-severity alerts; the analysis jobs themselves
completed successfully. This review did not modify runtime code or dismiss
either alert.

- [Alert 115](https://github.com/singlepagestartup/singlepagestartup/security/code-scanning/115)
  (`js/redos`) is reproducible in `tools/studio/workspace/document.ts:144`.
  `documentReviewBody(input, true)` uses an ambiguous repeated comment pattern
  to suppress a leading H1. Calling the actual function under Node with
  `"<!--" + "--><!--".repeat(n) + "-->\nplain paragraph without a title"`
  took approximately 0.58, 6.76, 104.77, and 1693.2 ms for n=12, 16, 20, and 24
  (123–207 characters). The n=28 subprocess exceeded a two-second timeout and
  was terminated. `MarkdownDocument` calls this helper during rendering
  (`apps/studio/workspace/utils/components/ArtifactBrowser.tsx:93`), so affected
  repository-authored Markdown can stall Studio. Replace the ambiguous regex
  with a forward-only scan and cover repeated comments without a title.
- [Alert 116](https://github.com/singlepagestartup/singlepagestartup/security/code-scanning/116)
  (`js/incomplete-multi-character-sanitization`) flags comment removal at
  `tools/studio/workspace/document.ts:124`. In this function the resulting text
  is only an operand of `Boolean(...)` to test document non-emptiness; it is
  never returned as HTML or used to sanitize rendered content. The reported
  injection is therefore a false positive for this specific use. A direct
  content-presence check would make the purpose clearer without pretending
  to provide HTML sanitization. This finding is not a general HTML-renderer
  security audit.

### Correction

Replaced both regex-based checks with forward-only scanning in `document.ts`.
Each comment is skipped to its first closing delimiter once; an unterminated
comment hides the remaining text for content-presence checks and is preserved
unchanged for rendering. The title helper only slices out the leading H1 and
its line ending, retaining comments, paragraphs, and subsequent headings.
The content predicate returns a boolean and never sanitizes or joins fragments.
YAML presence is evaluated separately, and fingerprint calculation is unchanged.

Added five BDD regressions for comment-only documents, actual text after empty
headings, literal delimiters and code examples, preserved comments/line endings,
non-leading headings, malformed comments, and long adversarial inputs. The
performance regression runs the actual helper in an isolated Node/V8 subprocess
with a five-second kill deadline, so the original exponential pattern fails
without hanging the test runner. It covers 20,000 repeated comments, 100,000
spaces, and 20,000 unclosed comment starts.

Verification after the correction: 95 Studio tests and 453 assertions passed;
Studio TypeScript and workspace validator self-checks passed for both source
layers. The isolated adversarial regression completed in approximately 86 ms
including Node startup. No project document bodies, approval fingerprints,
catalogs, or inheritance configuration were changed.

## Summary

Three CodeQL alerts for `js/incomplete-multi-character-sanitization` were open on `main` for helpers that stripped HTML comments or script tags with a single regex replace. Two helpers only decide whether a Markdown source carries content; they now use the shared character scanner that the confirmation resolver already uses. The presentation exporter now removes script and modulepreload elements from a cloned DOM in the browser instead of rewriting serialized HTML as text. While verifying the exporter, the default `npm run studio:presentation:export` turned out to fail on `main` because the output file stem was passed as a catalog product ID; that is fixed in the same change.

## Changes

- `tools/studio/workspace/merge.ts`: `hasMeaningfulMarkdown` delegates to the exported `hasMarkdownContent` scanner; every caller already passes a parsed body.
- `apps/studio/workspace/utils/design/data.ts`: `meaningfulMarkdown` parses the design source and applies the same scanner, so frontmatter, headings and comments are skipped without a replace chain.
- `tools/studio/presentation/export.ts`: the HTML snapshot is taken from a cloned `documentElement` with `script` and `link[rel="modulepreload"]` nodes removed; `staticHtml` keeps only the URL and title rewrites. Without `--id`, no `product=` value is sent, so the story renders the catalog's default product. The Chrome launch waits up to 30 s for the DevTools port file instead of 5 s.
- Tests: two BDD scenarios in `merge.test.ts` for comment-only and heading-only overlays; the exporter structure test now asserts the DOM selector and the absence of the script regex.

## Verification

- [x] `npm run studio:validate` — 171 tests across 20 files pass, both workspace layers valid with self-check, editorial and GitHub reconciliation tests included.
- [x] `npm run studio:storybook:build` — production build completed with the changed helpers.
- [x] `bun tools/studio/presentation/export.ts --skip-build --id singlepagestartup` — the HTML snapshot produced by the new DOM-side removal is byte-identical to the snapshot produced by the previous regex-based code (49,715 bytes, 10 slides, 10 PNG files, PDF written).
- [x] `bun tools/studio/presentation/export.ts --skip-build` — the default export now completes and matches the explicit-id output; on `main` it fails with `Product presentation is not in the selected catalog`.
- [x] Old regex versus scanner comparison over 77 Markdown documents and 422 samples — 0 differences; resolved workspace content and review states for both layers unchanged before and after.

## Notes

- The old regexes and the scanner were compared on every Markdown document under `apps/studio/workspace`, `tools/studio` fixtures and `.agents/templates`: 422 samples (full sources, parsed bodies and every H2 section), 0 differences. The resolved workspace content, confirmation and review states for both layers are byte-identical before and after (182 entries).
- `npm run studio:presentation:export` without `--id` failed on `main` with `Product presentation is not in the selected catalog`; the strict product lookup and the URL both predate PR #239.

## Downstream migration

No child adaptation is needed. Merge resolution, design data detection and exported presentations keep the same results for well-formed sources; the default export now works without an explicit ID. A child project that copied `staticHtml` or `hasMeaningfulMarkdown` into its own tooling can replace those copies with the shared `hasMarkdownContent` export and the DOM-side removal shown in `tools/studio/presentation/export.ts`, but nothing inherited changes behavior.

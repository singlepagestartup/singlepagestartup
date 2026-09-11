# Product extension verification

Run `npm run studio:presentation:test` for catalog, ownership, nested-source,
filesystem-validation, and Markdown rendering checks.

For the isolated browser fixture:

```sh
npx storybook dev -c tools/studio/products/.storybook -p 4321 --ci
```

Open `Verification / Product extensions / Nested Pages`. Check Website's HTML
landing and nested link/relative image, its interactive JSX checkout, the campaign
image under Marketing Creative, and Academy's nested Markdown lesson and TSX deck.
Prepare PDF on the deck: both imported TSX pages should be 320×180 CSS pixels,
and the download becomes available after generation. The fixture explicitly adds
its Tailwind sources; the production stylesheet already scans workspace pages.

These fixtures stay outside workspace and do not change real product catalogs.
Build this isolated configuration with the usual `storybook build -c` command
to verify JSX and static HTML/assets in the production output as well.

# Independent Studio Modules and Workspace

Module variants own their markup, model composition, fixtures and runtime assets.
Workspace owns editable design components and product prototypes. There are no
runtime imports in either direction. An explicit content publisher copies approved
copy into Module JSON; changing a Workspace source alone does not replace Module
rendering.

## Ownership

- Module fixtures and state live beside the Subject, Profile, Thread, Source, File,
  Host and Website Builder variants that display them. Catalog card/table/list
  variants render their own schema examples.
- Cross-model rendering uses public Component entries and explicit variants.
  Website Builder Button `control` and Feature `icon` provide shared model views;
  same-model sibling helpers avoid dispatcher cycles.
- `runtime/assets` holds frozen images, documents and fonts exposed as
  `/module-assets`. `runtime/sps.css` owns Module theme tokens and the separate
  `SPS Onest` font family.
- Workspace’s editable website component snapshot lives under
  `workspace/products/singlepage/ai-chat/website/Preview/`. It owns code, fixture
  contracts and state, and uses Workspace tokens and assets.
- Catalog generation emits local rendering. `publish-ai-chat.ts` is the explicit
  copy-transfer step; its check mode reports drift without modifying files.

## Authentication

AI Chat calls Subject
`authentication-email-and-password-authentication-form-ai-chat` directly. Its
select-method compatibility variant renders that same form. The ordinary Subject
Select Method places Email/password, EVM and OAuth tabs inside the centered card.
Each panel remains mounted so drafts survive switching. EVM/OAuth remain local
preview interactions.

## Verification

- Studio tests cover production isolation, both runtime dependency directions,
  tokens/assets, model entry imports, cycles and local behavior.
- 301 tests across 41 files pass. TypeScript, metadata, inventory, content freshness, placement and Storybook
  production build pass.
- Browser verifies email/password-only AI Chat login and immediate Profile
  navigation; ordinary tabs inside the card retain the email draft through
  EVM/OAuth switching. Registration has a 20px row gap with start alignment and
  no horizontal overflow at the measured 500px canvas. Module images load from
  `/module-assets`. Workspace’s independent Landing prototype and its images render
  from its own code and `/workspace-assets`. The product page loader removes the
  complete `../../products/` prefix so Markdown and React pages resolve by layer.

Production code and unrelated Workspace business edits remain outside this change.

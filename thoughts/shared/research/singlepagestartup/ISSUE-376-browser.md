# ISSUE-376 — browser verification

Date: 2026-10-23. Owner: research_runtime. Branch: `codex/issue-376-framework-visual`.
Runtime: production Host on localhost:3000, final build `.next-issue376-final`; API on 4000; Storybook on 4321.
Browser: dedicated Chrome QA tab. User tabs and authentication were unchanged. The QA tab is closed, DevTools emulation is off, and the original 2250px CSS viewport is restored.

## Result

**PASS for the tested browser scope. No open browser blocker remains.**

Framework, Ecommerce Product/Category, Blog index/Category/Article and the guest private-content gate render in the final runtime. Desktop and real 320×900 CSS viewport checks pass. Blog index and Category now work after the two missing public association policies were added through the supported SDK by root; protected resource guards remain part of the separate server acceptance.

The functional slider/media/currency/quantity/update checks used the preceding production build with those variants already stable. The final build repeats the corrected cart, Framework/CRM/Category/Blog/Article/private mobile checks and EN/RU navigation. The Product detail variant source did not change between these builds; its linked screenshots are from the earlier stable build.

## Runtime checks

| Area               | Browser evidence                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Four saved Products, three saved slides, real CRM fields and three Category cards. Desktop visual uses the new container/card/hero system.                                                                                                                                               |
| Slider             | Next: `1 of 3` → `2 of 3`; ArrowRight → `3 of 3`; Home → `1 of 3`. Exactly two arrow controls in this variant.                                                                                                                                                                           |
| Product media      | Pro has two saved media items. Next changes `1 / 2` → `2 / 2`; ArrowLeft returns to `1 / 2`; thumbnail 2 selects `2 / 2`.                                                                                                                                                                |
| Product data       | The fourth attribute is available through the extra-attributes summary. Product detail keeps all four attributes, its localized heading/short description, full description and both media.                                                                                              |
| Currency/quantity  | RUB selection and quantity 2 show the actual unit price `1000 ₽ × 2`. No fixture price or attribute options were introduced.                                                                                                                                                             |
| Quick checkout     | Eight providers are available: stripe, 0xprocessing, payselection, payselection-international, tiptoppay, cloudpayments, dummy, paykeeper. Email/comment fields remain. No payment action was submitted.                                                                                 |
| Cart               | The initial cart was empty. A local Pro test item was added, updated to quantity 2, and removed successfully. The final cart is empty. Only the test item was changed.                                                                                                                   |
| Cart layout        | Final desktop drawer width is 447.998px. At 320px, `innerWidth=scrollWidth=dialogWidth=320`; title, all four attributes, quantity/actions, totals and checkout fields fit without the former letter wrapping.                                                                            |
| CRM                | Actual Name/Email/interest fields render. Actual saved interest options are Option 1/Option 2/Option 3; selection works. Name/Email stack at 320px. Submit was not clicked.                                                                                                              |
| Ecommerce Category | Web Development renders its saved Startup Product with Add to cart and One step checkout. Header outer edge, Products heading and Product card share left coordinate 516.992px on desktop; the mobile composition has no extra nested grid inset.                                        |
| Blog index         | Three Categories, Popular Articles and nine saved Article cards render. Saved records with empty localized title retain their Read article action; their content was not invented or changed.                                                                                            |
| Blog Category      | Category #1 keeps subtitle, description and its exact two linked Articles. Category → Article #1 → browser Back returns to the Category. Desktop and 320px pass.                                                                                                                         |
| Ordinary Article   | The saved Next.js/Hono Article renders formatted section headings and paragraphs at 320px. Article #1 renders its saved title/subtitle/description and resolves the content reader without an error gate.                                                                                |
| Private Article    | Both `/en/framework/blog/articles/framework-private-content-audit` and `/en/blog/articles/framework-private-content-audit` render the public introduction and guest subscription gate. The private marker is absent from visible DOM.                                                    |
| Locale/navigation  | RU Framework uses localized heading, slide controls and Product titles. Its Pro link opens `/ru/ecommerce/products/pro`; browser Back returns to `/ru/framework`. RU private alias uses `/ru/rbac/subjects/me/authentication/select-method` for its guest action. EN links retain `/en`. |
| Mobile navigation  | The menu opens through native accessibility; Escape closes it and returns focus to Open menu.                                                                                                                                                                                            |
| Unknown Product    | `/en/ecommerce/products/issue-376-nonexistent-product` resolves after hydration to the custom **Page not found** UI. The server streaming status is covered separately by root.                                                                                                          |
| Console            | The final acceptance session, starting `2026-10-22T23:45:53.845Z`, has zero captured console errors or warnings. No hydration/import/serialization error was observed.                                                                                                                   |

The cart description warning and narrow three-column Product cart layout are corrected in the final build. Final cart screenshots show the correction on desktop and 320px.

## Browser follow-up files

The browser finding required four source files:

- `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/cart/default/Component.tsx`: compact vertical cart Product, existing Gallery with the original default media filter, all Attributes, middleSlot and action/children slots.
- `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/cart/default/Skeleton.tsx`: one cart Product skeleton.
- `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/cart/default/index.tsx`: supplies that skeleton to the shared reader.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/cart-default/ClientComponent.tsx`: responsive scrolling drawer, accessible cart trigger and SheetDescription. SDK operations and payloads are unchanged.

Existing drawer/cart-row/order-list-checkout suites pass **9 tests across 3 suites** after this change.

The separately assigned `expired` compatibility follow-up changes:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/order/list/ai-chat/ClientComponent.tsx`: includes expired purchases in history.
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/purchase-ai-chat/ClientComponent.tsx`: labels an expired purchase while keeping its receipt/reference/total.
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/purchase-ai-chat/Component.spec.ts`: covers an expired purchase with its stored receipt and no extra generic queries.

The purchase suite passes **7 tests**; Subject order-list SDK cache suite passes **2 tests**. Both admin forms consume SDK statuses, which include `expired`; no other literal Subject history status filter was found in the targeted search.

## Runtime screenshots

- [Framework desktop](/tmp/sps-376-browser/framework-desktop.jpg), [Framework final 320px](/tmp/sps-376-browser/framework-final-320.jpg).
- [Product desktop](/tmp/sps-376-browser/product-pro-desktop.jpg), [Product 320px](/tmp/sps-376-browser/product-pro-320.jpg), [quick checkout](/tmp/sps-376-browser/framework-quick-checkout.jpg).
- [Corrected cart desktop](/tmp/sps-376-browser/cart-final-desktop.jpg), [corrected cart 320px](/tmp/sps-376-browser/cart-final-320.jpg).
- [CRM desktop and compact Categories](/tmp/sps-376-browser/framework-crm-desktop.jpg), [CRM final 320px](/tmp/sps-376-browser/crm-final-320.jpg).
- [Product Category desktop](/tmp/sps-376-browser/category-desktop.jpg), [Product Category final 320px](/tmp/sps-376-browser/category-final-320.jpg).
- [Blog desktop](/tmp/sps-376-browser/blog-desktop.jpg), [Blog final 320px](/tmp/sps-376-browser/blog-final-320.jpg).
- [Blog Category final desktop](/tmp/sps-376-browser/blog-category-final-desktop.jpg), [Blog Category final 320px](/tmp/sps-376-browser/blog-category-final-320.jpg).
- [Ordinary Article final 320px](/tmp/sps-376-browser/article-final-320.jpg).
- [Private guest gate desktop](/tmp/sps-376-browser/private-guest-desktop.jpg), [private guest gate final 320px](/tmp/sps-376-browser/private-final-320.jpg).
- [Unknown Product / Not Found](/tmp/sps-376-browser/unknown-product-404.jpg).

## Storybook comparison

The live Framework reference renders hero/gallery/products/CRM/categories. Next slide changes the reference to “Content with a purpose”, status “Slide 2 of 3”. Category reference shares the header/description/grid edge. The private Article reference keeps its public widget before the locked subscription block.

- [Framework desktop](/tmp/sps-376-browser/storybook-framework-desktop.jpg), [Framework 320px](/tmp/sps-376-browser/storybook-framework-320.jpg).
- [Gallery second slide](/tmp/sps-376-browser/storybook-gallery-second-slide.jpg).
- [Product Category desktop](/tmp/sps-376-browser/storybook-category-desktop.jpg).
- [Private Article locked block](/tmp/sps-376-browser/storybook-private-locked.jpg).

## Limits

- No checkout, provider payment, CRM Submit, email or notification action was performed. CRM submit-validation remains covered by the owning focused tests; invalid email on blur alone does not activate its submit validation.
- Browser entitlement coverage is the existing guest session. Subscriber/expired/multiple-principal behavior, raw endpoints, bytes, cache and HTML/RSC isolation belong to the independent server/API acceptance; this report does not claim those browser scenarios.
- Saved gallery media in the checked runtime are images. Native video/audio keyboard handling has focused test coverage; no live video/audio fixture was added for browser testing.
- Chrome's viewport capability clamps this native window to 400px. Real 320px checks use the CUA-operated DevTools Responsive UI, with document dimensions checked explicitly. Viewport captures are used; a full-page screenshot API changed the effective viewport to 380px, so its file is labelled unverified and excluded from evidence.

---

# Published Blog browser verification

Status: PASS for the exercised runtime checks, with the screenshot limitation documented below. Nine malformed captures are excluded from visual evidence.

Final runtime: source `129dd65f92`, cache-disabled retry build `.next-issue376-blog-accepted`, Host port 3000, session 24587. Build log: `/tmp/sps-376-blog-accepted-retry-build.log`; runtime log: `/tmp/sps-376-blog-accepted-production.log`. API port 4000 and Storybook port 4321 are local.

Final browser console cutoff: `2026-10-23T08:29:08.693Z`. Warning/error entries after fresh accepted-build navigation: **0**, including no TipTap byline, hydration or failed-request console diagnostics. Raw timestamp-filtered result: `/tmp/sps-376-blog-browser/final-console.json`. No HAR or complete network-request capture is claimed; root owns the separate HTTP/RSC/cache matrix.

## Final accepted-build checks

- Desktop 2250 CSS px: Blog renders three Categories, nine Article cards and six distinct Article IDs. Popular Articles deliberately repeats three records. Editorial bylines render on every Article card.
- EN Next.js Article and RU React Query Article render their localized title, category, subtitle, actual editorial byline, plain-text editorial subtitle, creation date, full body and source references. External Next.js/TanStack documentation destinations are present with safe link attributes.
- Cart trigger measures 43.994 px at desktop and 44 px at mobile, with `size-11`, `rounded-xl`, neutral border/background and `size-5` dark icon. This matches the Storybook trigger geometry and treatment.
- At actual `innerWidth=320`, `innerHeight=900`, DPR 1, the Cart drawer measures 320×900 and the page scrollWidth stays 320. Its real empty state renders. Escape closes it and returns focus to the localized Cart trigger. No cart items were changed.
- The Russian mobile menu opens with focus on `О нас`; Escape closes it and returns focus to `Открыть меню`. Cart and Menu buttons each measure 44×44.
- Live read-only DOM measurements on the final accepted build: Blog at 320 retains three Categories, nine Article cards and editorial bylines, with scrollWidth 320. React Query code has `overflow-x:auto`, `white-space:pre-wrap`, clientWidth 238 and scrollWidth 238; the page scrollWidth is 320. These final index/code observations have no usable final viewport capture. Earlier valid 320 captures cover the unchanged card/code presentation. No horizontal code scrolling is claimed when there is no overflow.
- Live read-only DOM checks on the final accepted build, after the authentication link became visible: all four private Article routes settle before inspection: EN/RU `/blog/articles/framework-private-content-audit` and EN/RU `/framework/blog/articles/framework-private-content-audit`. Public Article bodies remain readable (EN 6,094 / RU 6,922 rendered text characters). Each route shows the localized denied subscription block and locale-specific authentication URL. Both the protected marker and private Widget ID are absent from the live DOM. All four report innerWidth 320 and scrollWidth 320. The final private-gate captures are unusable; these are DOM observations, supported separately by root's HTTP/RSC matrix, not final screenshot proof.

The current runtime Navbar composition preserves its existing Cart-only functional entry. Its authentication slot remains available; this saved composition has no Sign-in entry. The configured Sign-in example in Storybook is not represented as an added runtime operation. Root's baseline/source review confirms that composition is preserved.

## Earlier publication interaction evidence

These checks used `.next-issue376-blog-final`, before the final byline-renderer and Cart-trigger changes. The exact earlier source commit was not recorded; final accepted-source checks above are attributed separately.

- Desktop widths 1,666 and 2,250 CSS px and at actual 320 CSS px: Frontend, Backend and DevOps Category pages each contain the two intended distinct Articles. Their actual saved covers load at 1,254 px natural width; the editorial SVG avatar loads at 512 px.
- Article paragraph click opens the Next.js Article. Article image click opens the Hono Article. A native pointer click in blank left padding of a DevOps Article card opens the Nx Article. The Article Category chip independently opens its Category.
- A native pointer click in blank padding of the Frontend Category card at 320 opens the Frontend Category page.
- All six Article destinations were visited. Structured headings, paragraphs, code and source references render. EN Next.js/Hono/TanStack/Drizzle destinations and the translated RU React Query source link were inspected. External links use `_blank` with `noopener noreferrer nofollow`.
- The private Article retains its Oct 22 creation date; the five new Articles show Oct 23. Reading time is absent and is not a current implementation requirement.
- Storybook Framework at actual 320 has the same 81 px header height and mobile menu placement. Logo and navigation content come from the actual saved runtime records.

## Evidence and cleanup

Usable evidence files are in `/tmp/sps-376-blog-browser/`. A `file` metadata audit checks the sizes stated below. Only the listed usable captures are visual evidence.

Final accepted build:

- `final-index-desktop.jpg`, `final-article-en-desktop.jpg` — 2250×1190.
- `final-article-ru-320.jpg`, `final-cart-320.jpg` — 320×900; independently checked by the reviewer.

Earlier interaction pass, attributed to `.next-issue376-blog-final`:

- `index-desktop.jpg`, `article-desktop.jpg`, `category-frontend-desktop.jpg`, `category-backend-desktop.jpg`, `category-devops-desktop.jpg` — 1666×1250.
- `index-320.jpg`, `category-frontend-320.jpg`, `article-nx-320.jpg`, `code-320.jpg`, `storybook-header-320.jpg` — 320×900. The index image visibly shows the actual 320 card layout. Card and code presentation source was unchanged by the final byline/Cart fixes.

Excluded captures: `final-index-320.jpg`, `final-code-320.jpg`, `final-private-en-alias-320.jpg`, `final-private-ru-alias-320.jpg`, `article-ru-320.jpg`, `category-backend-320.jpg`, `category-devops-320.jpg`, `private-320.jpg`, `private-gate-320.jpg`. Each file is 320×169, inconsistent with the requested/measured 320×900 viewport. The reviewer also observed a tiny page strip in the final index capture. These files are retained only for diagnosing the capture mismatch; they are not evidence of the mobile layout or gates. No cause for the mismatch has been established, and no new browser run or recapture was performed during this report correction.

The temporary viewport and native tab zoom were restored: original localhost zoom 80%, desktop 2250 CSS px, native DPR 1.6. DevTools device mode is off and DevTools is closed. Both agent-created comparison/QA tabs are closed. User tabs and authentication were preserved.

Scope limits: no payment, CRM submission, mail, login/logout, subscription purchase or user-session alteration. Entitled/expired access and HTTP/RSC/cache/security matrices belong to root's separate evidence. No frontend source was changed during this browser pass.

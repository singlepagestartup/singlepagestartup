# Product directory guide

Each source layer has one catalog and its product-owned content:

```text
products/
  README.md
  singlepage/                       # framework project's business materials
    catalog.yaml
    <product-id>/                    # one product's business and authored materials
  startup/                          # downstream project's owned materials
    catalog.yaml
    <product-id>/                   # created when the project defines its product
```

## Products and economics

Each product owns its offer, customers and economics in `product.md`: Revenue
Streams, Key Activities, Key Resources, Key Partnerships and Cost Structure,
with Funding kept separate from revenue. A resource shared by products appears
in each Product with its share and allocation basis, so costs are not counted
twice.

The framework catalog contains Code Framework (`singlepagestartup`) and AI Chat
(`ai-chat`). Each has its own economic sections. The product directory ID is
stable; its display name is independent.

The parser accepts an optional `models` collection and a product's optional
`model` pointer for legacy catalogs. These entries do not belong in a new
catalog. A declared legacy model must resolve within the same catalog and source
layer; it is unrelated to application models under `libs/modules`.

## Inside one product

- `product.md`: offer, customer segments and economics.
- `sales.yaml`: segment profiles, acquisition and Customer Journey Maps. The
  shared renderer creates segment pages and Markdown exports from this source.
- `research.md` + `research/`: summary, segment evidence and competitor details.
- `analytics.md`: observed funnel, usage, retention and economic values with
  reporting periods, sources and limitations.
- `website.md` + `website/`: visitor journey, individual page text and layouts.
- `marketing-creative.md` + `marketing-creative/`: plan and editable covers,
  articles, storyboards, posts and selected motion compositions.
- `presentation/data.yaml` + `presentation/*.tsx`: independent presentation copy
  and its slide compositions. Product-specific types may live beside those slides.
- `content/`: optional delivered material such as guides or a proposed README.

Studio keeps the working sequence compact: Product → Sales → Promotion →
Analytics. Compact badge tabs expose Product Overview and
optional Product Content inside Product, Website/Marketing Creative/Presentation
inside Promotion, and current observations/Research inside Analytics. These are
navigation groups; their underlying sources, confirmation, nested pages and
exports remain distinct.

Keep overview documents beside their detail folders. Names and nested page IDs
come from the product catalog; extra pages and formats remain project-defined.
Assets and fonts live in `workspace/assets/<layer>/`, styles in
`workspace/styles/`. Exported files are derivatives, not additional editable
sources; browser downloads and gitignored `apps/studio/output/` hold exports.

## Startup reuse

Shared navigation, Text/Layout, CJMs, review states and export engines live in
`workspace/utils/{components,products,media,design}/`; they are reused directly.
Do not copy them into a product or a startup-specific utility directory. Reusable
methods and starter templates live in `.agents/`; executable checks and isolated
fixtures live in `tools/studio/`.

The empty startup catalog inherits the complete singlepage catalog as reference.
Once startup defines products, its complete catalog, models and materials replace
that reference set. Missing startup files produce an error rather than borrowing
an unrelated framework file. The functionality remains shared in either case;
client business facts, assets, layouts and confirmations belong to startup.

A product TSX may use local data/helpers and shared utilities. A downstream project
provides its own copy/layout/style; it need not reproduce the framework's example
cover or presentation composition to obtain the same review/export controls.

# Product directory guide

Each source layer has one catalog and two kinds of owned content:

```text
products/
  README.md
  singlepage/                       # framework project's business materials
    catalog.yaml
    models/
      <model-id>/model.md            # shared Operations & Economics
    <product-id>/                    # one product's business and authored materials
  startup/                          # downstream project's owned materials
    catalog.yaml
    models/<model-id>/model.md       # created when the project defines its model
    <product-id>/                   # created when the project defines its product
```

## Models and products

`models` is the reserved namespace for business economics, not application code.
A model owns revenue, financing, resources and costs; several products may share
it. The catalog's `models[].id/source` and each product's `model` establish the
relationship. Do not copy a common model into each product or mix it with backend
models under `libs/modules`.

In the framework catalog, `framework-service/model.md` links Code Framework and
AI Chat because they share funding and resources. It appears in each product's
Operations & Economics tab from the same source. `framework-service` is its
stable catalog ID, not a third product or a running service. The product directory
`singlepagestartup` is Code Framework's stable ID; its display name is independent.

## Inside one product

- `product.md`: offer and customer segments.
- `sales.yaml`: segment profiles, acquisition and Customer Journey Maps. The
  shared renderer creates segment pages and Markdown exports from this source.
- `research.md` + `research/`: summary, segment evidence and competitor details.
- `website.md` + `website/`: visitor journey, individual page text and layouts.
- `marketing-creative.md` + `marketing-creative/`: plan and editable covers,
  articles, storyboards, posts and selected motion compositions.
- `presentation/data.yaml` + `presentation/*.tsx`: independent presentation copy
  and its slide compositions. Product-specific types may live beside those slides.
- `content/`: optional delivered material such as guides or a proposed README.

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

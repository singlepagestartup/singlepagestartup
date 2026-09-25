import type { Meta, StoryObj } from "@storybook/react-vite";
import { parse, stringify } from "yaml";
import { ProductCatalog } from "../../../../apps/studio/workspace/utils/components/ProductCatalog";
import { parseProductCatalog } from "../../../../apps/studio/workspace/utils/products/catalog";
import { resolveProductSections } from "../../../../apps/studio/workspace/utils/products/pages";
import {
  parseSalesProcess,
  salesOverviewMarkdown,
} from "../../../../apps/studio/workspace/utils/products/sales";
import { salesSegmentPages } from "../../../../apps/studio/workspace/utils/components/SalesSegment";
import type {
  IProductCatalogView,
  IProductDocument,
} from "../../../../apps/studio/workspace/utils/products/source";
import { extensionProduct } from "./catalog";
import Deck from "./startup/example/presentation/Deck";
import ReviewDeck from "./startup/example/presentation/ReviewDeck";
import salesSource from "./startup/example/sales.yaml?raw";
import presentationSource from "./startup/example/presentation/data.yaml?raw";

const catalog = parseProductCatalog(
  stringify({
    schema: "singlepagestartup.product-catalog.v2",
    models: [
      {
        id: "training",
        name: "Course economics",
        source: "models/training/model.md",
      },
    ],
    products: [
      {
        ...extensionProduct,
        model: "training",
        sections: [
          ...extensionProduct.sections.map((section) =>
            section.id === "creative"
              ? {
                  ...section,
                  pages: [
                    ...section.pages,
                    {
                      id: "cover",
                      title: "Course cover",
                      representations: {
                        text: "example/marketing-creative/cover.md",
                        preview: "example/marketing-creative/Cover.tsx",
                      },
                    },
                    {
                      id: "motion",
                      title: "Course motion",
                      representations: {
                        text: "example/marketing-creative/cover.md",
                        preview: "example/marketing-creative/Motion.tsx",
                      },
                    },
                  ],
                }
              : section,
          ),
          {
            id: "research",
            title: "Research",
            pages: [
              {
                id: "segments",
                title: "Customer segments",
                children: [
                  {
                    id: "learners",
                    title: "Individual learners",
                    source: "example/research/learners.md",
                  },
                  {
                    id: "teams",
                    title: "Training teams",
                    source: "example/research/teams.md",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }),
  "startup",
);
const components = import.meta.glob<{ default?: React.ComponentType }>(
  "./startup/**/*.{tsx,jsx}",
  { eager: true },
);
const markdown = import.meta.glob<string>("./startup/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});
const files = import.meta.glob("./startup/**/*", {
  query: "?url",
  import: "default",
});
const keys = <T,>(value: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(value).map(([key, source]) => [key.slice(2), source]),
  );
const sections = resolveProductSections(
  catalog.products[0].sections,
  "startup",
  {
    components: keys(components),
    markdown: keys(markdown),
    files: new Set(Object.keys(keys(files))),
  },
);
const confirmation = {
  confirmed: false,
  state: "unconfirmed",
  layer: "startup",
} as const;
const sales = parseSalesProcess(salesSource, "example");
const sourcePath = (file: string) =>
  `apps/studio/workspace/products/startup/${file}`;
sections.push({
  id: "sales",
  title: "Sales",
  pages: salesSegmentPages(
    sales,
    "startup",
    sourcePath("example/sales.yaml"),
    confirmation,
  ),
});
const documents: IProductDocument[] = (
  [
    ["product", "example/product.md"],
    ["model", "models/training/model.md"],
    ["research", "example/research.md"],
    ["website", "example/website.md"],
    ["creative", "example/marketing-creative.md"],
  ] as const
).map(([kind, file]) => ({
  kind,
  label: kind,
  sourcePath: sourcePath(file),
  content: keys(markdown)[`startup/${file}`],
  confirmation,
}));
documents.push({
  kind: "sales",
  label: "Sales",
  sourcePath: sourcePath("example/sales.yaml"),
  content: salesOverviewMarkdown(sales),
  confirmation,
});
const view: IProductCatalogView = {
  id: "startup",
  label: "Independent startup",
  inherited: false,
  sourcePaths: [],
  products: [
    {
      id: "example",
      name: "Independent course",
      summary: "Startup-owned course materials.",
      model: {
        id: "training",
        name: "Course economics",
        products: ["example"],
      },
      sections,
      documents,
      presentation: {
        Component: Deck,
        content: parse(presentationSource).content,
        confirmation,
        dataSourcePath: sourcePath("example/presentation/data.yaml"),
        sourcePath: sourcePath("example/presentation/Deck.tsx"),
      },
    },
  ],
};
const meta = {
  title: "Verification/Product extensions",
  component: ProductCatalog,
  parameters: { layout: "fullscreen" },
  args: { view },
} satisfies Meta<typeof ProductCatalog>;
export default meta;
export const NestedPages: StoryObj<typeof meta> = {};
export const SharedSlides: StoryObj<typeof meta> = {
  args: {
    view: {
      ...view,
      products: view.products.map((product) => ({
        ...product,
        presentation: {
          ...product.presentation!,
          Component: ReviewDeck,
          sourcePath: sourcePath("example/presentation/ReviewDeck.tsx"),
        },
      })),
    },
  },
};

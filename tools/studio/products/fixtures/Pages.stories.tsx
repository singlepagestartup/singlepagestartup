import type { Meta, StoryObj } from "@storybook/react-vite";
import { parse, stringify } from "yaml";
import { ProductCatalog } from "../../../../apps/studio/workspace/utils/components/ProductCatalog";
import { parseProductCatalog } from "../../../../apps/studio/workspace/utils/products/catalog";
import { resolveProductSections } from "../../../../apps/studio/workspace/utils/products/pages";
import {
  parseSalesProcess,
  salesOverviewMarkdown,
} from "../../../../apps/studio/workspace/utils/products/sales";
import type {
  IProductCatalogView,
  IProductDocument,
} from "../../../../apps/studio/workspace/utils/products/source";
import { extensionProduct } from "./catalog";
import Deck from "./startup/example/presentation/Deck";
import ReviewDeck from "./startup/example/presentation/ReviewDeck";
import salesSource from "./startup/example/sales.yaml?raw";

const catalog = parseProductCatalog(
  stringify({
    schema: "singlepagestartup.product-catalog.v2",
    products: [
      {
        ...extensionProduct,
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
                      source: "example/marketing-creative/Cover.tsx",
                    },
                    {
                      id: "motion",
                      title: "Course motion",
                      source: "example/marketing-creative/Motion.tsx",
                    },
                  ],
                }
              : section,
          ),
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
const sourcePath = (source: string) =>
  `apps/studio/workspace/products/startup/${source}`;
const view: IProductCatalogView = {
  id: "startup",
  label: "Startup",
  inherited: false,
  sourcePaths: [],
  products: [
    {
      id: "example",
      name: "Extension fixture",
      summary: "Owned materials",
      sections,
      documents: [
        {
          kind: "product",
          label: "Описание",
          content: "# Описание\n\nСобственные данные проекта.",
          sourcePath: sourcePath("example/product.md"),
        },
      ],
      presentation: {
        Component: Deck,
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

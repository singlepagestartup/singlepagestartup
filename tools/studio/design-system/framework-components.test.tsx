import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { globSync } from "tinyglobby";
import {
  Component as Product,
  Skeleton as ProductSkeleton,
  defaultProductCardProps,
} from "../../../apps/studio/modules/ecommerce/product";
import { Component as EcommerceCategory } from "../../../apps/studio/modules/ecommerce/category";
import { Component as BlogCategory } from "../../../apps/studio/modules/blog/category";
import { Component as Article } from "../../../apps/studio/modules/blog/article";
import { Skeleton as ProductGridSkeleton } from "../../../apps/studio/modules/ecommerce/widget/singlepage/product-find-card/Skeleton";
import { Skeleton as CategoryGridSkeleton } from "../../../apps/studio/modules/blog/widget/singlepage/category-find-card/Skeleton";

test("generic collection projections belong to widgets, not single-record models", () => {
  const lists = globSync(
    "apps/studio/modules/*/*/singlepage/list/Component.tsx",
  );
  expect(lists.length).toBeGreaterThan(0);
  expect(lists.filter((file) => !file.includes("/widget/"))).toEqual([]);
});

test("model loading represents one product; collection loading composes individual model skeletons", () => {
  const single = renderToStaticMarkup(
    <ProductSkeleton variant="card" rows={8} />,
  );
  expect(single.match(/data-skeleton-entity="single"/g)).toHaveLength(1);
  expect(single).not.toContain("sm:grid-cols-2");
  for (const grid of [<ProductGridSkeleton />, <CategoryGridSkeleton />]) {
    const html = renderToStaticMarkup(grid);
    expect(html).toContain('data-skeleton-layout="grid"');
    expect(html.match(/data-skeleton-entity="single"/g)).toHaveLength(3);
  }
});

test("public category cards preserve title, formatted subtitle, relation content and category link", () => {
  for (const Category of [EcommerceCategory, BlogCategory]) {
    const html = renderToStaticMarkup(
      <Category
        variant="card"
        title="Category title"
        subtitleContent={
          <p>
            A <strong>formatted subtitle</strong>
          </p>
        }
        href="/en/categories/example"
        image=""
      >
        <p>Related widget</p>
      </Category>,
    );
    expect(html).toContain("Category title");
    expect(html).toContain("<strong>formatted subtitle</strong>");
    expect(html).toContain("Related widget");
    expect(html).toContain('href="/en/categories/example"');
    expect(html).not.toContain("Record ID");
  }
});

test("product card preserves multiple category links, media and arbitrary attributes alongside purchase controls", () => {
  const html = renderToStaticMarkup(
    <Product
      {...defaultProductCardProps}
      variant="card"
      categories={[
        { id: "a", label: "Category A", href: "/category/a" },
        { id: "b", label: "Category B", href: "/category/b" },
      ]}
      media={[
        { id: "a", src: "/a.png", alt: "First image" },
        { id: "b", src: "/b.png", alt: "Second image" },
      ]}
      attributes={[
        { id: "custom", label: "Custom property", value: "Custom value" },
      ]}
    />,
  );
  for (const value of [
    "/category/a",
    "/category/b",
    "Second image",
    "Custom property",
    "Custom value",
    "USD",
    "EUR",
    "RUB",
    "Buy now",
    "Add to cart",
  ])
    expect(html).toContain(value);
});

test("unavailable article content is never mounted in any closed presentation state", () => {
  for (const access of [
    "guest",
    "locked",
    "expired",
    "checking",
    "error",
  ] as const) {
    const html = renderToStaticMarkup(
      <Article variant="private-content-default" access={access}>
        <p>PRIVATE-CONTENT-MARKER</p>
      </Article>,
    );
    expect(html).not.toContain("PRIVATE-CONTENT-MARKER");
    expect(html).toContain(`data-access="${access}"`);
  }
  const granted = renderToStaticMarkup(
    <Article variant="private-content-default" access="granted">
      <p>PRIVATE-CONTENT-MARKER</p>
    </Article>,
  );
  expect(granted).toContain("PRIVATE-CONTENT-MARKER");
});

import { Component as WebsiteBuilderSlider } from "../../../apps/studio/modules/website-builder/slider";

test("slider navigation offers one control pattern without duplicated pagination", () => {
  const arrows = renderToStaticMarkup(
    <WebsiteBuilderSlider variant="default" navigation="arrows" />,
  );
  expect(arrows).toContain('aria-label="Next slide"');
  expect(arrows).toContain('aria-label="Previous slide"');
  expect(arrows).not.toContain('aria-label="Show slide');
  for (const navigation of ["numbers", "dots"] as const) {
    const html = renderToStaticMarkup(
      <WebsiteBuilderSlider variant="default" navigation={navigation} />,
    );
    expect(html).not.toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Previous slide"');
    expect(html.match(/aria-label="Show slide/g)).toHaveLength(3);
  }
  const single = renderToStaticMarkup(
    <WebsiteBuilderSlider
      variant="default"
      navigation="numbers"
      slides={[
        {
          id: "one",
          title: "One slide",
          image: "/image.png",
          imageAlt: "One image",
        },
      ]}
    />,
  );
  expect(single).not.toContain('aria-label="Show slide');
  expect(single).not.toContain('aria-label="Next slide"');
});

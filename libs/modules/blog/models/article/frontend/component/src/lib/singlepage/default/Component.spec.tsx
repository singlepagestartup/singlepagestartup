/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { Component as ArticleCard } from "./Component";
import { Component as CategoryCard } from "../../../../../../../category/frontend/component/src/lib/singlepage/default/Component";
const mockReads = jest.fn();
const mockCategories = [
  { id: "category-a", slug: "guides", title: { ru: "Руководства" } },
  { id: "category-b", slug: "systems", title: { ru: "Системы" } },
];
jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value, className }: any) => (
    <div className={className} dangerouslySetInnerHTML={{ __html: value }} />
  ),
}));
jest.mock("@sps/blog/models/category/frontend/component", () => ({
  Component: (props: any) => {
    mockReads(props);
    return props.children({ data: mockCategories });
  },
}));
jest.mock(
  "@sps/blog/relations/categories-to-articles/frontend/component",
  () => ({
    Component: (props: any) => {
      mockReads(props);
      const filter = props.apiProps.params.filters.and[0];
      return props.children({
        data:
          filter.column === "articleId"
            ? [
                {
                  id: "ca-b",
                  articleId: filter.value,
                  categoryId: "category-b",
                },
                {
                  id: "ca-a",
                  articleId: filter.value,
                  categoryId: "category-a",
                },
              ]
            : [
                {
                  id: "ca-a",
                  categoryId: filter.value,
                  articleId: "article-a",
                },
                {
                  id: "ca-b",
                  categoryId: filter.value,
                  articleId: "article-b",
                },
              ],
      });
    },
  }),
);
jest.mock(
  "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: any) => {
      mockReads(props);
      return props.variant === "find" ? (
        props.children({
          data: [
            {
              id: "cover-a",
              articleId: props.apiProps.params.filters.and[0].value,
            },
          ],
        })
      ) : (
        <img src={`/${props.data.id}.png`} alt="Saved cover" />
      );
    },
  }),
);
beforeEach(() => mockReads.mockClear());
it.each([true, false])(
  "renders real article categories, media and author with one stretched primary link in runtime %s",
  (isServer) => {
    const { container } = render(
      <ArticleCard
        isServer={isServer}
        variant="default"
        language="ru"
        data={
          {
            id: "article-a",
            slug: "architecture",
            createdAt: "2026-10-23T00:00:00Z",
            title: { ru: "Архитектура" },
            subtitle: {
              ru: '<p>Описание с <a href="/reference">источником</a></p>',
            },
          } as any
        }
        author={<span>Сохранённый автор</span>}
      />,
    );
    const article = container.querySelector("article")!;
    const primary = within(article).getByRole("link", { name: "Архитектура" });
    expect(primary).toHaveAttribute("href", "/ru/blog/articles/architecture");
    expect(primary).toHaveClass("after:absolute", "after:inset-0");
    primary.focus();
    expect(primary).toHaveFocus();
    expect(primary.className).toContain("focus-visible:after:outline-2");
    expect(article.querySelector("a a")).toBeNull();
    expect(
      within(article)
        .getAllByRole("link")
        .filter(
          (link) =>
            link.getAttribute("href") === "/ru/blog/articles/architecture",
        ),
    ).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Системы" })).toHaveAttribute(
      "href",
      "/ru/blog/categories/systems",
    );
    expect(screen.getByRole("link", { name: "Руководства" })).toHaveClass(
      "relative",
      "z-10",
    );
    expect(article.textContent!.indexOf("Системы")).toBeLessThan(
      article.textContent!.indexOf("Руководства"),
    );
    expect(screen.getByRole("link", { name: "источником" })).toHaveAttribute(
      "href",
      "/reference",
    );
    expect(screen.getByRole("img", { name: "Saved cover" })).toHaveAttribute(
      "src",
      "/cover-a.png",
    );
    expect(screen.getByText("Сохранённый автор")).toBeVisible();
    expect(article.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-10-23T00:00:00.000Z",
    );
    const queries = mockReads.mock.calls
      .map(([props]) => props)
      .filter((props) => props.variant === "find");
    expect(queries.every((props) => props.isServer === isServer)).toBe(true);
    expect(
      queries.find(
        (props) => props.apiProps.params.filters.and[0].column === "articleId",
      ).apiProps.params.filters.and[0].value,
    ).toBe("article-a");
  },
);
it("makes the category card one accessible destination and derives its cover/count from real ordered article links", () => {
  const { container } = render(
    <CategoryCard
      isServer={true}
      variant="default"
      language="ru"
      data={
        {
          id: "category-a",
          slug: "guides",
          title: { ru: "Руководства" },
          subtitle: { ru: "Описание" },
        } as any
      }
    />,
  );
  const primary = screen.getByRole("link", { name: "Руководства" });
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(primary).toHaveAttribute("href", "/ru/blog/categories/guides");
  expect(primary).toHaveClass("after:absolute", "after:inset-0");
  primary.focus();
  expect(primary).toHaveFocus();
  expect(container.querySelector("a a")).toBeNull();
  expect(screen.getByText("Статей: 2")).toBeVisible();
  expect(screen.getByRole("img", { name: "Saved cover" })).toHaveAttribute(
    "src",
    "/cover-a.png",
  );
  const mediaQuery = mockReads.mock.calls
    .map(([props]) => props)
    .find((props) => props.apiProps?.params.limit === 1);
  expect(mediaQuery.apiProps.params.filters.and).toEqual([
    { column: "articleId", method: "eq", value: "article-a" },
  ]);
  expect(mediaQuery.apiProps.params.orderBy.and).toEqual([
    { column: "orderIndex", method: "asc" },
  ]);
});
it.each(["en", "ru"])(
  "keeps untitled Article and Category cards named for keyboard and assistive navigation in %s",
  (language) => {
    const { unmount } = render(
      <ArticleCard
        isServer={true}
        variant="default"
        language={language}
        data={
          {
            id: "article-a",
            slug: "untitled",
            title: { en: "", ru: "   " },
          } as any
        }
      />,
    );
    const article = screen.getByRole("link", {
      name: language === "ru" ? "Читать статью" : "Read article",
    });
    expect(article).toHaveAttribute(
      "href",
      `/${language}/blog/articles/untitled`,
    );
    article.focus();
    expect(article).toHaveFocus();
    unmount();
    render(
      <CategoryCard
        isServer={true}
        variant="default"
        language={language}
        data={
          {
            id: "category-a",
            slug: "untitled",
            title: { en: "", ru: "   " },
          } as any
        }
      />,
    );
    const category = screen.getByRole("link", {
      name: language === "ru" ? "Открыть категорию" : "Explore category",
    });
    expect(category).toHaveAttribute(
      "href",
      `/${language}/blog/categories/untitled`,
    );
    category.focus();
    expect(category).toHaveFocus();
  },
);

/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

let articleQuery: any;
let articleCard: any;
let articles: any[] = [
  {
    id: "article-1",
    slug: "first",
    variant: "overview-default",
    title: { ru: "Первая статья" },
  },
];

jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      articleQuery = props;
      return props.children({ data: articles });
    }
    articleCard = props;
    return (
      <a href={`/blog/articles/${props.data.slug}`}>
        {props.data.title[props.language]}
      </a>
    );
  },
}));

describe("profile article relation display", () => {
  it.each([true, false])(
    "loads its own article and uses the card in runtime %s",
    (isServer) => {
      articles = [
        {
          id: "article-1",
          slug: "first",
          variant: "overview-default",
          title: { ru: "Первая статья" },
        },
      ];
      render(
        <Component
          isServer={isServer}
          variant="default"
          language="ru"
          data={{ id: "link-1", blogModuleArticleId: "article-1" } as any}
        />,
      );
      expect(articleQuery.apiProps.params.filters.and).toEqual([
        { column: "id", method: "eq", value: "article-1" },
      ]);
      expect(articleQuery.isServer).toBe(isServer);
      expect(articleCard.variant).toBe("default");
      expect(articleCard.isServer).toBe(isServer);
      expect(articleCard.language).toBe("ru");
      expect(screen.getByRole("link").getAttribute("href")).toBe(
        "/blog/articles/first",
      );
    },
  );

  it("omits the card when the article lookup is empty", () => {
    articles = [];
    render(
      <Component
        isServer={false}
        variant="default"
        language="en"
        data={{ id: "link-1", blogModuleArticleId: "article-1" } as any}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});

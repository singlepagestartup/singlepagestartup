/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

const fixtures = [
  {
    id: "link-b",
    profileId: "profile-1",
    orderIndex: 2,
    blogModuleArticleId: "article-b",
  },
  {
    id: "link-a",
    profileId: "profile-1",
    orderIndex: 1,
    blogModuleArticleId: "article-a",
  },
  {
    id: "link-other",
    profileId: "profile-2",
    orderIndex: 0,
    blogModuleArticleId: "article-other",
  },
];
let queryProps: any;

jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/frontend/component",
  () => ({
    Component: (props: any) => {
      if (props.variant === "find") {
        queryProps = props;
        const profileId = props.apiProps.params.filters.and[0].value;
        return props.children({
          data: fixtures
            .filter((item) => item.profileId === profileId)
            .sort((a, b) => a.orderIndex - b.orderIndex),
        });
      }
      return (
        <article
          data-testid="article-card"
          data-runtime={String(props.isServer)}
          data-language={props.language}
        >
          {props.data.blogModuleArticleId}
        </article>
      );
    },
  }),
);

describe("profile article listing", () => {
  it.each([true, false])(
    "scopes cards and forwards language in runtime %s",
    (isServer) => {
      const { container } = render(
        <Component
          isServer={isServer}
          variant="articles-default"
          language="ru"
          data={{ id: "profile-1", className: "rounded-lg" } as any}
          className="p-6"
        />,
      );
      expect(queryProps.apiProps.params.filters.and).toEqual([
        { column: "profileId", method: "eq", value: "profile-1" },
      ]);
      expect(queryProps.apiProps.params.orderBy.and).toEqual([
        { column: "orderIndex", method: "asc" },
      ]);
      expect(queryProps.isServer).toBe(isServer);
      const cards = screen.getAllByTestId("article-card");
      expect(cards.map((card) => card.textContent)).toEqual([
        "article-a",
        "article-b",
      ]);
      for (const card of cards) {
        expect(card.getAttribute("data-language")).toBe("ru");
        expect(card.getAttribute("data-runtime")).toBe(String(isServer));
      }
      expect(container.firstElementChild?.className).toContain(
        "sm:grid-cols-2",
      );
      expect(container.firstElementChild?.className).toContain(
        "lg:grid-cols-3",
      );
      expect(container.firstElementChild?.className).toContain("p-6");
    },
  );

  it("renders no cards for a profile without links", () => {
    render(
      <Component
        isServer={false}
        variant="articles-default"
        language="en"
        data={{ id: "empty-profile" } as any}
      />,
    );
    expect(screen.queryByTestId("article-card")).toBeNull();
  });
});

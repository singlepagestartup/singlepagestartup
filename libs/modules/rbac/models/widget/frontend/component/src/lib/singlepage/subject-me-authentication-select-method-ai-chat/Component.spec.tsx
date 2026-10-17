/** @jest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
let action = "select-method";
const relationRead = jest.fn();
const contentRead = jest.fn();
const link = () => ({
  id: `link-${action}`,
  widgetId: `rbac-${action}`,
  websiteBuilderModuleWidgetId: `website-${action}`,
  variant: "ai-chat-content",
});
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/rbac/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: ({ id }: any) => ({
      data: { id, variant: `subject-me-authentication-${action}-ai-chat` },
      isLoading: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/widget/sdk/server", () => ({ api: {} }));
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/sdk/client",
  () => ({
    Provider: ({ children }: any) => <>{children}</>,
    api: {
      find: (props: any) => {
        relationRead(props);
        const owner = props.params.filters.and.find(
          (filter: any) => filter.column === "widgetId",
        ).value;
        return {
          data: [
            {
              ...link(),
              widgetId: owner,
              websiteBuilderModuleWidgetId: `website-${owner}`,
            },
          ],
          isLoading: false,
        };
      },
      findById: () => ({ data: link(), isLoading: false }),
    },
  }),
);
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/sdk/server",
  () => ({ api: {} }),
);
jest.mock("@sps/website-builder/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    find: (props: any) => {
      contentRead(props);
      const id = props.params.filters.and.find(
        (filter: any) => filter.column === "id",
      ).value;
      return {
        data: [
          {
            id,
            variant: "content-ai-chat-authentication",
            title: { en: `Title ${id}` },
          },
        ],
        isLoading: false,
      };
    },
  },
}));
jest.mock("@sps/website-builder/models/widget/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => <form aria-label={props.variant} />,
}));
import { Component as Widget } from "@sps/rbac/models/widget/frontend/component";
afterEach(cleanup);
it.each(["select-method", "registration", "forgot-password", "reset-password"])(
  "renders %s auth through that RBAC instance's link and preserves its frame",
  (value) => {
    action = value;
    relationRead.mockClear();
    contentRead.mockClear();
    const { container } = render(
      <Widget
        isServer={false}
        variant={`subject-me-authentication-${action}-ai-chat` as any}
        data={{ id: `rbac-${action}` } as any}
        language="en"
      />,
    );
    expect(relationRead).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "widgetId", method: "eq", value: `rbac-${action}` },
            { column: "variant", method: "eq", value: "ai-chat-content" },
          ],
        },
      },
    });
    expect(contentRead).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "id", method: "eq", value: `website-rbac-${action}` },
          ],
        },
      },
    });
    expect(
      container.querySelector(
        '[data-variant="content-ai-chat-authentication"]',
      ),
    ).toBeTruthy();
    expect(screen.getAllByRole("img")).toHaveLength(
      action === "registration" ? 2 : 1,
    );
    const subjectVariant =
      action === "select-method" ? "authentication" : action;
    expect(
      screen.getByRole("form", {
        name: `me-authentication-email-and-password-${subjectVariant}-form-ai-chat`,
      }),
    ).toBeTruthy();
  },
);

it("keeps two same-variant authentication instances bound to their own saved content", () => {
  action = "select-method";
  const { container } = render(
    <>
      <Widget
        isServer={false}
        variant="subject-me-authentication-select-method-ai-chat"
        data={{ id: "rbac-a" } as any}
      />
      <Widget
        isServer={false}
        variant="subject-me-authentication-select-method-ai-chat"
        data={{ id: "rbac-b" } as any}
      />
    </>,
  );
  const frames = [
    ...container.querySelectorAll(
      '[data-module="website-builder"][data-variant="content-ai-chat-authentication"]',
    ),
  ];
  expect(
    screen.getByRole("heading", { name: "Title website-rbac-a" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Title website-rbac-b" }),
  ).toBeTruthy();
  expect(frames.map((frame) => frame.getAttribute("data-id")).sort()).toEqual([
    "website-rbac-a",
    "website-rbac-b",
  ]);
});

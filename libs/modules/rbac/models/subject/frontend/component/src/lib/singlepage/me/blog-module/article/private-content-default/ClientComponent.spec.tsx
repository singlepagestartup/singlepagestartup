/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";
const mockWidget = jest.fn();
jest.mock("@sps/shared-frontend-client-api", () => ({
  QueryScopeProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock("@sps/website-builder/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    mockWidget(props);
    return <div data-testid={props.data.id}>{props.data.description.en}</div>;
  },
}));
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  ProtectedMediaProvider: ({ children, scopeKey }: any) => (
    <div data-scope={scopeKey}>{children}</div>
  ),
}));
jest.mock("@sps/blog/models/article/frontend/component", () => ({
  Component: jest.requireActual(
    "@sps/blog/models/article/frontend/component/src/lib/singlepage/private-content-default/Component",
  ).Component,
}));
const publicItem = (key: string, orderIndex: number) => ({
  kind: "public",
  key,
  orderIndex,
  relation: { id: `relation-${key}` },
  widget: { id: key, variant: "content-default", description: { en: key } },
});
const privateItem = {
  kind: "private",
  key: "slot-1",
  orderIndex: 1,
  access: { state: "granted", expiresAt: "2030-01-01T00:00:00Z" },
  relation: { id: "secret-relation" },
  widget: {
    id: "secret-widget",
    variant: "content-default",
    description: { en: "SPS-PRIVATE-TEST" },
  },
};
function props(items: any[]) {
  return {
    isServer: false,
    variant: "me-blog-module-article-private-content-default",
    language: "en",
    blogModuleArticle: { id: "article" },
    data: { id: "subject" },
    queryScopePrefix: "subject:article:reader",
    state: "ready",
    content: {
      articleId: "article",
      checkedAt: "2026-01-01T00:00:00Z",
      access: { state: "granted", expiresAt: privateItem.access.expiresAt },
      items,
    },
    onRetry: jest.fn(),
  } as any;
}
beforeEach(() => mockWidget.mockClear());
it("keeps public/private positions and mounts granted private content through props only", () => {
  const { container } = render(
    <Component
      {...props([publicItem("before", 0), privateItem, publicItem("after", 2)])}
    />,
  );
  expect(
    [...container.querySelectorAll("[data-testid]")].map((node) =>
      node.getAttribute("data-testid"),
    ),
  ).toEqual(["before", "secret-widget", "after"]);
  expect(
    container.querySelector('[data-scope="subject:article:reader:slot-1"]'),
  ).not.toBeNull();
  expect(
    mockWidget.mock.calls.every(
      ([p]) => p.dataSource === "props" && p.isServer === false,
    ),
  ).toBe(true);
});
it.each(["guest", "locked", "expired"])(
  "never mounts a protected reader for a %s placeholder",
  (state) => {
    const denied = {
      kind: "private",
      key: "slot-1",
      orderIndex: 1,
      access: { state, expiresAt: null },
    };
    const { container } = render(
      <Component
        {...props([publicItem("before", 0), denied, publicItem("after", 2)])}
      />,
    );
    expect(mockWidget.mock.calls.map(([p]) => p.data.id)).toEqual([
      "before",
      "after",
    ]);
    expect(container.textContent).not.toContain("SPS-PRIVATE-TEST");
    expect(container.innerHTML).not.toContain("secret-widget");
  },
);
it("expiry removes granted children immediately while retaining public widgets", () => {
  const p = props([publicItem("before", 0), privateItem]);
  const { rerender } = render(<Component {...p} />);
  expect(screen.getByText("SPS-PRIVATE-TEST")).toBeVisible();
  rerender(<Component {...p} state="expired" />);
  expect(screen.queryByText("SPS-PRIVATE-TEST")).toBeNull();
  expect(screen.getByTestId("before")).toBeVisible();
  expect(screen.getByText("Renew your subscription")).toBeVisible();
});
it.each(["checking", "error"])(
  "does not retain granted children in %s state",
  (state) => {
    const p = props([privateItem]);
    const { rerender } = render(<Component {...p} />);
    rerender(<Component {...p} state={state} />);
    expect(screen.queryByText("SPS-PRIVATE-TEST")).toBeNull();
  },
);

it("access failure preserves public positions, error-frames private slots and retry restores granted content", () => {
  const p = props([
    publicItem("before", 0),
    privateItem,
    publicItem("after", 2),
  ]);
  const { rerender, container } = render(<Component {...p} />);
  rerender(<Component {...p} state="error" />);
  expect(screen.queryByText("SPS-PRIVATE-TEST")).toBeNull();
  expect(screen.getByTestId("before")).toBeVisible();
  expect(screen.getByTestId("after")).toBeVisible();
  expect(container.querySelector('[data-access="error"]')).not.toBeNull();
  expect(container.querySelector('[data-access="granted"]')).toBeNull();
  rerender(<Component {...p} state="ready" />);
  expect(screen.getByText("SPS-PRIVATE-TEST")).toBeVisible();
});

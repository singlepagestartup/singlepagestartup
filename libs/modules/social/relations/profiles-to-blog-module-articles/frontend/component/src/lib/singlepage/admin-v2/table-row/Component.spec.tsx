/** @jest-environment jsdom */

import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Component as V2Row } from "./Component";
import { Component as LegacyRow } from "../../admin/table-row/Component";

const mutate = jest.fn();
const rowProps = new Map<string, any>();

jest.mock("../form", () => ({ Component: () => null }));
jest.mock("../../admin/form", () => ({ Component: () => null }));

jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/client",
  () => ({ api: { delete: () => ({ mutate }) } }),
);
jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component",
  () => ({
    Component: (props: any) => {
      rowProps.set(props.data.id, props);
      return (
        <div data-testid={props.data.id}>
          {props.children}
          <button onClick={props.onDelete}>Delete</button>
        </div>
      );
    },
  }),
);
jest.mock(
  "@sps/shared-frontend-components/singlepage/admin/table-row/Component",
  () => ({
    Component: (props: any) => {
      rowProps.set(props.data.id, props);
      return (
        <div data-testid={props.data.id}>
          {props.children}
          <button onClick={props.onDelete}>Delete</button>
        </div>
      );
    },
  }),
);

describe.each([
  ["admin-table-row", LegacyRow],
  ["admin-v2-table-row", V2Row],
] as const)("%s relation row", (variant, RowComponent) => {
  const Row = RowComponent as React.ComponentType<any>;
  beforeEach(() => {
    mutate.mockClear();
    rowProps.clear();
  });

  it("shows endpoints and keeps deletion pending on the selected row", () => {
    const first = {
      id: "link-1",
      profileId: "profile-1",
      blogModuleArticleId: "article-1",
      orderIndex: 2,
      variant: "default",
      className: "p-4",
    };
    const second = { ...first, id: "link-2", profileId: "profile-2" };
    render(
      <>
        {[first, second].map((data) => (
          <Row
            key={data.id}
            isServer={false}
            variant={variant}
            module="social"
            name="profiles-to-blog-module-articles"
            data={data}
          />
        ))}
      </>,
    );
    const firstRow = screen.getByTestId("link-1");
    const secondRow = screen.getByTestId("link-2");
    expect(within(firstRow).getByText("profile-1")).toBeDefined();
    expect(within(firstRow).getByText("article-1")).toBeDefined();
    fireEvent.click(within(firstRow).getByRole("button", { name: "Delete" }));
    fireEvent.click(within(firstRow).getByRole("button", { name: "Delete" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ id: "link-1" });
    expect(firstRow.parentElement?.getAttribute("aria-busy")).toBe("true");
    expect(secondRow.parentElement?.getAttribute("aria-busy")).toBe("false");
    act(() => mutate.mock.calls[0][1].onSettled());
    expect(firstRow.parentElement?.getAttribute("aria-busy")).toBe("false");
  });
});

it("forwards both linked model editor actions through the client boundary", () => {
  const left = jest.fn();
  const right = jest.fn();
  render(
    <V2Row
      isServer={false}
      variant="admin-v2-table-row"
      module="social"
      name="profiles-to-blog-module-articles"
      data={{ id: "linked-row" } as any}
      leftModelAdminForm={left}
      rightModelAdminForm={right}
      leftModelAdminFormLabel="Profile"
      rightModelAdminFormLabel="Article"
    />,
  );
  expect(rowProps.get("linked-row").leftModelAdminForm).toBe(left);
  expect(rowProps.get("linked-row").rightModelAdminForm).toBe(right);
  expect(rowProps.get("linked-row").leftModelAdminFormLabel).toBe("Profile");
  expect(rowProps.get("linked-row").rightModelAdminFormLabel).toBe("Article");
});

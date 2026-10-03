/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { Component as V2Table } from "./index";
import { Component as LegacyTable } from "../../admin/table";

let tableProps: any;
let formProps: any;
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/client",
  () => ({ Provider: () => null, api: {} }),
);
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/server",
  () => ({ api: {} }),
);
jest.mock("@sps/shared-frontend-components/singlepage/admin-v2/table", () => ({
  Component: (props: any) => {
    tableProps = props;
    return props.adminForm({ isServer: false });
  },
}));
jest.mock("@sps/shared-frontend-components/singlepage/admin/table", () => ({
  Component: (props: any) => {
    tableProps = props;
    return props.adminForm({ isServer: false });
  },
}));
jest.mock("./Component", () => ({ Component: () => null }));
jest.mock("../../admin/table/Component", () => ({ Component: () => null }));
jest.mock("../form", () => ({
  Component: (props: any) => {
    formProps = props;
    return <div>New relation</div>;
  },
}));
jest.mock("../../admin/form", () => ({
  Component: (props: any) => {
    formProps = props;
    return <div>New relation</div>;
  },
}));

describe.each([
  ["admin-table", LegacyTable],
  ["admin-v2-table", V2Table],
] as const)("%s embedded relation table", (variant, TableComponent) => {
  const Table = TableComponent as React.ComponentType<any>;

  it.each(["profileId", "blogModuleArticleId"])(
    "preserves %s scope and prefills its create form",
    (column) => {
      const parentId = "parent-1";
      const apiProps = {
        params: {
          filters: { and: [{ column, method: "eq", value: parentId }] },
        },
      };
      render(
        <Table
          isServer={false}
          variant={variant}
          apiProps={apiProps}
          defaultProfileId={column === "profileId" ? parentId : undefined}
          defaultBlogModuleArticleId={
            column === "blogModuleArticleId" ? parentId : undefined
          }
        />,
      );
      expect(tableProps.apiProps).toBe(apiProps);
      expect(formProps.defaultProfileId).toBe(
        column === "profileId" ? parentId : undefined,
      );
      expect(formProps.defaultBlogModuleArticleId).toBe(
        column === "blogModuleArticleId" ? parentId : undefined,
      );
      expect(formProps.isServer).toBe(false);
      expect(screen.getByText("New relation")).toBeDefined();
    },
  );

  it("preserves a caller-supplied create form", () => {
    const custom = jest.fn(() => <div>Custom form</div>);
    render(<Table isServer={false} variant={variant} adminForm={custom} />);
    expect(tableProps.adminForm).toBe(custom);
    expect(screen.getByText("Custom form")).toBeDefined();
  });
});

it("preserves linked model editors across the admin-v2 table boundary", () => {
  const left = jest.fn();
  const right = jest.fn();
  render(
    <V2Table
      isServer={false}
      variant="admin-v2-table"
      leftModelAdminForm={left}
      rightModelAdminForm={right}
      leftModelAdminFormLabel="Profile"
      rightModelAdminFormLabel="Article"
    />,
  );
  expect(tableProps.leftModelAdminForm).toBe(left);
  expect(tableProps.rightModelAdminForm).toBe(right);
  expect(tableProps.leftModelAdminFormLabel).toBe("Profile");
  expect(tableProps.rightModelAdminFormLabel).toBe("Article");
});

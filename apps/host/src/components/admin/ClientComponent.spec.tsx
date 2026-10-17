/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

jest.mock("client-only", () => ({}), { virtual: true });
const mockSubjectReader = jest.fn();
const mockRoleReader = jest.fn();
const mockSubjectRoleReader = jest.fn();
let mockSubject: { id: string } | undefined;
let mockAuthenticated = true;
let mockSubjectRoles: { subjectId: string; roleId: string }[];
let mockRoles: { id: string; slug: string }[];
let mockAuthorizedSubjects: Set<string>;
const mockAuthorization = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    authenticationIsAuthorized: (props: any) => {
      mockAuthorization(props);
      const subjectId = props.reactQueryOptions.queryKey[1];
      const authorized = mockAuthorizedSubjects.has(subjectId);
      return {
        data: authorized ? { ok: true } : undefined,
        isError: !authorized,
      };
    },
  },
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "authentication-is-authorized-wrapper-default") {
      const Authorized = jest.requireActual(
        "../../../../../libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/is-authorized-wrapper-default/client",
      ).default;
      return <Authorized {...props} />;
    }
    mockSubjectReader(props);
    return props.children({
      data: mockSubject,
      authenticated: Boolean(mockSubject) && mockAuthenticated,
    });
  },
}));
jest.mock("@sps/rbac/relations/subjects-to-roles/frontend/component", () => ({
  Component: (props: any) => {
    mockSubjectRoleReader(props);
    const subjectId = props.apiProps.params.filters.and.find(
      (filter: any) => filter.column === "subjectId",
    ).value;
    return props.children({
      data: mockSubjectRoles.filter(
        (relation) => relation.subjectId === subjectId,
      ),
    });
  },
}));
jest.mock("@sps/rbac/models/role/frontend/component", () => ({
  Component: (props: any) => {
    mockRoleReader(props);
    const filters = props.apiProps?.params.filters.and ?? [];
    const ids = filters.find((filter: any) => filter.column === "id")?.value;
    const slug = filters.find((filter: any) => filter.column === "slug")?.value;
    return props.children({
      data: mockRoles.filter(
        (role) =>
          (!ids || ids.includes(role.id)) && (!slug || role.slug === slug),
      ),
    });
  },
}));
jest.mock("./assets/Dashboard", () => ({
  Component: () => <div>Admin content</div>,
}));

import { Component as Admin } from "./ClientComponent";
import { Component as AdminV2 } from "../admin-v2/ClientComponent";

describe.each([
  ["Admin", () => <Admin />],
  ["AdminV2", () => <AdminV2>Admin content</AdminV2>],
] as const)("%s role checks", (_, view) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticated = true;
    mockSubject = { id: "visitor" };
    mockSubjectRoles = [];
    mockAuthorizedSubjects = new Set();
    mockRoles = [
      { id: "admin-role", slug: "admin" },
      { id: "member-role", slug: "member" },
    ];
  });

  it("does not check admin permissions for a visitor with a valid Subject session", () => {
    mockAuthenticated = false;
    render(view());
    expect(mockAuthorization).not.toHaveBeenCalled();
    expect(mockSubjectRoleReader).not.toHaveBeenCalled();
    expect(mockRoleReader).not.toHaveBeenCalled();
  });

  it("does not request protected role records for an anonymous Subject", () => {
    render(view());
    expect(mockSubjectRoleReader).not.toHaveBeenCalled();
    expect(mockRoleReader).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin content")).toBeNull();
  });

  it("does not show admin controls for an ordinary member", () => {
    mockSubjectRoles = [{ subjectId: "visitor", roleId: "member-role" }];
    render(view());
    expect(screen.queryByText("Admin content")).toBeNull();
    expect(mockRoleReader).not.toHaveBeenCalled();
  });

  it("limits role records to the authorized Subject's assignments", () => {
    mockAuthorizedSubjects.add("visitor");
    mockSubjectRoles = [{ subjectId: "visitor", roleId: "member-role" }];
    render(view());
    expect(screen.queryByText("Admin content")).toBeNull();
    expect(mockRoleReader.mock.calls[0][0].apiProps.params.filters.and).toEqual(
      [
        { column: "id", method: "inArray", value: ["member-role"] },
        { column: "slug", method: "eq", value: "admin" },
      ],
    );
  });

  it("preserves admin access and stops role reads after logout", () => {
    mockAuthorizedSubjects.add("visitor");
    mockSubjectRoles = [{ subjectId: "visitor", roleId: "admin-role" }];
    const { rerender } = render(view());
    expect(screen.getByText("Admin content")).toBeTruthy();

    mockRoleReader.mockClear();
    mockSubject = { id: "anonymous-after-logout" };
    rerender(view());
    expect(mockRoleReader).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin content")).toBeNull();
    expect(mockAuthorization.mock.calls.at(-1)?.[0]).toMatchObject({
      params: { permission: { route: "/api/rbac/roles", method: "GET" } },
      mute: true,
      reactQueryOptions: {
        queryKey: [
          "/api/rbac/subjects/authentication/is-authorized",
          "anonymous-after-logout",
          { route: "/api/rbac/roles", method: "GET", type: "HTTP" },
        ],
        retry: false,
      },
    });
  });

  it("does not query roles or assignments before a Subject exists", () => {
    mockSubject = undefined;
    render(view());
    expect(mockSubjectRoleReader).not.toHaveBeenCalled();
    expect(mockRoleReader).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin content")).toBeNull();
  });
});

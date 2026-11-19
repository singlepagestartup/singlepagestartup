/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { IProps as ISubjectClientProps } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as ISubject } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IRole } from "@sps/rbac/models/role/sdk/model";
import type { IModel as ISubjectRole } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import type { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IFindProps } from "@sps/shared-frontend-api";

type ISubjectFixture = Pick<ISubject, "id">;
type IRoleFixture = Pick<IRole, "id" | "slug">;
type ISubjectRoleFixture = Pick<ISubjectRole, "subjectId" | "roleId">;
type IAuthorizationProps = Extract<
  Parameters<typeof Subject>[0],
  { variant: "authentication-is-authorized-wrapper-default" }
>;

interface ISubjectReaderProps {
  variant: "authentication-me-default";
  children: (result: {
    data: ISubjectFixture | undefined;
    authenticated: boolean;
  }) => ReactNode;
}

interface IFixtureReaderProps<T> {
  apiProps?: { params?: IFindProps["params"] };
  children: (result: { data: T[] }) => ReactNode;
}

jest.mock("client-only", () => ({}), { virtual: true });
const mockSubjectReader = jest.fn();
const mockRoleReader = jest.fn();
const mockSubjectRoleReader = jest.fn();
let mockSubject: ISubjectFixture | undefined;
let mockAuthenticated = true;
let mockSubjectRoles: ISubjectRoleFixture[];
let mockRoles: IRoleFixture[];
let mockAuthorizedSubjects: Set<string>;
const mockAuthorization = jest.fn();
const mockAdminContent = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    authenticationIsAuthorized: (
      props: ISubjectClientProps["IAuthenticationIsAuthorizedProps"],
    ) => {
      mockAuthorization(props);
      const subjectId = props.reactQueryOptions?.queryKey?.[1];
      const authorized =
        typeof subjectId === "string" && mockAuthorizedSubjects.has(subjectId);
      return {
        data: authorized ? { ok: true } : undefined,
        isError: !authorized,
      };
    },
  },
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: ISubjectReaderProps | IAuthorizationProps) => {
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
  Component: (props: IFixtureReaderProps<ISubjectRoleFixture>) => {
    mockSubjectRoleReader(props);
    const subjectId = props.apiProps?.params?.filters?.and?.find(
      (filter) => filter.column === "subjectId",
    )?.value;
    return props.children({
      data: mockSubjectRoles.filter(
        (relation) => relation.subjectId === subjectId,
      ),
    });
  },
}));
jest.mock("@sps/rbac/models/role/frontend/component", () => ({
  Component: (props: IFixtureReaderProps<IRoleFixture>) => {
    mockRoleReader(props);
    const filters = props.apiProps?.params?.filters?.and ?? [];
    const idFilter = filters.find((filter) => filter.column === "id")?.value;
    const ids = Array.isArray(idFilter) ? idFilter : undefined;
    const slug = filters.find((filter) => filter.column === "slug")?.value;
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
jest.mock("../admin-v2/Component", () => ({
  Component: (props: unknown) => {
    mockAdminContent(props);
    return <div>Admin content</div>;
  },
}));

import { Component as Admin } from "./ClientComponent";
import { Component as AdminV2 } from "../admin-v2/ClientComponent";

describe.each([
  ["Admin", () => <Admin />],
  ["AdminV2", () => <AdminV2 url="/admin/host" language="ru" />],
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
    expect(mockAdminContent).not.toHaveBeenCalled();
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
    if (mockAdminContent.mock.calls.length) {
      expect(mockAdminContent).toHaveBeenLastCalledWith({
        isServer: false,
        url: "/admin/host",
        language: "ru",
        className: undefined,
      });
    }

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

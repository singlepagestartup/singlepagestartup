const mockProfileCreate = jest.fn();
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { create: (props: any) => mockProfileCreate(props) },
}));
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-secret" }));
import { Service } from "./ownership";

function records(prefix: string, naturalKey: string[]) {
  const rows: any[] = [];
  return {
    rows,
    find: jest.fn(async (props: any) =>
      rows
        .filter((row) =>
          (props?.params?.filters?.and ?? []).every((filter: any) =>
            filter.method === "inArray"
              ? filter.value.includes(row[filter.column])
              : row[filter.column] === filter.value,
          ),
        )
        .slice(0, props?.params?.limit ?? rows.length),
    ),
    findById: jest.fn(async ({ id }: any) => rows.find((row) => row.id === id)),
    create: jest.fn(async ({ data }: any) => {
      if (
        rows.some((row) =>
          naturalKey.every((column) => row[column] === data[column]),
        )
      )
        throw new Error("duplicate natural key");
      const record = { id: `${prefix}-${rows.length + 1}`, ...data };
      rows.push(record);
      return record;
    }),
    update: jest.fn(async ({ id, data }: any) => {
      const row = rows.find((row) => row.id === id);
      Object.assign(row, data);
      return row;
    }),
  };
}

function dependencies() {
  const profiles = records("profile", ["slug"]);
  mockProfileCreate.mockImplementation((props) => profiles.create(props));
  const links = records("subject-profile", [
    "subjectId",
    "socialModuleProfileId",
  ]);
  const role = records("role", ["slug"]);
  const permission = {
    ...records("permission", ["path", "method", "type"]),
    invalidateRouteResolutionCache: jest.fn(),
  };
  const subjectsToRoles = records("subject-role", ["subjectId", "roleId"]);
  const rolesToPermissions = records("role-permission", [
    "roleId",
    "permissionId",
  ]);
  const subject = {
    id: "owner",
    slug: "generated-account-name",
    variant: "default",
  };
  let tail = Promise.resolve();
  const service = {
    repository: {
      withSubjectLock: jest.fn((_scope, operation) => {
        const next = tail.then(operation);
        tail = next.then(
          () => undefined,
          () => undefined,
        );
        return next;
      }),
    },
    findById: jest.fn(async () => subject),
    subjectsToIdentities: {
      find: jest.fn(async () => [
        { identityId: "identity", subjectId: "owner" },
      ]),
    },
    subjectsToSocialModuleProfiles: links,
    socialModule: { profile: profiles },
    role,
    permission,
    subjectsToRoles,
    rolesToPermissions,
    isAuthorizedService: { invalidateSubjectRoleCache: jest.fn() },
  };
  return {
    service,
    profiles,
    links,
    role,
    permission,
    subjectsToRoles,
    rolesToPermissions,
  };
}

it("creates exactly one personal default profile and grants only its Subject's collection", async () => {
  const deps = dependencies();
  const service = new Service(deps.service as any);
  await service.ensure({ subjectId: "owner" });
  await service.ensure({ subjectId: "owner" });
  expect(deps.profiles.rows).toHaveLength(1);
  expect(deps.profiles.rows[0].title).toEqual({ en: "generated-account-name" });
  expect(deps.links.rows).toEqual([
    expect.objectContaining({
      subjectId: "owner",
      socialModuleProfileId: deps.profiles.rows[0].id,
      variant: "default",
    }),
  ]);
  expect(deps.role.rows).toHaveLength(1);
  expect(deps.permission.rows).toHaveLength(12);
  expect(deps.permission.rows.map((row) => [row.method, row.path])).toEqual([
    ["GET", "/api/rbac/subjects/owner"],
    ["GET", "/api/rbac/subjects/owner/billing-module/balance"],
    ["GET", "/api/rbac/subjects/owner/social-module/profiles"],
    ["GET", "/api/rbac/subjects/owner/social-module/profiles/projects"],
    ["POST", "/api/rbac/subjects/owner/social-module/profiles"],
    ["GET", "/api/rbac/subjects/owner/identities"],
    ["PATCH", "/api/rbac/subjects/owner/social-module/profiles/profile-1"],
    [
      "POST",
      "/api/rbac/subjects/owner/social-module/profiles/profile-1/avatar",
    ],
    ["GET", "/api/rbac/subjects/owner/social-module/profiles/profile-1/avatar"],
    ["PATCH", "/api/rbac/subjects/owner/identities/identity"],
    ["POST", "/api/rbac/subjects/owner/identities/identity/email-change/code"],
    [
      "POST",
      "/api/rbac/subjects/owner/identities/identity/email-change/verify",
    ],
  ]);
  expect(deps.rolesToPermissions.rows).toHaveLength(12);
  expect(deps.subjectsToRoles.rows).toEqual([
    expect.objectContaining({
      subjectId: "owner",
      roleId: deps.role.rows[0].id,
    }),
  ]);
});

it("does not adopt another Subject's profile with the reserved personal slug", async () => {
  const deps = dependencies();
  deps.profiles.rows.push({
    id: "foreign",
    slug: "subject-owner",
    variant: "default",
  });
  deps.links.rows.push({
    id: "foreign-link",
    subjectId: "other",
    socialModuleProfileId: "foreign",
    variant: "default",
  });
  await expect(
    new Service(deps.service as any).ensure({ subjectId: "owner" }),
  ).rejects.toThrow("another Subject");
  expect(deps.links.rows).toHaveLength(1);
  expect(deps.permission.create).not.toHaveBeenCalled();
});

it("keeps one personal profile under concurrent registration or login repair", async () => {
  const deps = dependencies();
  await Promise.all([
    new Service(deps.service as any).ensure({ subjectId: "owner" }),
    new Service(deps.service as any).ensure({ subjectId: "owner" }),
  ]);
  expect(deps.profiles.rows).toHaveLength(1);
  expect(deps.links.rows).toHaveLength(1);
  expect(deps.subjectsToRoles.rows).toHaveLength(1);
});

it("reuses an owned Telegram personal Profile even after its private slug changed", async () => {
  const deps = dependencies();
  deps.profiles.rows.push({
    id: "telegram-personal",
    slug: "changed-private-handle",
    variant: "telegram",
  });
  deps.links.rows.push({
    id: "personal-link",
    subjectId: "owner",
    socialModuleProfileId: "telegram-personal",
    variant: "default",
  });
  const result = await new Service(deps.service as any).ensure({
    subjectId: "owner",
  });
  expect(result.profile.id).toBe("telegram-personal");
  expect(deps.profiles.create).not.toHaveBeenCalled();
  expect(deps.links.rows).toHaveLength(1);
});

it("does not create a personal profile or ownership grant for an anonymous session", async () => {
  const deps = dependencies();
  deps.service.subjectsToIdentities.find.mockResolvedValue([]);
  await expect(
    new Service(deps.service as any).ensure({ subjectId: "owner" }),
  ).rejects.toThrow("Sign in");
  expect(deps.profiles.create).not.toHaveBeenCalled();
  expect(deps.permission.create).not.toHaveBeenCalled();
});

it("preserves the existing personal profile and separates assistant ownership", async () => {
  const deps = dependencies();
  deps.profiles.rows.push(
    {
      id: "personal",
      slug: "my-name",
      variant: "default",
      title: { en: "Saved name" },
    },
    {
      id: "assistant",
      slug: "my-assistant",
      variant: "artificial-intelligence",
    },
  );
  deps.links.rows.push(
    {
      id: "personal-link",
      subjectId: "owner",
      socialModuleProfileId: "personal",
      variant: "default",
    },
    {
      id: "assistant-link",
      subjectId: "owner",
      socialModuleProfileId: "assistant",
      variant: "default",
    },
  );
  await new Service(deps.service as any).ensure({ subjectId: "owner" });
  expect(deps.profiles.create).not.toHaveBeenCalled();
  expect(
    deps.links.rows.filter((row) => row.variant === "default"),
  ).toHaveLength(1);
  expect(deps.links.rows[1].variant).toBe("assistant");
  expect(deps.profiles.rows[0].title).toEqual({ en: "Saved name" });
});

it("does not choose an arbitrary profile when two personal default links already exist", async () => {
  const deps = dependencies();
  for (const id of ["one", "two"]) {
    deps.profiles.rows.push({ id, slug: id, variant: "default" });
    deps.links.rows.push({
      subjectId: "owner",
      socialModuleProfileId: id,
      variant: "default",
    });
  }
  await expect(
    new Service(deps.service as any).ensure({ subjectId: "owner" }),
  ).rejects.toThrow("one personal profile");
  expect(deps.permission.create).not.toHaveBeenCalled();
});

it("restores a legacy assistant link only from the Subject's explicit profile owner grant", async () => {
  const deps = dependencies();
  const profileId = "98f95262-957a-4388-b6d1-56f676bca793";
  deps.profiles.rows.push({
    id: profileId,
    slug: "owned-agent",
    variant: "artificial-intelligence",
  });
  deps.role.rows.push({
    id: "legacy-owner",
    slug: `social-profile-${profileId}-knowledge-owner`,
  });
  deps.subjectsToRoles.rows.push({
    subjectId: "owner",
    roleId: "legacy-owner",
  });
  deps.permission.rows.push({
    id: "owned-source-read",
    method: "GET",
    type: "HTTP",
    path: `/api/rbac/subjects/owner/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/profiles/${profileId}/knowledge/sources`,
  });
  deps.rolesToPermissions.rows.push({
    roleId: "legacy-owner",
    permissionId: "owned-source-read",
  });
  await new Service(deps.service as any).ensure({ subjectId: "owner" });
  expect(deps.links.rows).toContainEqual(
    expect.objectContaining({
      subjectId: "owner",
      socialModuleProfileId: profileId,
      variant: "assistant",
    }),
  );
});

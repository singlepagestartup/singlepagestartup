import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import { RequestProfileSubjectIdOwner } from "@sps/rbac/models/subject/backend/app/middlewares";
import { Handler } from "./personal";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "test-personal-knowledge-jwt",
  RBAC_SECRET_KEY: "test-api-secret",
}));
const mockProfileLinks = [
  {
    subjectId: "owner",
    socialModuleProfileId: "my-profile",
    variant: "default",
  },
  {
    subjectId: "owner",
    socialModuleProfileId: "my-agent",
    variant: "assistant",
  },
  {
    subjectId: "peer",
    socialModuleProfileId: "their-profile",
    variant: "default",
  },
];
jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({
    api: {
      find: jest.fn(({ params }) =>
        mockProfileLinks.filter((link) =>
          params.filters.and.every(
            ({ column, value }) => link[column] === value,
          ),
        ),
      ),
    },
  }),
);
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    findById: jest.fn(({ id }) => ({
      id,
      variant: id === "my-agent" ? "artificial-intelligence" : "default",
    })),
  },
}));
const mockSources = [
  { id: "note", variant: "customer-memory", content: "Use this phone number" },
  {
    id: "document",
    slug: "a-linked-document",
    variant: "default",
    content: "My document",
  },
  { id: "other", variant: "customer-memory", content: "Their number" },
  { id: "bad-link", variant: "customer-memory", content: "Mislinked memory" },
];
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  Service: jest.fn().mockImplementation(() => ({
    listSources: ({ sourceIds }) =>
      mockSources.filter(({ id }) => sourceIds.includes(id)),
  })),
}));

const relations = [
  {
    profileId: "my-profile",
    knowledgeModuleSourceId: "note",
    variant: "customer-memory",
    storeId: "store",
    projectId: "project",
  },
  {
    profileId: "my-profile",
    knowledgeModuleSourceId: "document",
    variant: "default",
  },
  {
    profileId: "their-profile",
    knowledgeModuleSourceId: "other",
    variant: "customer-memory",
  },
  {
    profileId: "my-profile",
    knowledgeModuleSourceId: "bad-link",
    variant: "default",
  },
];
const sourceLinks = jest.fn(({ params }) =>
  relations.filter((row) =>
    params.filters.and.every(({ column, method, value }) =>
      method === "inArray"
        ? value.includes(row[column])
        : row[column] === value,
    ),
  ),
);
const handler = new Handler({
  modules: {
    social: {
      profilesToKnowledgeModuleSources: { find: sourceLinks },
      skillsToKnowledgeModuleSources: { find: async () => [] },
      messagesToKnowledgeModuleSources: { find: async () => [] },
    },
  },
} as any);
const app = new Hono();
const owner = new RequestProfileSubjectIdOwner().init({
  requireJwt: true,
  personalProfileOnly: true,
  activeSubjectId: async () => "owner",
});
app.on(["GET", "POST"], "/:id/:socialModuleProfileId", owner, (c) =>
  handler.execute(c),
);
app.patch("/:id/:socialModuleProfileId/:knowledgeModuleSourceId", owner, (c) =>
  handler.execute(c),
);
let token: string;
beforeAll(async () => {
  token = await signJwt(
    { subjectId: "owner", type: "access", lifetimeInSeconds: 60 },
    "test-personal-knowledge-jwt",
  );
});
beforeEach(() => {
  sourceLinks.mockClear();
});

it("reads only this owner's notes and ordinary documents across order scopes", async () => {
  const res = await app.request(
    "/owner/my-profile?targetSocialModuleProfileId=their-profile",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("private, no-store");
  expect(await res.json()).toEqual({
    data: [
      { ...mockSources[0], editable: true },
      { ...mockSources[1], editable: false },
    ],
  });
});
it.each(["/peer/their-profile", "/owner/their-profile", "/owner/my-agent"])(
  "denies %s before reading knowledge",
  async (path) => {
    const res = await app.request(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(false);
    expect(sourceLinks).not.toHaveBeenCalled();
  },
);
it.each(["POST", "PATCH"])(
  "requires the current owner's JWT for %s even with a service secret",
  async (method) => {
    const path = "/owner/my-profile" + (method === "PATCH" ? "/note" : "");
    const res = await app.request(path, {
      method,
      headers: { "X-RBAC-SECRET-KEY": "test-api-secret" },
    });
    expect(res.ok).toBe(false);
    expect(sourceLinks).not.toHaveBeenCalled();
    const peer = await app.request(path.replace("/owner/", "/peer/"), {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(peer.ok).toBe(false);
  },
);
it("refuses an edit when the human profile has another owner", async () => {
  mockProfileLinks.push({
    subjectId: "peer",
    socialModuleProfileId: "my-profile",
    variant: "default",
  });
  try {
    const response = await app.request("/owner/my-profile/note", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok).toBe(false);
    expect(sourceLinks).not.toHaveBeenCalled();
  } finally {
    mockProfileLinks.pop();
  }
});

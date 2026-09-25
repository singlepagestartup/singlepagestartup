/**
 * BDD Suite: subject controller route guards.
 *
 * Given: the subject controller's route table mounted the way the module app mounts it.
 * When: the OpenRouter model catalog of a chat is requested.
 * Then: a caller who does not own the subject and the profile is refused before
 * OpenRouter is asked, and the owner receives the catalog.
 */

const mockOpenRouterGetModels = jest.fn();
const mockSubjectsToSocialModuleProfilesFind = jest.fn();
const mockSocialModuleProfileFindById = jest.fn();

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
    RBAC_SECRET_KEY: "test-rbac-secret-key",
  };
});

jest.mock("@sps/shared-third-parties", () => {
  const actual = jest.requireActual("@sps/shared-third-parties");

  return {
    ...actual,
    OpenRouter: jest.fn(() => {
      return {
        getModels: mockOpenRouterGetModels,
      };
    }),
  };
});

jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({
    api: {
      find: (...args: unknown[]) =>
        mockSubjectsToSocialModuleProfilesFind(...args),
    },
  }),
);

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => mockSocialModuleProfileFindById(...args),
  },
}));

import { sign } from "hono/jwt";
import { DefaultApp } from "@sps/shared-backend-api";
import { Controller } from ".";

const catalogPath =
  "/subject-owner/social-module/profiles/profile-owned/chats/chat-1/openrouter/models";

function createApp() {
  const app = new DefaultApp(
    {} as any,
    new Controller({} as any) as any,
    {} as any,
  );

  app.useRoutes();

  return app.hono;
}

async function requestCatalog(subjectId?: string) {
  const headers: Record<string, string> = {};

  if (subjectId) {
    const token = await sign({ subject: { id: subjectId } }, "test-jwt-secret");

    headers["Authorization"] = `Bearer ${token}`;
  }

  return createApp().request(catalogPath, { headers });
}

describe("Given: the OpenRouter model catalog route of a chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenRouterGetModels.mockResolvedValue([
      {
        id: "openai/gpt-basic",
        name: "GPT Basic",
        description: "",
        architecture: {
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
      },
    ]);
    mockSubjectsToSocialModuleProfilesFind.mockResolvedValue([
      { id: "subject-owner-profile", subjectId: "subject-owner" },
    ]);
    mockSocialModuleProfileFindById.mockResolvedValue({ id: "profile-owned" });
  });

  /**
   * BDD Scenario
   * Given: a request without a token.
   * When: the catalog is requested.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: no token is sent Then: refuses the request before OpenRouter", async () => {
    const response = await requestCatalog();

    expect(response.status).toBe(400);
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to another subject.
   * When: that subject requests the owner's catalog route.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: another subject asks Then: refuses the request before OpenRouter", async () => {
    const response = await requestCatalog("subject-other");

    expect(response.status).toBe(401);
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token and a profile the owner is not linked to.
   * When: the catalog is requested through that profile.
   * Then: it is refused and OpenRouter is not asked.
   */
  it("When: the profile belongs to someone else Then: refuses the request before OpenRouter", async () => {
    mockSubjectsToSocialModuleProfilesFind.mockResolvedValue([]);

    const response = await requestCatalog("subject-owner");

    expect(response.status).toBe(404);
    expect(mockOpenRouterGetModels).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the owner's token and a profile linked to the owner.
   * When: the catalog is requested.
   * Then: it answers the grouped OpenRouter catalog.
   */
  it("When: the owner asks through an owned profile Then: returns the catalog", async () => {
    const response = await requestCatalog("subject-owner");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockOpenRouterGetModels).toHaveBeenCalledTimes(1);
    expect(body.data.groups[0].models).toEqual([
      expect.objectContaining({ id: "openai/gpt-basic" }),
    ]);
  });
});

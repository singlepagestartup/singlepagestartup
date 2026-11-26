/**
 * BDD Suite: RBAC profile-scoped Knowledge Source SDK actions.
 *
 * Given: Social chat document operations must go through RBAC.
 * When: client/server SDK actions build requests.
 * Then: they target RBAC-scoped profile Knowledge routes.
 */

import { action as createSource } from "./create";
import { action as findDocuments } from "./find";
import { action as deleteSource } from "./find-by-id/delete";
import { action as reindexSource } from "./find-by-id/reindex";
import { action as updateSource } from "./find-by-id/update";

describe("rbac profile-scoped Knowledge Source SDK actions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ) as any;
  });

  /**
   * BDD Scenario: list profile documents.
   *
   * Given: a subject and social profile id.
   * When: the find action executes.
   * Then: it sends a GET request to the RBAC scoped documents route.
   */
  it("lists documents through the RBAC scoped profile route", async () => {
    await findDocuments({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/sources?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("uses the owner-only route for personal sources", async () => {
    await findDocuments({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "my-profile",
      personal: true,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/my-profile/knowledge/sources/personal?",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("creates and updates personal sources with owner scope, retry key and original revision", async () => {
    const scope = {
      host: "http://api.test",
      id: "sender",
      socialModuleProfileId: "mine",
      personal: true,
      options: { headers: { Authorization: "Bearer my-session" } },
    };
    const data = { title: "Delivery", content: "Call on arrival" };
    await createSource({
      ...scope,
      data: { ...data, operationKey: "retry-key" },
    });
    await updateSource({
      ...scope,
      knowledgeModuleSourceId: "source-1",
      data: {
        ...data,
        expectedContentHash: "revision",
        expectedTitle: "Old delivery title",
      },
    });
    const path =
      "http://api.test/api/rbac/subjects/sender/social-module/profiles/mine/knowledge/sources/personal";
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      path + "?",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer my-session",
        },
        body: JSON.stringify({ data: { ...data, operationKey: "retry-key" } }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      path + "/source-1?",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          data: {
            ...data,
            expectedContentHash: "revision",
            expectedTitle: "Old delivery title",
          },
        }),
      }),
    );
  });

  it.each([409, 503])(
    "returns the HTTP failure for an unsaved revision (%s)",
    async (status) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Request failed" }), {
          status,
          headers: { "content-type": "application/json" },
        }),
      );
      await expect(
        updateSource({
          host: "http://api.test",
          id: "owner",
          socialModuleProfileId: "mine",
          personal: true,
          knowledgeModuleSourceId: "source",
          data: {
            title: "Note",
            content: "Draft",
            expectedTitle: "Note",
            expectedContentHash: "revision",
          },
        }),
      ).rejects.toMatchObject({ status });
    },
  );

  /**
   * BDD Scenario: update profile document.
   *
   * Given: a linked Knowledge Source id.
   * When: the update action executes.
   * Then: it sends a PATCH request to the RBAC scoped document route.
   */
  it("updates a document through the RBAC scoped profile route", async () => {
    await updateSource({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleSourceId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
      data: {
        title: "Updated",
        content: "Updated content",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/sources/document-1?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          data: {
            title: "Updated",
            content: "Updated content",
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario: reindex profile document.
   *
   * Given: a linked Knowledge Source id.
   * When: the reindex action executes.
   * Then: it sends a POST request to the RBAC scoped reindex route.
   */
  it("reindexes a document through the RBAC scoped profile route", async () => {
    await reindexSource({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleSourceId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/sources/document-1/reindex?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  /**
   * BDD Scenario: delete profile document.
   *
   * Given: a linked Knowledge Source id.
   * When: the delete action executes.
   * Then: it sends a DELETE request to the RBAC scoped document route.
   */
  it("deletes a document through the RBAC scoped profile route", async () => {
    await deleteSource({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleSourceId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/sources/document-1?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});

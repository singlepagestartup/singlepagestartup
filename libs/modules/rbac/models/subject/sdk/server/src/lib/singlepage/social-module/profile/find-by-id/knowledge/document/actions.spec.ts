/**
 * BDD Suite: RBAC profile-scoped Knowledge document SDK actions.
 *
 * Given: Social chat document operations must go through RBAC.
 * When: client/server SDK actions build requests.
 * Then: they target RBAC-scoped profile Knowledge routes.
 */

import { action as findDocuments } from "./find";
import { action as deleteDocument } from "./find-by-id/delete";
import { action as reindexDocument } from "./find-by-id/reindex";
import { action as updateDocument } from "./find-by-id/update";

describe("rbac profile-scoped Knowledge document SDK actions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
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
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/documents?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  /**
   * BDD Scenario: update profile document.
   *
   * Given: a linked Knowledge document id.
   * When: the update action executes.
   * Then: it sends a PATCH request to the RBAC scoped document route.
   */
  it("updates a document through the RBAC scoped profile route", async () => {
    await updateDocument({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleDocumentId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
      data: {
        title: "Updated",
        description: "Updated content",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/documents/document-1?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          data: {
            title: "Updated",
            description: "Updated content",
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario: reindex profile document.
   *
   * Given: a linked Knowledge document id.
   * When: the reindex action executes.
   * Then: it sends a POST request to the RBAC scoped reindex route.
   */
  it("reindexes a document through the RBAC scoped profile route", async () => {
    await reindexDocument({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleDocumentId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/documents/document-1/reindex?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  /**
   * BDD Scenario: delete profile document.
   *
   * Given: a linked Knowledge document id.
   * When: the delete action executes.
   * Then: it sends a DELETE request to the RBAC scoped document route.
   */
  it("deletes a document through the RBAC scoped profile route", async () => {
    await deleteDocument({
      host: "http://api.test",
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      knowledgeModuleDocumentId: "document-1",
      params: {
        targetSocialModuleProfileId: "assistant-profile-1",
        socialModuleChatId: "chat-1",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/knowledge/documents/document-1?targetSocialModuleProfileId=assistant-profile-1&socialModuleChatId=chat-1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});

import { Service } from "../../index";
import { createAppAssembly } from "@sps/shared-backend-api";
import { Service as ThreadService } from "@sps/social/models/thread/backend/app/api/src/lib/service";
import { serviceBootstrap as threadOwner } from "@sps/social/models/thread/backend/app/api/src/lib/bootstrap";

describe("Given: the Subject service owns a chat thread", () => {
  /**
   * BDD Scenario
   * Given: the thread already has unrelated metadata.
   * When: its OpenRouter model preference is updated.
   * Then: ownership is checked and only the RBAC preference namespace is added.
   */
  it("When: model is selected Then: typed thread metadata is persisted", async () => {
    const assertSubjectOwnsChat = jest.fn().mockResolvedValue(undefined);
    const assertThreadBelongsToChat = jest.fn().mockResolvedValue(undefined);
    const update = jest.fn().mockImplementation(async ({ data }) => ({
      id: "thread-1",
      metadata: {
        anotherFeature: { enabled: true },
        [data.metadataNamespaceUpdate.namespace]:
          data.metadataNamespaceUpdate.value,
      },
    }));
    const thread = Object.assign(new ThreadService({} as never), {
      findById: jest.fn().mockResolvedValue({
        id: "thread-1",
        metadata: { anotherFeature: { enabled: true } },
      }),
      update,
    });
    const assembly = createAppAssembly(({ overrideService }) => {
      overrideService(threadOwner, thread);
    });
    const subject = Object.create(Service.prototype) as Service;
    Object.defineProperty(subject, "chatOwnership", {
      value: { assertOwner: assertSubjectOwnsChat },
    });
    const service = Object.assign(subject, {
      socialModuleChatLifecycleAssertThreadBelongsToChat:
        assertThreadBelongsToChat,
    }).withAppAssembly(assembly);

    await expect(
      service.socialModuleChatThreadOpenRouterModelUpdate({
        subjectId: "subject-1",
        socialModuleChatId: "chat-1",
        socialModuleThreadId: "thread-1",
        modelId: "minimax/minimax-m2.5",
      }),
    ).resolves.toMatchObject({
      id: "thread-1",
      metadata: {
        anotherFeature: {
          enabled: true,
        },
        rbacAiThreadPreferences: {
          version: 1,
          modelId: "minimax/minimax-m2.5",
        },
      },
    });
    expect(assertSubjectOwnsChat).toHaveBeenCalledWith("subject-1", "chat-1");
    expect(assertThreadBelongsToChat).toHaveBeenCalledWith({
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
    });
    expect(update).toHaveBeenCalledWith({
      id: "thread-1",
      data: {
        metadataNamespaceUpdate: {
          namespace: "rbacAiThreadPreferences",
          expectedValue: null,
          value: { version: 1, modelId: "minimax/minimax-m2.5" },
        },
      },
    });
  });
});

/**
 * BDD Suite: startup-overridable thread model persistence.
 *
 * Given: the Subject service owns a chat thread.
 * When: an OpenRouter model is selected for that thread.
 * Then: the base singlepage service persists the typed preference in thread metadata.
 */

import { Service } from "../../index";

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
      ...data,
    }));
    const service = Object.assign(Object.create(Service.prototype), {
      socialModuleChatLifecycleAssertSubjectOwnsChat: assertSubjectOwnsChat,
      socialModuleChatLifecycleAssertThreadBelongsToChat:
        assertThreadBelongsToChat,
      socialModule: {
        thread: {
          findById: jest.fn().mockResolvedValue({
            id: "thread-1",
            metadata: {
              anotherFeature: {
                enabled: true,
              },
            },
          }),
          update,
        },
      },
    }) as Service;

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
    expect(assertSubjectOwnsChat).toHaveBeenCalledWith({
      subjectId: "subject-1",
      socialModuleChatId: "chat-1",
    });
    expect(assertThreadBelongsToChat).toHaveBeenCalledWith({
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
    });
    expect(update).toHaveBeenCalledWith({
      id: "thread-1",
      data: {
        metadata: {
          anotherFeature: {
            enabled: true,
          },
          rbacAiThreadPreferences: {
            version: 1,
            modelId: "minimax/minimax-m2.5",
          },
        },
      },
    });
  });
});

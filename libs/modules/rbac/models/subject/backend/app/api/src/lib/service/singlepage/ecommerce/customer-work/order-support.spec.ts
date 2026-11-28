import { isSocialMessageExcludedFromOpenRouter } from "@sps/social/models/message/sdk/model";
import { ORDER_SUPPORT_THREAD_VARIANT } from "@sps/social/relations/chats-to-threads/sdk/model";
import type { IModel as CrmTask } from "@sps/crm/models/task/sdk/model";
import { Service } from "./order-support";

function fixture() {
  const task = {
    id: "task",
    storeId: "store",
    orderId: "order",
    customerId: "buyer",
    status: "closed",
    outcome: "completed",
  } as CrmTask;
  const members = [{ profileId: "buyer-profile" }];
  const messages: Array<{ sourceSystemId?: string; description: string }> = [];
  const thread = { id: "support", metadata: { orderSupportTaskId: task.id } };
  const placements: Array<{
    chatId: string;
    threadId: string;
    variant: string;
  }> = [];
  const findThread = jest.fn(async () => (placements.length ? [thread] : []));
  const createThread = jest.fn().mockResolvedValue(thread);
  const createPlacement = jest.fn(async ({ data }) => placements.push(data));
  const createAuthor = jest.fn();
  const createWorkMessage = jest.fn(async (data) => {
    const message = { ...data, id: `message-${messages.length}` };
    messages.push(message);
    return message;
  });
  const service = new Service({
    findById: async ({ id }: { id: string }) => ({ id, variant: "default" }),
    crmWorkspace: {
      employees: { ensureActorProfile: async () => "owner-profile" },
    },
    module: {
      subjectsToEcommerceModuleStores: {
        find: async () => [{ subjectId: "owner" }],
      },
      subjectsToSocialModuleProfiles: {
        find: async ({ params }) => {
          const profileId = params.filters.and[0].value;
          return [{ subjectId: profileId.split("-")[0], variant: "default" }];
        },
      },
    },
    modules: {
      crm: {
        task: {
          findById: async () => task,
          withTask: async (
            _: unknown,
            run: (current: CrmTask) => Promise<unknown>,
          ) => run(task),
        },
      },
      social: {
        chatsToCrmModuleTasks: {
          channels: async () => [{ chatId: "chat", threadId: "work" }],
          find: async () => [{ chatId: "chat", crmModuleTaskId: task.id }],
        },
        chatsToThreads: {
          create: createPlacement,
          find: async () => placements,
        },
        thread: {
          create: createThread,
          find: findThread,
          findById: async () => thread,
        },
        profile: { findById: async () => ({ variant: "default" }) },
        profilesToChats: {
          find: async ({ params }) =>
            members.filter(({ profileId }) =>
              params.filters.and.some(({ value }) => value === profileId),
            ),
          create: async ({ data }) => members.push(data),
        },
        message: {
          createWorkMessage,
          find: async ({ params }) =>
            messages.filter(({ sourceSystemId }) =>
              params.filters.and.some(({ value }) => value === sourceSystemId),
            ),
        },
        profilesToMessages: { create: createAuthor },
        chatsToMessages: { create: jest.fn() },
        threadsToMessages: { create: jest.fn() },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return {
    createThread,
    createPlacement,
    createAuthor,
    createWorkMessage,
    service,
    task,
  };
}

it("creates the support thread and owner-authored greeting only once for a completed order", async () => {
  const f = fixture();
  await expect(
    f.service.ensure({ ...f.task, status: "active" }),
  ).resolves.toBeUndefined();
  await expect(f.service.ensure(f.task)).resolves.toBe("support");
  await expect(f.service.ensure(f.task)).resolves.toBe("support");
  expect(f.createThread).toHaveBeenCalledTimes(1);
  expect(f.createThread).toHaveBeenCalledWith({
    data: expect.objectContaining({ title: "Поддержка" }),
  });
  expect(f.createPlacement).toHaveBeenCalledWith({
    data: {
      chatId: "chat",
      threadId: "support",
      variant: ORDER_SUPPORT_THREAD_VARIANT,
    },
  });
  expect(f.createWorkMessage).toHaveBeenCalledTimes(1);
  expect(f.createWorkMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      description: expect.stringContaining("Спасибо за заказ!"),
    }),
  );
  expect(f.createAuthor).toHaveBeenCalledWith({
    data: { profileId: "owner-profile", messageId: "message-0" },
  });
});

it("accepts and de-duplicates buyer and owner replies with no provider metadata", async () => {
  const f = fixture();
  await f.service.ensure(f.task);
  const input = {
    chatId: "chat",
    threadId: "support",
    text: "Вопрос по заказу",
    sourceSystemId: "request",
  };
  const buyer = { ...input, customerId: "buyer", profileId: "buyer-profile" };
  const message = await f.service.send(buyer);
  await expect(f.service.send(buyer)).resolves.toBe(message);
  await expect(
    f.service.send({ ...buyer, text: "Другой текст" }),
  ).rejects.toThrow("another message");
  await expect(
    f.service.send({
      ...input,
      customerId: "worker",
      profileId: "worker-profile",
    }),
  ).rejects.toThrow("Order support is unavailable");
  await expect(
    f.service.send({
      ...input,
      customerId: "owner",
      profileId: "buyer-profile",
    }),
  ).rejects.toThrow("Order support is unavailable");
  await f.service.send({
    ...input,
    customerId: "owner",
    profileId: "owner-profile",
    text: "Ответ владельца",
  });
  expect(f.createWorkMessage).toHaveBeenCalledTimes(3);
  for (const [message] of f.createWorkMessage.mock.calls) {
    expect(isSocialMessageExcludedFromOpenRouter(message.metadata)).toBe(true);
  }
});

import { randomUUID } from "node:crypto";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import { Service } from "./employees";
import { Service as Workspace } from "./index";

interface IRecord {
  id: string;
  [key: string]: unknown;
}

function records(records: IRecord[] = []) {
  return {
    records,
    find: jest.fn(
      async (input: {
        params: {
          filters: {
            and: { column: string; method: string; value: unknown }[];
          };
        };
      }) =>
        records.filter((record) =>
          input.params.filters.and.every(({ column, method, value }) =>
            method === "inArray" && Array.isArray(value)
              ? value.includes(record[column])
              : record[column] === value,
          ),
        ),
    ),
    findById: jest.fn(
      async ({ id }: { id: string }) =>
        records.find((record) => record.id === id) ?? null,
    ),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const record = { id: randomUUID(), ...data };
      records.push(record);
      return record;
    }),
  };
}

function fixture() {
  const owner = randomUUID();
  const admin = randomUUID();
  const manager = randomUUID();
  const storeId = randomUUID();
  const otherStoreId = randomUUID();
  const input = { storeId, name: "Ирина", operationKey: randomUUID() };
  const profile = records();
  const subjects = records();
  const profilesToChats = records();
  const chatsToThreads = records();
  const subjectProfiles = records();
  const thread = records();
  const chat = records();
  const grants = records([
    {
      id: randomUUID(),
      subjectId: owner,
      ecommerceModuleStoreId: storeId,
      variant: "owner",
    },
    {
      id: randomUUID(),
      subjectId: manager,
      ecommerceModuleStoreId: storeId,
      variant: "crm-manager",
    },
  ]);
  const store = records([{ id: storeId }, { id: otherStoreId }]);
  const withStoreEmployeeLock = jest.fn(
    async (_actor: string, work: () => Promise<unknown>) => work(),
  );
  const storeEmployees = jest.fn().mockResolvedValue({ items: [], total: 0 });
  const owners = new Map<string, string>();
  const chatOwnership = {
    create: async (actorId: string, data: Record<string, unknown>) => {
      const ownedChat = await chat.create({ data });
      owners.set(ownedChat.id, actorId);
      return ownedChat;
    },
    assertOwner: jest.fn(async (actorId: string, chatId: string) => {
      if (owners.get(chatId) !== actorId) {
        throw new Error("Forbidden error. Chat ownership required");
      }
    }),
  };
  const subjectService = {
    chatOwnership,
    ...subjects,
    isAdmin: jest.fn(async (actor: string) => actor === admin),
    repository: { withStoreEmployeeLock, storeEmployees },
    modules: {
      social: { chat, thread, profile, profilesToChats, chatsToThreads },
      ecommerce: { store },
    },
    module: {
      subjectsToSocialModuleProfiles: subjectProfiles,
      subjectsToEcommerceModuleStores: grants,
    },
  } as unknown as ConstructorParameters<typeof Service>[0];

  return {
    owners,
    chatOwnership,
    service: new Service(subjectService),
    workspace: new Workspace(subjectService),
    storeEmployees,
    owner,
    admin,
    manager,
    storeId,
    otherStoreId,
    input,
    subjects,
    subjectProfiles,
    chat,
    thread,
    profile,
    profilesToChats,
    chatsToThreads,
    grants,
    withStoreEmployeeLock,
  };
}

it("checks store access before searching the employee directory", async () => {
  const f = fixture();
  const query = { storeId: f.storeId, search: "Irina", limit: 8, offset: 16 };
  await expect(
    f.workspace.employeeList(f.owner, { ...query, storeId: f.otherStoreId }),
  ).rejects.toThrow("Permission error");
  expect(f.storeEmployees).not.toHaveBeenCalled();
  await expect(f.workspace.employeeList(f.owner, query)).resolves.toEqual({
    items: [],
    total: 0,
  });
  expect(f.storeEmployees).toHaveBeenCalledWith({
    ...query,
    employeeVariants: [
      "crm-manager",
      "crm-manager-finance",
      "crm-worker",
      "crm-agent",
    ],
  });
});

it("provisions one real employee and returns the same private thread on retries", async () => {
  const f = fixture();
  const employee = await f.service.create(f.owner, f.input);
  await expect(f.service.create(f.owner, f.input)).resolves.toEqual(employee);
  await expect(
    f.service.open(f.owner, { storeId: f.storeId, subjectId: employee.id }),
  ).resolves.toEqual(employee);

  expect(f.withStoreEmployeeLock).toHaveBeenCalledTimes(3);
  expect(f.subjects.records).toEqual([
    expect.objectContaining({ id: employee.id, variant: "agent" }),
  ]);
  expect(f.profile.records).toEqual([
    expect.objectContaining({
      id: employee.profileId,
      variant: "artificial-intelligence",
      title: { ru: "Ирина", en: "Ирина" },
    }),
    expect.objectContaining({ variant: "default" }),
  ]);
  expect(f.grants.records).toContainEqual(
    expect.objectContaining({
      subjectId: employee.id,
      ecommerceModuleStoreId: f.storeId,
      variant: "crm-agent",
    }),
  );
  const [chat] = f.chat.records;
  expect(chat).toMatchObject({
    id: employee.chatId,
    title: "Ирина",
    variant: STORE_EMPLOYEE_CHAT_VARIANT,
  });
  expect(f.thread.records).toEqual([
    expect.objectContaining({ id: employee.threadId, variant: "default" }),
  ]);
  expect(f.profilesToChats.records.map(({ profileId }) => profileId)).toEqual([
    f.profile.records[1].id,
    employee.profileId,
  ]);
  await expect(
    f.service.scopeForChat(f.owner, chat as never, employee.threadId),
  ).resolves.toEqual({
    storeId: f.storeId,
    subjectId: employee.id,
    profileId: employee.profileId,
    actorProfileId: f.profile.records[1].id,
    chatId: employee.chatId,
    threadId: employee.threadId,
  });
  await expect(
    f.service.currentChat(f.owner, f.storeId, employee.id),
  ).resolves.toEqual({
    actorProfile: f.profile.records[1],
    profileId: employee.profileId,
    chatId: employee.chatId,
    threadId: employee.threadId,
    threads: [{ id: employee.threadId, title: f.input.name }],
  });
  await expect(
    f.service.currentChat(f.admin, f.storeId, employee.id),
  ).resolves.toBeUndefined();
});

it("keeps chats private to their authorized manager and excludes unlinked threads", async () => {
  const f = fixture();
  await expect(f.service.create(f.manager, f.input)).rejects.toThrow(
    "Permission error",
  );
  await expect(
    f.service.create(f.owner, { ...f.input, storeId: f.otherStoreId }),
  ).rejects.toThrow("Permission error");
  expect(f.subjects.create).not.toHaveBeenCalled();

  const employee = await f.service.create(f.owner, f.input);
  const [ownerChat] = f.chat.records;
  const employeeScope = { storeId: f.storeId, subjectId: employee.id };
  await expect(f.service.open(f.admin, employeeScope)).resolves.toMatchObject({
    id: employee.id,
    profileId: employee.profileId,
  });
  expect(f.chat.records).toHaveLength(2);
  await expect(
    f.service.scopeForChat(f.admin, ownerChat as never),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.scopeForChat(f.manager, ownerChat as never),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.scopeForChat(f.owner, ownerChat as never, randomUUID()),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.scopeForChat(f.owner, { ...ownerChat, slug: "forged" } as never),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.open(f.admin, { ...employeeScope, storeId: f.otherStoreId }),
  ).rejects.toThrow("Not Found error");
  f.grants.records.splice(0, 1);
  await expect(
    f.service.scopeForChat(f.owner, ownerChat as never),
  ).rejects.toThrow("Not Found error");
});

it("keeps the original thread as default and reopens each named thread within its manager's private chat", async () => {
  const f = fixture();
  const original = await f.service.create(f.owner, f.input);
  const input = {
    storeId: f.storeId,
    subjectId: original.id,
    title: "Каталог",
    operationKey: randomUUID(),
  };
  const named = await f.service.createThread(f.owner, input);
  expect(named).toEqual({ ...original, threadId: expect.any(String) });
  expect(named.threadId).not.toBe(original.threadId);
  await expect(f.service.createThread(f.owner, input)).resolves.toEqual(named);
  await expect(
    f.service.createThread(f.owner, { ...input, title: "Доставка" }),
  ).rejects.toThrow("Conflict error");
  await expect(f.service.createThread(f.manager, input)).rejects.toThrow(
    "Permission error",
  );
  const other = await f.service.createThread(f.admin, input);
  expect(other.chatId).not.toBe(named.chatId);
  expect(other.threadId).not.toBe(named.threadId);
  await expect(f.service.open(f.owner, input)).resolves.toEqual(original);
  const [chat] = f.chat.records;
  const originalScope = await f.service.scopeForChat(f.owner, chat as never);
  expect(originalScope.threadId).toBe(original.threadId);
  await expect(
    f.service.scopeForChat(f.owner, chat as never, named.threadId),
  ).resolves.toEqual({
    ...originalScope,
    threadId: named.threadId,
  });
  await expect(
    f.service.scopeForChat(f.owner, chat as never, other.threadId),
  ).rejects.toThrow("Not Found");
  await expect(
    f.service.currentChat(f.owner, f.storeId, original.id),
  ).resolves.toMatchObject({
    threads: [
      { id: original.threadId, title: f.input.name },
      { id: named.threadId, title: input.title },
    ],
  });
  await f.chatsToThreads.create({
    data: { chatId: other.chatId, threadId: named.threadId, variant: "custom" },
  });
  await expect(
    f.service.scopeForChat(f.owner, chat as never, named.threadId),
  ).rejects.toThrow("Not Found");
});

it("opens a new thread for existing store agents with an exclusive profile and excludes personal assistants", async () => {
  const f = fixture();
  const subject = await f.subjects.create({ data: { variant: "agent" } });
  const profile = await f.profile.create({
    data: {
      variant: "artificial-intelligence",
      title: { en: "Existing employee" },
    },
  });
  await f.subjectProfiles.create({
    data: {
      subjectId: subject.id,
      socialModuleProfileId: profile.id,
      variant: "default",
    },
  });
  await f.grants.create({
    data: {
      subjectId: subject.id,
      ecommerceModuleStoreId: f.storeId,
      variant: "crm-agent",
    },
  });
  await expect(
    f.service.currentChat(f.owner, f.storeId, subject.id),
  ).resolves.toBeUndefined();
  expect(f.chat.records).toEqual([]);
  await expect(
    f.service.open(f.owner, { storeId: f.storeId, subjectId: subject.id }),
  ).resolves.toMatchObject({ id: subject.id, profileId: profile.id });
  await expect(f.service.list(f.storeId, [subject.id])).resolves.toEqual([
    { id: subject.id, name: "Existing employee", profileId: profile.id },
  ]);
  await f.grants.create({
    data: {
      subjectId: subject.id,
      ecommerceModuleStoreId: f.otherStoreId,
      variant: "assistant",
      customerSubjectId: randomUUID(),
    },
  });
  await expect(f.service.list(f.storeId, [subject.id])).resolves.toEqual([]);
  await expect(
    f.service.open(f.owner, { storeId: f.storeId, subjectId: subject.id }),
  ).rejects.toThrow("Not Found error");
});

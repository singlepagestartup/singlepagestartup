import { randomUUID } from "node:crypto";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import { Service } from "./employees";

interface IRecord {
  id: string;
  [key: string]: unknown;
}

function records(records: IRecord[] = []) {
  return {
    records,
    find: jest.fn(
      async (input: {
        params: { filters: { and: { column: string; value: unknown }[] } };
      }) =>
        records.filter((record) =>
          input.params.filters.and.every(
            ({ column, value }) => record[column] === value,
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
  const service = new Service({
    ...subjects,
    isAdmin: jest.fn(async (actor: string) => actor === admin),
    repository: { withStoreEmployeeLock },
    modules: {
      social: { chat, thread, profile, profilesToChats, chatsToThreads },
      ecommerce: { store },
    },
    module: {
      subjectsToSocialModuleProfiles: subjectProfiles,
      subjectsToEcommerceModuleStores: grants,
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);

  return {
    service,
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
});

it("keeps chats private to their authorized manager and the single linked thread", async () => {
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

import { randomUUID } from "node:crypto";
import { Service } from "./assignment-candidates";

interface IFilter {
  params: {
    filters: {
      and: { column: string; value: string | string[]; method: string }[];
    };
  };
}

function reader<T extends Record<string, unknown>>(items: T[]) {
  return jest.fn(async ({ params }: IFilter) =>
    items.filter((item) =>
      params.filters.and.every(({ column, value, method }) =>
        Array.isArray(value) && method === "inArray"
          ? value.includes(String(item[column]))
          : item[column] === value,
      ),
    ),
  );
}

function fixture() {
  const storeId = randomUUID();
  const channel = { chatId: randomUUID(), threadId: randomUUID() };
  const orderId = randomUUID();
  const entries = [
    { name: "Owner", role: "owner", variant: "default" },
    { name: "Manager", role: "crm-manager", variant: "default" },
    { name: "Stage agent", role: "crm-agent", variant: "agent" },
    { name: "Another chat", role: "crm-manager", variant: "default" },
    { name: "Personal assistant", role: "crm-agent", variant: "agent" },
    { name: "Buyer", role: "customer", variant: "default" },
  ].map((entry) => ({ ...entry, id: randomUUID(), profileId: randomUUID() }));
  const [owner, manager, agent, other, assistant, buyer] = entries;
  const task = {
    id: randomUUID(),
    storeId,
    assigneeId: agent.id,
    customerId: buyer.id,
    orderId: null as string | null,
    status: "active",
  } as unknown as Parameters<Service["read"]>[0];
  const roles = entries.map(({ id, role }) => ({
    subjectId: id,
    ecommerceModuleStoreId: storeId,
    variant: role,
  }));
  roles.push({
    subjectId: assistant.id,
    ecommerceModuleStoreId: randomUUID(),
    variant: "assistant",
  });
  const identities = entries.map(({ id, profileId }) => ({
    subjectId: id,
    socialModuleProfileId: profileId,
    variant: "default",
  }));
  const memberships = [
    ...[agent, assistant, buyer].map(({ profileId }) => ({
      ...channel,
      profileId,
    })),
    { ...channel, chatId: randomUUID(), profileId: other.profileId },
  ];
  const authors = [
    {
      sourceSystemId: `workspace-staff:${task.id}:${manager.id}:${randomUUID()}`,
      profileId: manager.profileId,
    },
    {
      sourceSystemId: `workspace-staff:${randomUUID()}:${other.id}:${randomUUID()}`,
      profileId: other.profileId,
    },
  ];
  const orders = [{ orderId, storeId }];
  const grants = reader(roles);
  const identitiesFind = reader(identities);
  const profilesFind = reader(
    entries.map(({ profileId, name, variant }) => ({
      id: profileId,
      title: { en: name },
      variant: variant === "agent" ? "artificial-intelligence" : "default",
    })),
  );
  const create = jest.fn(async ({ data }) => memberships.push(data));
  const ensureActorProfile = jest.fn(async () => owner.profileId);
  const subject = {
    find: reader(
      entries.map(({ id, name, variant }) => ({ id, slug: name, variant })),
    ),
    findById: jest.fn(async ({ id }) =>
      entries.find((entry) => entry.id === id),
    ),
    repository: { workspaceStaffAuthors: jest.fn(async () => authors) },
    module: {
      subjectsToEcommerceModuleStores: { find: grants },
      subjectsToSocialModuleProfiles: { find: identitiesFind },
    },
    modules: {
      social: {
        profilesToChats: { find: reader(memberships), create },
        profile: {
          find: profilesFind,
          findById: jest.fn(async ({ id }) =>
            profilesFind({
              params: {
                filters: { and: [{ column: "id", method: "eq", value: id }] },
              },
            }).then(([profile]) => profile),
          ),
        },
      },
      crm: {
        tasksToStages: {
          find: reader([
            {
              taskId: task.id,
              kind: "assigned",
              detail: { assigneeId: agent.id },
            },
          ]),
        },
      },
      ecommerce: { storesToOrders: { find: reader(orders) } },
    },
    crmWorkspace: { employees: { ensureActorProfile } },
  };
  return {
    service: new Service(
      subject as unknown as ConstructorParameters<typeof Service>[0],
    ),
    subject,
    task,
    storeId,
    orderId,
    channel,
    grants,
    identitiesFind,
    memberships,
    owners: roles,
    identities,
    authors,
    orders,
    owner,
    manager,
    agent,
    buyer,
    other,
    create,
    ensureActorProfile,
  };
}

it("lists the chat member and its proven legacy author without querying other store employees", async () => {
  const f = fixture();
  await expect(f.service.read(f.task, f.channel)).resolves.toEqual([
    expect.objectContaining({
      id: f.manager.id,
      profileId: f.manager.profileId,
      kind: "human",
    }),
    expect.objectContaining({
      id: f.agent.id,
      profileId: f.agent.profileId,
      kind: "ai",
    }),
  ]);
  expect(f.subject.repository.workspaceStaffAuthors).toHaveBeenCalledWith({
    ...f.channel,
    taskId: f.task.id,
  });
  for (const [query] of f.grants.mock.calls) {
    expect(query.params.filters.and).toContainEqual(
      expect.objectContaining({ column: "subjectId", method: "inArray" }),
    );
    expect(JSON.stringify(query)).not.toContain(f.other.id);
  }
  expect(f.create).not.toHaveBeenCalled();
});

it("admits only the unique order-store owner for a legacy chat and rejects ambiguous identities", async () => {
  const f = fixture();
  f.task.orderId = f.orderId;
  const initial = await f.service.read(f.task, f.channel);
  expect(initial.map(({ id }) => id)).toContain(f.owner.id);
  expect(f.create).not.toHaveBeenCalled();
  f.identities.push({
    subjectId: f.other.id,
    socialModuleProfileId: f.owner.profileId,
    variant: "default",
  });
  expect(
    (await f.service.read(f.task, f.channel)).map(({ id }) => id),
  ).not.toContain(f.owner.id);
  f.identities.pop();
  f.owners.push({
    subjectId: f.other.id,
    variant: "owner",
    ecommerceModuleStoreId: f.storeId,
  });
  const multipleOwners = await f.service.read(f.task, f.channel);
  expect(multipleOwners.map(({ id }) => id)).not.toContain(f.owner.id);
  expect(multipleOwners.map(({ id }) => id)).not.toContain(f.other.id);
  f.owners.pop();
  f.orders[0].storeId = randomUUID();
  expect(
    (await f.service.read(f.task, f.channel)).map(({ id }) => id),
  ).not.toContain(f.owner.id);
});

it("does not revive an explicitly hidden member from previous assignments", async () => {
  const f = fixture();
  Object.assign(
    f.memberships.find(({ profileId }) => profileId === f.agent.profileId)!,
    { variant: "hidden" },
  );
  expect(
    (await f.service.read(f.task, f.channel)).map(({ id }) => id),
  ).not.toContain(f.agent.id);
  expect(f.create).not.toHaveBeenCalled();
});

it("connects only the store owner exactly once, including an owner who already participates as buyer", async () => {
  const f = fixture();
  await f.service.attachStoreOwner(f.storeId, f.channel.chatId);
  await f.service.attachStoreOwner(f.storeId, f.channel.chatId);
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.create).toHaveBeenCalledWith({
    data: { chatId: f.channel.chatId, profileId: f.owner.profileId },
  });
  f.task.customerId = f.owner.id;
  const candidates = await f.service.read(f.task, f.channel);
  expect(candidates.filter(({ id }) => id === f.owner.id)).toHaveLength(1);
  expect(f.ensureActorProfile).not.toHaveBeenCalled();
});

import { resolveKnowledgeSourceScope } from "./helpers";

function setup({ admin = false, requester = false, target = true } = {}) {
  const service = {
    socialModuleChatLifecycleIsSubjectAdmin: jest.fn().mockResolvedValue(admin),
    crmWorkspace: { employees: { scopeForChat: jest.fn() } },
    module: {
      subjectsToSocialModuleProfiles: { find: jest.fn().mockResolvedValue([]) },
      subjectsToEcommerceModuleStores: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
    modules: {
      social: {
        chat: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "chat", variant: "default" }),
        },
        profilesToChats: {
          find: jest
            .fn()
            .mockImplementation(({ params }) =>
              Promise.resolve(
                (
                  params.filters.and[0].value === "requester"
                    ? requester
                    : target
                )
                  ? [{ id: "membership" }]
                  : [],
              ),
            ),
        },
      },
    },
  };
  const input = {
    service: service as any,
    subjectId: "actual-subject",
    socialModuleProfileId: "requester",
    targetSocialModuleProfileId: "assistant",
    socialModuleChatId: "chat",
  };
  return { service, input };
}

it("allows the existing administrative chat scope without adding a membership", async () => {
  const { service, input } = setup({ admin: true });
  await expect(resolveKnowledgeSourceScope(input)).resolves.toEqual({
    profileId: "assistant",
  });
  expect(service.socialModuleChatLifecycleIsSubjectAdmin).toHaveBeenCalledWith({
    subjectId: "actual-subject",
  });
});

it("denies an ordinary nonmember", async () => {
  const { input } = setup();
  await expect(resolveKnowledgeSourceScope(input)).rejects.toThrow(
    "Permission error. Requesting social-module profile is not connected to chat",
  );
});

it("still requires the target profile to belong to the selected chat for an administrator", async () => {
  const { input } = setup({ admin: true, target: false });
  await expect(resolveKnowledgeSourceScope(input)).rejects.toThrow(
    "Target social-module profile is not connected to chat",
  );
});

it("allows joined profiles without an administrative role lookup", async () => {
  const { service, input } = setup({ requester: true });
  await expect(resolveKnowledgeSourceScope(input)).resolves.toEqual({
    profileId: "assistant",
  });
  expect(
    service.socialModuleChatLifecycleIsSubjectAdmin,
  ).not.toHaveBeenCalled();
});

it("rejects a target scope without a Chat ID before querying memberships", async () => {
  const { service, input } = setup({ admin: true });
  await expect(
    resolveKnowledgeSourceScope({
      ...input,
      socialModuleChatId: undefined,
    }),
  ).rejects.toThrow("socialModuleChatId is required");
  expect(service.modules.social.profilesToChats.find).not.toHaveBeenCalled();
});

it("does not give ordinary chat members access to a store employee profile", async () => {
  const { service, input } = setup({ requester: true });
  service.module.subjectsToSocialModuleProfiles.find.mockResolvedValue([
    { subjectId: "employee" },
  ]);
  service.module.subjectsToEcommerceModuleStores.find.mockResolvedValue([
    { variant: "crm-agent" },
  ]);
  await expect(resolveKnowledgeSourceScope(input)).rejects.toThrow(
    "Employee knowledge profile is unavailable",
  );
});

it("uses the verified store and both profiles for a managed employee", async () => {
  const { service, input } = setup();
  service.modules.social.chat.findById.mockResolvedValue({
    id: "chat",
    variant: "store-employee",
  });
  service.crmWorkspace.employees.scopeForChat.mockResolvedValue({
    profileId: "assistant",
    actorProfileId: "requester",
    storeId: "store",
  });
  await expect(resolveKnowledgeSourceScope(input)).resolves.toEqual({
    profileId: "assistant",
    storeId: "store",
  });
  service.crmWorkspace.employees.scopeForChat.mockResolvedValue({
    profileId: "assistant",
    actorProfileId: "another",
    storeId: "store",
  });
  await expect(resolveKnowledgeSourceScope(input)).rejects.toThrow(
    "Employee knowledge profile is unavailable",
  );
});

import { resolveKnowledgeSourceProfileId } from "./helpers";

function setup({ admin = false, requester = false, target = true } = {}) {
  const service = {
    socialModuleChatLifecycleIsSubjectAdmin: jest.fn().mockResolvedValue(admin),
    socialModule: {
      profilesToChats: {
        find: jest
          .fn()
          .mockImplementation(({ params }) =>
            Promise.resolve(
              (params.filters.and[0].value === "requester" ? requester : target)
                ? [{ id: "membership" }]
                : [],
            ),
          ),
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
  await expect(resolveKnowledgeSourceProfileId(input)).resolves.toBe(
    "assistant",
  );
  expect(service.socialModuleChatLifecycleIsSubjectAdmin).toHaveBeenCalledWith({
    subjectId: "actual-subject",
  });
});

it("denies an ordinary nonmember", async () => {
  const { input } = setup();
  await expect(resolveKnowledgeSourceProfileId(input)).rejects.toThrow(
    "Permission error. Requesting social-module profile is not connected to chat",
  );
});

it("still requires the target profile to belong to the selected chat for an administrator", async () => {
  const { input } = setup({ admin: true, target: false });
  await expect(resolveKnowledgeSourceProfileId(input)).rejects.toThrow(
    "Target social-module profile is not connected to chat",
  );
});

it("allows joined profiles without an administrative role lookup", async () => {
  const { service, input } = setup({ requester: true });
  await expect(resolveKnowledgeSourceProfileId(input)).resolves.toBe(
    "assistant",
  );
  expect(
    service.socialModuleChatLifecycleIsSubjectAdmin,
  ).not.toHaveBeenCalled();
});

it("rejects a target scope without a Chat ID before querying memberships", async () => {
  const { service, input } = setup({ admin: true });
  await expect(
    resolveKnowledgeSourceProfileId({
      ...input,
      socialModuleChatId: undefined,
    }),
  ).rejects.toThrow("socialModuleChatId is required");
  expect(service.socialModule.profilesToChats.find).not.toHaveBeenCalled();
});

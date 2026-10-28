import { Service } from "./collection";

function setup(admin = false) {
  const memberships = jest.fn().mockResolvedValue([
    { chatId: "shared", profileId: "primary" },
    { chatId: "shared", profileId: "second" },
    { chatId: "second-only", profileId: "second" },
  ]);
  const chatFind = jest
    .fn()
    .mockResolvedValue([{ id: "shared" }, { id: "second-only" }]);
  const service = {
    subjectsToSocialModuleProfiles: {
      find: jest
        .fn()
        .mockResolvedValue([
          { socialModuleProfileId: "primary" },
          { socialModuleProfileId: "second" },
        ]),
    },
    socialModuleChatLifecycleIsSubjectAdmin: jest.fn().mockResolvedValue(admin),
    socialModule: {
      profilesToChats: { find: memberships },
      chat: { find: chatFind },
      profile: {
        profilePresentation: jest.fn(async ({ id }) => ({
          id,
          title: { en: id },
          subtitle: {},
          avatar: null,
        })),
        find: jest.fn().mockResolvedValue([{ id: "primary" }, { id: "peer" }]),
      },
    },
  };
  return {
    reader: new Service(service as any),
    service,
    memberships,
    chatFind,
  };
}
const props = {
  subjectId: "subject",
  socialModuleProfileId: "primary",
  includeSubjectProfiles: true,
};

it("queries all owned profiles once and deduplicates shared Chat IDs", async () => {
  const s = setup();
  await s.reader.find(props);
  expect(s.memberships.mock.calls[0][0].params.filters.and).toEqual([
    { column: "profileId", method: "inArray", value: ["primary", "second"] },
  ]);
  expect(s.chatFind.mock.calls[0][0].params.filters.and[0].value).toEqual([
    "shared",
    "second-only",
  ]);
  expect(s.chatFind).toHaveBeenCalledTimes(1);
});

it("retains profile-specific behavior when subject expansion is not requested", async () => {
  const s = setup();
  await s.reader.find({ ...props, includeSubjectProfiles: false });
  expect(s.memberships.mock.calls[0][0].params.filters.and[0].value).toEqual([
    "primary",
  ]);
});

it("denies an unowned requester profile before looking up chats or administrative scope", async () => {
  const s = setup(true);
  await expect(
    s.reader.find({ ...props, socialModuleProfileId: "foreign" }),
  ).rejects.toThrow("does not belong to subject");
  expect(
    s.service.socialModuleChatLifecycleIsSubjectAdmin,
  ).not.toHaveBeenCalled();
  expect(s.chatFind).not.toHaveBeenCalled();
});

it("does not issue an unrestricted chat query for an ordinary Subject with no memberships", async () => {
  const s = setup();
  s.memberships.mockResolvedValue([]);
  expect(await s.reader.find(props)).toEqual([]);
  expect(s.chatFind).not.toHaveBeenCalled();
});

it("expands participants in bulk after establishing administrative access", async () => {
  const s = setup(true);
  s.memberships.mockResolvedValue([
    { chatId: "shared", profileId: "primary" },
    { chatId: "second-only", profileId: "peer" },
    { chatId: "foreign", profileId: "intruder" },
  ]);
  const rows = await s.reader.find({ ...props, includeParticipants: true });
  expect(s.memberships).toHaveBeenCalledTimes(1);
  expect(s.memberships.mock.calls[0][0].params.filters.and[0]).toEqual({
    column: "chatId",
    method: "inArray",
    value: ["shared", "second-only"],
  });
  expect(
    rows.map((row: any) => row.participants.map((profile: any) => profile.id)),
  ).toEqual([["primary"], ["peer"]]);
});

jest.mock("@sps/shared-backend-api", () => ({
  withConsistencySnapshot: async (run: () => Promise<unknown>) => run(),
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "test-jwt",
  RBAC_SECRET_KEY: "test-key",
}));
import { Handler } from ".";
function setup(include: boolean) {
  const profileLinks = jest
    .fn()
    .mockResolvedValue([
      { subjectId: "subject", socialModuleProfileId: "owned" },
    ]);
  const chatLinks = jest
    .fn()
    .mockResolvedValue([{ chatId: "chat", profileId: "owned" }]);
  const participants = jest.fn().mockResolvedValue([
    { id: "owned", slug: "self" },
    { id: "peer", slug: "peer" },
  ]);
  const chat = { id: "chat", title: "QA" };
  const handler = new Handler({
    subjectsToSocialModuleProfiles: { find: profileLinks },
    subjectsToRoles: { find: jest.fn().mockResolvedValue([]) },
    socialModule: {
      profile: {
        profilePresentation: jest.fn(async ({ id }) => ({
          id,
          title: { en: id },
          subtitle: {},
          avatar: null,
        })),
      },
      profilesToChats: { find: chatLinks },
      chat: { findById: jest.fn().mockResolvedValue(chat) },
    },
    socialModuleChatParticipants: participants,
  } as any);
  const context = {
    req: {
      param: (key: string) =>
        (
          ({
            id: "subject",
            socialModuleProfileId: "owned",
            socialModuleChatId: "chat",
          }) as Record<string, string>
        )[key],
      query: () => (include ? "true" : undefined),
    },
    json: (value: unknown) => new Response(JSON.stringify(value)),
  } as any;
  return { handler, context, participants, profileLinks, chatLinks, chat };
}
it("includes members only after validating both the owned profile and its chat membership", async () => {
  const s = setup(true);
  const r = await s.handler.execute(s.context, undefined);
  expect((await r.json()).data.participants.map((p: any) => p.id)).toEqual([
    "owned",
    "peer",
  ]);
  expect(s.participants).toHaveBeenCalledWith({ socialModuleChatId: "chat" });
});
it("preserves the existing response and does not read members without the projection", async () => {
  const s = setup(false);
  const r = await s.handler.execute(s.context, undefined);
  expect((await r.json()).data).toEqual(s.chat);
  expect(s.participants).not.toHaveBeenCalled();
});
it("does not expose members through another subject's profile", async () => {
  const s = setup(true);
  s.profileLinks.mockResolvedValue([]);
  await expect(s.handler.execute(s.context, undefined)).rejects.toThrow();
  expect(s.participants).not.toHaveBeenCalled();
  expect(s.chatLinks).not.toHaveBeenCalled();
});
it("does not expose members of a chat the owned profile has not joined", async () => {
  const s = setup(true);
  s.chatLinks.mockResolvedValue([]);
  await expect(s.handler.execute(s.context, undefined)).rejects.toThrow();
  expect(s.participants).not.toHaveBeenCalled();
});

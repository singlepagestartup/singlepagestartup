import { getAIChatDocument } from "./ai-chat-project";
it("recognizes only the predefined document kinds, independently of titles or display variants", () => {
  expect(
    getAIChatDocument({
      aiChatDocument: { profileId: "project", sourceIds: [] },
    }),
  ).toBeNull();
  expect(
    getAIChatDocument({
      aiChatDocument: { key: "topic", profileId: "project", sourceIds: [] },
    }),
  ).toBeNull();
  expect(
    getAIChatDocument({
      aiChatDocument: {
        key: "brief",
        profileId: "project",
        sourceIds: ["a", "a"],
      },
    }),
  ).toEqual({ key: "brief", profileId: "project", sourceIds: ["a"] });
});

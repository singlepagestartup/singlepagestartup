import { Service } from "./participants";
function setup(links: any[]) {
  const relationFind = jest.fn().mockResolvedValue(links);
  const profileFind = jest
    .fn()
    .mockResolvedValue([
      { id: "two", slug: "peer" },
      { id: "one", slug: "self" },
      { id: "unrelated" },
    ]);
  return {
    relationFind,
    profileFind,
    service: new Service({
      socialModule: {
        profilesToChats: { find: relationFind },
        profile: { find: profileFind },
      },
    } as any),
  };
}
it("reads only this chat's participant IDs, deduplicates them and preserves membership order", async () => {
  const s = setup([
    { chatId: "chat", profileId: "one" },
    { chatId: "other", profileId: "unrelated" },
    { chatId: "chat", profileId: "two" },
    { chatId: "chat", profileId: "one" },
  ]);
  expect(
    (await s.service.execute({ socialModuleChatId: "chat" })).map((p) => p.id),
  ).toEqual(["one", "two"]);
  expect(s.relationFind.mock.calls[0][0].params.filters.and).toEqual([
    { column: "chatId", method: "eq", value: "chat" },
  ]);
  expect(s.profileFind.mock.calls[0][0].params.filters.and).toEqual([
    { column: "id", method: "inArray", value: ["one", "two"] },
  ]);
});
it("does not issue an unrestricted profile query for an empty chat", async () => {
  const s = setup([]);
  expect(await s.service.execute({ socialModuleChatId: "chat" })).toEqual([]);
  expect(s.profileFind).not.toHaveBeenCalled();
});
it("rejects an absent chat ID before reading any associations", async () => {
  const s = setup([]);
  await expect(s.service.execute({ socialModuleChatId: "" })).rejects.toThrow(
    "Chat ID",
  );
  expect(s.relationFind).not.toHaveBeenCalled();
});

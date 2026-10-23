import { Service } from "./actions";

it("projects a departed actor only through the selected authorized Action link", async () => {
  const profilePresentation = jest.fn(async ({ id }) => ({
    id,
    title: { en: "Former member" },
    subtitle: {},
    avatar: null,
  }));
  const service = new Service({
    socialModule: {
      profilesToActions: {
        find: jest.fn(async () => [
          { actionId: "visible", profileId: "departed" },
          { actionId: "outside", profileId: "private-outside" },
        ]),
      },
      profile: { profilePresentation },
    },
  } as any);
  const result = await service.enrich([{ id: "visible" }] as any);
  expect(profilePresentation).toHaveBeenCalledTimes(1);
  expect(profilePresentation).toHaveBeenCalledWith({ id: "departed" });
  expect(result[0].actorProfileIds).toEqual(["departed"]);
  expect(result[0].actorProfiles[0]).toEqual({
    id: "departed",
    title: { en: "Former member" },
    subtitle: {},
    avatar: null,
  });
});

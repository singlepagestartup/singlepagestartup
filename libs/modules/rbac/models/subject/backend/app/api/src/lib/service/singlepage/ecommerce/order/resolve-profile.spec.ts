import { Service } from "./resolve-profile";

function fixture(ids: string[]) {
  const service = {
    subjectsToSocialModuleProfiles: {
      find: jest.fn().mockResolvedValue(
        ids.map((socialModuleProfileId) => ({
          subjectId: "buyer",
          socialModuleProfileId,
        })),
      ),
    },
    socialModule: {
      profile: {
        findById: jest.fn().mockImplementation(async ({ id }) => ({ id })),
      },
    },
  };
  return { service, resolve: new Service(service as any) };
}

it("selects the only available profile and requires a selection when several are available", async () => {
  await expect(
    fixture(["a"]).resolve.execute({ subjectId: "buyer" }),
  ).resolves.toBe("a");
  await expect(
    fixture(["a", "b"]).resolve.execute({ subjectId: "buyer" }),
  ).rejects.toThrow("Select a socialModuleProfileId");
});

it("rejects foreign and deleted profiles before reading any order", async () => {
  const f = fixture(["a", "b"]);
  await expect(
    f.resolve.execute({ subjectId: "buyer", socialModuleProfileId: "foreign" }),
  ).rejects.toThrow("Permission error");
  expect(f.service.socialModule.profile.findById).not.toHaveBeenCalled();
  f.service.socialModule.profile.findById.mockResolvedValueOnce(undefined);
  await expect(
    f.resolve.execute({ subjectId: "buyer", socialModuleProfileId: "a" }),
  ).rejects.toThrow("unavailable");
});

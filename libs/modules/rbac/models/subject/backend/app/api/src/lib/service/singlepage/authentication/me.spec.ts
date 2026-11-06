import { Service } from "./me";

it("returns a default visitor Subject as unauthenticated without creating a profile", async () => {
  const subject = {
    id: "visitor",
    variant: "default",
    slug: "scattered-turquoise-prawn",
  };
  const dependencies = {
    findById: jest.fn().mockResolvedValue(subject),
    subjectsToIdentities: { find: jest.fn().mockResolvedValue([]) },
    socialModuleProfileOwnershipEnsure: jest.fn(),
  };
  expect(
    await new Service(dependencies as any).execute({ subjectId: "visitor" }),
  ).toEqual({ ...subject, authenticated: false });
  expect(
    dependencies.socialModuleProfileOwnershipEnsure,
  ).not.toHaveBeenCalled();
  expect(dependencies.subjectsToIdentities.find).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: {
          and: [{ column: "subjectId", method: "eq", value: "visitor" }],
        },
      }),
    }),
  );
});

it("returns the current registered Subject with authenticated status", async () => {
  const subject = { id: "account", variant: "default", slug: "account" };
  const dependencies = {
    findById: jest.fn().mockResolvedValue(subject),
    subjectsToIdentities: {
      find: jest
        .fn()
        .mockResolvedValue([{ subjectId: "account", identityId: "identity" }]),
    },
  };
  expect(
    await new Service(dependencies as any).execute({ subjectId: "account" }),
  ).toEqual({ ...subject, authenticated: true });
});

it("does not treat a deleted Subject's token snapshot as an account", async () => {
  const dependencies = {
    findById: jest.fn().mockResolvedValue(undefined),
    subjectsToIdentities: { find: jest.fn() },
  };
  expect(
    await new Service(dependencies as any).execute({ subjectId: "deleted" }),
  ).toBeUndefined();
  expect(dependencies.subjectsToIdentities.find).not.toHaveBeenCalled();
});

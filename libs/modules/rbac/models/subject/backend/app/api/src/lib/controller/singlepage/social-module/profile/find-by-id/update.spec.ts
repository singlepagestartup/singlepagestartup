/** BDD: an authorized Subject can edit public Profile fields, without changing its identity or variant. */
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-secret" }));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { update: jest.fn() },
}));
import { api } from "@sps/social/models/profile/sdk/server";
import { Handler } from "./update";

function context(data: unknown) {
  return {
    req: { param: () => "owned-profile", json: async () => ({ data }) },
    json: (body: unknown) => body,
  } as any;
}

describe("Given the owner middleware has authorized a Profile", () => {
  beforeEach(() => jest.clearAllMocks());
  it("When public text and a variant are submitted Then only public fields reach the SDK", async () => {
    await new Handler().execute(
      context({
        title: { en: "Admin" },
        slug: "admin",
        variant: "artificial-intelligence",
        id: "another-profile",
      }),
    );
    expect(api.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "owned-profile",
        data: { title: { en: "Admin" }, slug: "admin" },
      }),
    );
  });
  it.each([null, { en: 42 }, ["invalid"]])(
    "When localized text is invalid Then nothing is written",
    async (title) => {
      await expect(new Handler().execute(context({ title }))).rejects.toThrow(
        "Invalid Profile text",
      );
      expect(api.update).not.toHaveBeenCalled();
    },
  );
  it("When a slug contains a path separator Then nothing is written", async () => {
    await expect(
      new Handler().execute(context({ slug: "admin/other" })),
    ).rejects.toThrow("Invalid Profile slug");
    expect(api.update).not.toHaveBeenCalled();
  });
});

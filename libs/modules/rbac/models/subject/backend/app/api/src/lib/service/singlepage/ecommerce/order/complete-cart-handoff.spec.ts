import { Service } from "./complete-cart-handoff";

function fixture(authenticatedSource = false) {
  const service = {
    me: jest.fn().mockImplementation(async ({ token }) => ({
      id: token === "guest-proof" ? "guest" : "buyer",
    })),
    subjectsToIdentities: {
      find: jest
        .fn()
        .mockResolvedValue(authenticatedSource ? [{ id: "identity" }] : []),
    },
    ecommerceModuleMergeGuestCart: jest.fn().mockResolvedValue(undefined),
  };
  return { service, handoff: new Service(service as any) };
}

it("uses verified guest and target identities plus the target account's selected profile", async () => {
  const f = fixture();
  await f.handoff.execute({
    token: "buyer-proof",
    guestSessionToken: "guest-proof",
    socialModuleProfileSelections: { buyer: "b", guest: "guest-profile" },
  });
  expect(f.service.me).toHaveBeenCalledWith({ token: "guest-proof" });
  expect(f.service.me).toHaveBeenCalledWith({ token: "buyer-proof" });
  expect(f.service.ecommerceModuleMergeGuestCart).toHaveBeenCalledWith({
    sourceSubjectId: "guest",
    subjectId: "buyer",
    socialModuleProfileId: "b",
  });
});

it("does not transfer an authenticated account's cart", async () => {
  const f = fixture(true);
  await f.handoff.execute({
    token: "buyer-proof",
    guestSessionToken: "guest-proof",
  });
  expect(f.service.ecommerceModuleMergeGuestCart).not.toHaveBeenCalled();
});

it("rejects an invalid guest proof without invoking merge", async () => {
  const f = fixture();
  f.service.me.mockRejectedValueOnce(
    new Error("Authentication error. Token revoked"),
  );
  await expect(
    f.handoff.execute({ token: "buyer-proof", guestSessionToken: "invalid" }),
  ).rejects.toThrow("Token revoked");
  expect(f.service.ecommerceModuleMergeGuestCart).not.toHaveBeenCalled();
});

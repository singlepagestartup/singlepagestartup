import { request, verify } from "./change-email";

it("sends the verification request and code in the route's data envelope", async () => {
  const fetch = jest.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          data: { stage: "current-verified", verificationId: "proof" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );
  try {
    await request({
      id: "owner",
      identityId: "identity",
      host: "http://localhost:4000",
      data: {},
    });
    expect(
      JSON.parse(
        String((fetch.mock.calls[0][1]?.body as FormData).get("data")),
      ),
    ).toEqual({});
    await verify({
      id: "owner",
      identityId: "identity",
      host: "http://localhost:4000",
      data: { challengeId: "challenge", code: "123456" },
    });
    expect(
      JSON.parse(
        String((fetch.mock.calls[1][1]?.body as FormData).get("data")),
      ),
    ).toEqual({ challengeId: "challenge", code: "123456" });
    expect(String(fetch.mock.calls[1][0])).toContain(
      "/identities/identity/email-change/verify",
    );
  } finally {
    fetch.mockRestore();
  }
});

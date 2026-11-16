import { action, type IProps } from "./repeat";

describe("repeat order transport", () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  const result = { orderIds: ["new-cart-1", "new-cart-2"] };

  beforeEach(() => {
    fetchSpy.mockReset();
    fetchSpy.mockImplementation(async () => {
      return new Response(JSON.stringify({ data: result }), {
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it("posts the source order to the explicit profile route and returns new cart IDs", async () => {
    await expect(
      action({
        id: "subject-1",
        orderId: "purchase-1",
        params: { socialModuleProfileId: "profile-1" },
        host: "http://api.test",
        options: {
          headers: { Authorization: "Bearer test" },
          cache: "force-cache",
        },
      }),
    ).resolves.toEqual(result);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/profile-1/ecommerce-module/orders/purchase-1/repeat",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Authorization: "Bearer test" },
      }),
    );
  });

  it("encodes each identifier as one path segment", async () => {
    await action({
      id: "subject/1",
      orderId: "purchase/1",
      params: { socialModuleProfileId: "profile/1" },
      host: "http://api.test",
    });

    expect(fetchSpy.mock.calls[0][0]).toBe(
      "http://api.test/api/rbac/subjects/subject%2F1/social-module/profiles/profile%2F1/ecommerce-module/orders/purchase%2F1/repeat",
    );
  });

  it.each([
    { field: "id", props: { id: "" } },
    { field: "orderId", props: { orderId: "" } },
    { field: "socialModuleProfileId", props: { params: {} } },
    { field: "socialModuleProfileId", props: { params: undefined } },
  ])(
    "rejects a missing $field before sending a request",
    async ({ field, props: invalid }) => {
      await expect(
        action({
          id: "subject-1",
          orderId: "purchase-1",
          params: { socialModuleProfileId: "profile-1" },
          ...invalid,
        } as IProps),
      ).rejects.toThrow(`Validation error. ${field} is required`);

      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("propagates a rejected repeat without treating it as an empty cart", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Validation error. Product is unavailable" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(
      action({
        id: "subject-1",
        orderId: "purchase-1",
        params: { socialModuleProfileId: "profile-1" },
      }),
    ).rejects.toThrow();
  });
});

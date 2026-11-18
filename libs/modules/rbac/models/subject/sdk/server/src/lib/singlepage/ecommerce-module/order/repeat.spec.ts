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

  it("sends the explicit next-period mode in its form body", async () => {
    await action({
      id: "subject",
      orderId: "period",
      mode: "next-period",
      host: "http://api.test",
    });
    const body = fetchSpy.mock.calls[0][1]?.body as FormData;
    expect(JSON.parse(String(body.get("data")))).toEqual({
      mode: "next-period",
    });
  });

  it("posts the source order to the subject route and returns new cart IDs", async () => {
    await expect(
      action({
        id: "subject-1",
        orderId: "purchase-1",
        host: "http://api.test",
        options: {
          headers: { Authorization: "Bearer test" },
          cache: "force-cache",
        },
      }),
    ).resolves.toEqual(result);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/ecommerce-module/orders/purchase-1/repeat",
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
      host: "http://api.test",
    });

    expect(fetchSpy.mock.calls[0][0]).toBe(
      "http://api.test/api/rbac/subjects/subject%2F1/ecommerce-module/orders/purchase%2F1/repeat",
    );
  });

  it.each([
    { field: "id", props: { id: "" } },
    { field: "orderId", props: { orderId: "" } },
  ])(
    "rejects a missing $field before sending a request",
    async ({ field, props: invalid }) => {
      await expect(
        action({
          id: "subject-1",
          orderId: "purchase-1",
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
      }),
    ).rejects.toThrow();
  });
});

jest.mock("@sps/providers-kv", () => ({ Provider: jest.fn() }));

import { Hono } from "hono";
import { Middleware } from ".";

function createApp() {
  const assertAccess = jest.fn();
  const guard = new Middleware({
    ecommerceModuleOrderAssertAccess: assertAccess,
  });
  const app = new Hono();

  app.get("/subjects/:id/orders/:orderId", guard.init(), (c) =>
    c.text("order"),
  );

  return { app, assertAccess };
}

describe("Order ownership middleware", () => {
  it("passes the subject and order from the URL to the access check", async () => {
    const { app, assertAccess } = createApp();
    const response = await app.request("/subjects/owner/orders/order-a");

    expect(assertAccess).toHaveBeenCalledWith({
      subjectId: "owner",
      orderId: "order-a",
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("order");
  });

  it("returns 403 when the service denies access, including for an operator request", async () => {
    const { app, assertAccess } = createApp();
    assertAccess.mockRejectedValue(
      new Error(
        "Permission error. Order does not belong to the current subject",
      ),
    );
    const response = await app.request("/subjects/owner/orders/order-b", {
      headers: { "X-RBAC-SECRET-KEY": "operator-secret" },
    });

    expect(response.status).toBe(403);
    expect(await response.text()).toContain("Permission error.");
  });
});

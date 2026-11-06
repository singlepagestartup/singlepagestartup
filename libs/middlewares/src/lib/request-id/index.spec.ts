import { Hono } from "hono";
import { currentRequestDiagnostics } from "@sps/backend-utils";
import { factory } from "@sps/shared-frontend-server-api";
import { Middleware } from "./index";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  API_SERVICE_URL: "http://api.test",
  RBAC_SECRET_KEY: "test-operator",
}));

it("links an internal SDK call to its parent but isolates unauthenticated and external calls", async () => {
  const app = new Hono();
  app.use(new Middleware().init());
  app.post("/child", (c) => c.json({ data: currentRequestDiagnostics() }));
  app.get("/parent", async (c) => {
    const operator = { headers: { "X-RBAC-SECRET-KEY": "test-operator" } };
    const internal = factory({ host: "http://api.test", route: "/child" });
    const external = factory({
      host: "http://elsewhere.test",
      route: "/child",
    });
    const child = await internal.create({
      data: {},
      options: {
        headers: {
          ...operator.headers,
          "x-sps-trace-id": "stale-caller-value",
        },
      },
    });
    const independent = await internal.create({ data: {} });
    const otherHost = await external.create({ data: {}, options: operator });
    return c.json({
      parent: currentRequestDiagnostics(),
      child,
      independent,
      otherHost,
    });
  });
  const routed = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (url, init) => {
      return app.request(String(url), init);
    });
  try {
    const forged = "2f6afa5a-31b3-48b3-80aa-b51a348f4403";
    const response = await app.request("/parent", {
      headers: {
        "X-SPS-Trace-Id": forged,
        "X-SPS-Parent-Request-Id": forged,
        "x-request-id": forged,
      },
    });
    expect(response.status).toBe(200);
    const { parent, child, independent, otherHost } = await response.json();
    expect(parent.requestId).not.toBe(forged);
    expect(parent.traceId).toBe(parent.requestId);
    expect(child.requestId).not.toBe(parent.requestId);
    expect(child).toMatchObject({
      traceId: parent.traceId,
      parentRequestId: parent.requestId,
    });
    for (const isolated of [independent, otherHost]) {
      expect(isolated.traceId).not.toBe(parent.traceId);
      expect(isolated.traceId).toBe(isolated.requestId);
      expect(isolated.parentRequestId).toBeUndefined();
    }
  } finally {
    routed.mockRestore();
  }
});

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Middleware } from ".";

function setup(status: 201 | 400 | 401 | 500, allowed = true) {
  const operations: Array<{ prefix: string; args: string[]; key: string }> = [];
  const store = {
    eval: jest.fn(async (props) => {
      operations.push(props);
      return JSON.stringify({
        allowed,
        firstExceeded: true,
        retryAfterInSeconds: 3590,
        previousFailures: 1,
      });
    }),
  };
  const app = new Hono();
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    return c.json({ error: "internal" }, 500);
  });
  const handler = jest.fn((c) => {
    if (status !== 201) {
      throw new HTTPException(status);
    }
    return c.json({ ok: true }, 201);
  });
  app.post(
    "/",
    new Middleware({ storeProvider: store, enabled: true }).init(),
    handler,
  );
  const request = () => {
    const form = new FormData();
    form.set(
      "data",
      JSON.stringify({
        login: " Owner@Example.com ",
        password: "secret-not-logged",
      }),
    );
    return app.request("/", { method: "POST", body: form });
  };
  return { request, operations, store, handler };
}

describe("Password failure reservation", () => {
  it.each([201, 400, 500] as const)(
    "releases the slot after HTTP %s",
    async (status) => {
      const test = setup(status);
      expect((await test.request()).status).toBe(status);
      expect(test.operations[1].args[0]).toBe("release");
      expect(test.operations[0].key).toBe("owner@example.com");
      expect(JSON.stringify(test.operations)).not.toContain(
        "secret-not-logged",
      );
    },
  );
  it("retains a failed password even when Hono's error handler handles the exception", async () => {
    const test = setup(401);
    expect((await test.request()).status).toBe(401);
    expect(test.operations[1].args[0]).toBe("failure");
    expect(test.operations[2].args[1]).toBe("password-failed");
  });
  it("returns Retry-After without checking the password when the budget is full", async () => {
    const test = setup(201, false);
    const response = await test.request();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3590");
    expect(test.handler).not.toHaveBeenCalled();
  });
  it("refuses login if Redis cannot reserve an attempt", async () => {
    const test = setup(201);
    test.store.eval.mockRejectedValueOnce(new Error("offline"));
    expect((await test.request()).status).toBe(503);
    expect(test.handler).not.toHaveBeenCalled();
  });
});

/**
 * BDD Suite: the logout route revokes the presented token's subject.
 *
 * Given: a logout request with or without a bearer token, and an outer
 * middleware that reads the request context once the handler returns, as the
 * is-authorized middleware does.
 * When: the logout handler runs.
 * Then: the token reaches the service, the context names the subject the
 * service revoked, the session cookie is deleted, and the answer is ok.
 */

import { Hono } from "hono";
import { RBAC_REVOKED_SUBJECT_CONTEXT_KEY } from "@sps/shared-utils";
import { Handler } from "./logout";

function createApp(props: { revokedSubject: { id: string } | null }) {
  const service = {
    logout: jest.fn().mockResolvedValue({ subject: props.revokedSubject }),
  };
  const revokedSubjects: unknown[] = [];
  const app = new Hono<{
    Variables: Record<typeof RBAC_REVOKED_SUBJECT_CONTEXT_KEY, string>;
  }>();

  app.use(async (c, next) => {
    await next();

    revokedSubjects.push(c.get(RBAC_REVOKED_SUBJECT_CONTEXT_KEY));
  });
  app.post("/api/rbac/subjects/authentication/logout", (c) => {
    return new Handler(service as any).execute(c, undefined);
  });

  return { app, service, revokedSubjects };
}

describe("Given: a logout request", () => {
  /**
   * BDD Scenario
   * Given: a request carrying an access token as a bearer, whose subject the
   * service revokes.
   * When: the handler runs.
   * Then: the service receives the token, the context names the revoked
   * subject for the middleware, and the session cookie is deleted.
   */
  it("When: the service revokes the token's subject Then: names it in the context", async () => {
    const { app, service, revokedSubjects } = createApp({
      revokedSubject: { id: "subject-1" },
    });

    const response = await app.request(
      "/api/rbac/subjects/authentication/logout",
      {
        method: "POST",
        headers: { Authorization: "Bearer access-token-1" },
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
    expect(service.logout).toHaveBeenCalledWith({ token: "access-token-1" });
    expect(revokedSubjects).toEqual(["subject-1"]);
    expect(response.headers.get("set-cookie")).toContain("rbac.subject.jwt=;");
  });

  /**
   * BDD Scenario
   * Given: a request without a token, so the service revokes nothing.
   * When: the handler runs.
   * Then: the answer is still ok and the context names no subject.
   */
  it("When: nothing is revoked Then: answers ok and names no subject", async () => {
    const { app, service, revokedSubjects } = createApp({
      revokedSubject: null,
    });

    const response = await app.request(
      "/api/rbac/subjects/authentication/logout",
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
    expect(service.logout).toHaveBeenCalledWith({ token: undefined });
    expect(revokedSubjects).toEqual([undefined]);
  });
});

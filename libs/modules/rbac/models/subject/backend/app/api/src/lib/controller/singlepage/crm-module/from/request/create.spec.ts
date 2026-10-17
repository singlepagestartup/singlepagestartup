import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { Handler } from "./create";
import { Middleware as RequestSubjectIdOwner } from "../../../../../../../../middlewares/src/lib/request-subject-is-owner";
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-secret",
  RBAC_JWT_SECRET: "test-jwt",
}));
jest.mock("@sps/backend-utils", () => ({
  authorization: (c: any) => c.req.header("Authorization"),
  verifyJwt: async () => ({ subject: { id: "owner" } }),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

function fixture() {
  const crmModuleFormRequestCreate = jest.fn(async () => ({
    id: "owner",
    submissionResult: {
      saved: true,
      requestId: "saved-request",
      notificationStatus: "sent",
    },
  }));
  const app = new Hono();
  app.post(
    "/:id/crm-module/form/:crmModuleFormId/request",
    new RequestSubjectIdOwner().init({ requireJwt: true }),
    (c) =>
      new Handler({ crmModuleFormRequestCreate } as any).execute(c, undefined),
  );
  const data = { submissionId: randomUUID(), steps: [] };
  const send = (
    owner = "owner",
    headers: Record<string, string> = { Authorization: "token" },
    payload: unknown = data,
  ) => {
    const body = new FormData();
    body.set("data", JSON.stringify(payload));
    return app.request(`/${owner}/crm-module/form/${randomUUID()}/request`, {
      method: "POST",
      headers,
      body,
    });
  };
  return { send, crmModuleFormRequestCreate, data };
}
it("delegates a typed owned submission to the public Subject service and returns its saved receipt", async () => {
  const { send, crmModuleFormRequestCreate, data } = fixture();
  const response = await send();
  expect(response.status).toBe(200);
  expect(crmModuleFormRequestCreate).toHaveBeenCalledWith(
    expect.objectContaining({ subjectId: "owner", data }),
  );
  expect(((await response.json()) as any).data.submissionResult.saved).toBe(
    true,
  );
});
it.each(["foreign", "no-jwt", "invalid-shape"])(
  "rejects %s before executing the submission service",
  async (scenario) => {
    const { send, crmModuleFormRequestCreate } = fixture();
    const response =
      scenario === "foreign"
        ? await send("other")
        : scenario === "no-jwt"
          ? await send("owner", { "X-RBAC-SECRET-KEY": "test-secret" })
          : await send(
              "owner",
              { Authorization: "token" },
              { submissionId: "not-a-uuid", steps: [] },
            );
    expect(response.status).toBe(400);
    expect(crmModuleFormRequestCreate).not.toHaveBeenCalled();
  },
);

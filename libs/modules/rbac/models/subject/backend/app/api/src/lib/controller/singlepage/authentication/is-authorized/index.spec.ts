import { api } from "@sps/rbac/models/subject/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

describe("is-authorized", () => {
  it("should return 200 if valid X-RBAC-SECRET-KEY header is provided", async () => {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const result = await api.authenticationIsAuthorized({
      params: {
        action: {
          route: "/api/identitiies",
          method: "GET",
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    expect(result).toEqual({ ok: true });
  });

  it("should return 4XX if not valid X-RBAC-SECRET-KEY header is provided", async () => {
    const result = async () => {
      const res = await api.authenticationIsAuthorized({
        params: {
          action: {
            route: "/api/identitiies",
            method: "GET",
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "11123213123123123",
          },
        },
      });

      expect(res).toBeUndefined();
    };

    await expect(result).rejects.toThrow(
      "http://localhost:3000/is-authorized?action[route]=%2Fapi%2Fidentitiies&action[method]=GET | Unauthorized",
    );
  });
});

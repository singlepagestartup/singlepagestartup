import { Hono } from "hono";
import { sign } from "hono/jwt";
jest.mock("@sps/shared-utils", () => ({
  entityMetadataSchema:
    jest.requireActual("@sps/shared-utils").entityMetadataSchema,
  RBAC_JWT_SECRET: "balance-test-secret",
  RBAC_SECRET_KEY: "internal",
}));
import { RequestSubjectIdOwner } from "../../../../../../middlewares";
import { Handler } from "./balance";
import { Service as StartupBalance } from "../../../service/startup/billing/balance";

it("serves the project balance to its owner and rejects another Subject", async () => {
  const balances = { find: jest.fn().mockResolvedValue([{ amount: "3000" }]) };
  const handler = new Handler({
    module: {
      subjectsToBillingModuleCurrencies: balances,
    },
    modules: {
      billing: {
        currency: {
          find: jest.fn().mockResolvedValue([{ id: "token-currency" }]),
        },
      },
    },
  } as any);
  const app = new Hono().get(
    "/subjects/:id/billing-module/balance",
    new RequestSubjectIdOwner().init(),
    (c) => handler.execute(c),
  );
  const token = await sign({ subject: { id: "owner" } }, "balance-test-secret");
  const own = await app.request("/subjects/owner/billing-module/balance", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(own.status).toBe(200);
  expect(await own.json()).toEqual({
    data: { amount: "3000", currencyId: "token-currency" },
  });
  balances.find.mockClear();
  const foreign = await app.request("/subjects/other/billing-module/balance", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(foreign.status).toBe(401);
  expect(balances.find).not.toHaveBeenCalled();

  const projectBalance = { amount: "7300", currencyId: "project-currency" };
  const override = jest
    .spyOn(StartupBalance.prototype, "execute")
    .mockResolvedValue(projectBalance);
  try {
    const response = await app.request(
      "/subjects/owner/billing-module/balance",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: projectBalance });
    expect(override).toHaveBeenCalledWith("owner");
  } finally {
    override.mockRestore();
  }
});

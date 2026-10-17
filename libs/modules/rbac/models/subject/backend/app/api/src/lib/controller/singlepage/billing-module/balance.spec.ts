import { Hono } from "hono";
import { sign } from "hono/jwt";
jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "balance-test-secret",
  RBAC_SECRET_KEY: "internal",
}));
import { RequestSubjectIdOwner } from "../../../../../../middlewares";
import { Handler } from "./balance";

it("allows an ordinary Subject to read its balance and rejects another Subject", async () => {
  const balances = { find: jest.fn().mockResolvedValue([{ amount: "3000" }]) };
  const handler = new Handler({
    billingModule: {
      currency: {
        find: jest.fn().mockResolvedValue([{ id: "token-currency" }]),
      },
    },
    subjectsToBillingModuleCurrencies: balances,
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
});

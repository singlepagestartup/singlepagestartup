/**
 * BDD Suite: OpenRouter route billing service behavior.
 *
 * Given: route billing precharges before the OpenRouter controller executes.
 * When: the service reserves a token and later settles exact provider usage.
 * Then: all balance rows count, concurrent requests cannot reuse the last token,
 * and a depleted balance blocks subsequent generations.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("@sps/rbac/models/permission/sdk/server", () => {
  return {
    api: {
      resolveByRoute: jest.fn(),
    },
  };
});

jest.mock("hono/jwt", () => {
  return {
    verify: jest.fn(),
  };
});

import { Service } from "./route";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import * as jwt from "hono/jwt";

const mockedResolveByRoute = permissionApi.resolveByRoute as jest.Mock;
const mockedJwtVerify = jwt.verify as jest.Mock;

function createService(subjectCurrencyAmount: string | string[]) {
  const balances = (
    Array.isArray(subjectCurrencyAmount)
      ? subjectCurrencyAmount
      : [subjectCurrencyAmount]
  ).map((amount, index) => ({
    id: `subject-currency-${index + 1}`,
    subjectId: "subject-1",
    billingModuleCurrencyId: "currency-1",
    amount,
  }));
  const subjectsToBillingModuleCurrenciesService = {
    find: jest.fn(async () => balances.map((balance) => ({ ...balance }))),
    updateAmountIfUnchanged: jest.fn(async ({ id, expectedAmount, amount }) => {
      const balance = balances.find((row) => row.id === id);
      if (!balance || balance.amount !== expectedAmount) return undefined;
      balance.amount = amount;
      return { ...balance };
    }),
  };

  const service = new Service(
    {} as any,
    subjectsToBillingModuleCurrenciesService as any,
  );

  return {
    service,
    subjectsToBillingModuleCurrenciesService,
    balance: () => balances.reduce((sum, row) => sum + Number(row.amount), 0),
  };
}

function buildExecuteProps(route: string) {
  return {
    permission: {
      route,
      method: "POST" as const,
      type: "HTTP" as const,
    },
    authorization: {
      value: "jwt-token",
    },
  };
}

describe("OpenRouter route billing service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedJwtVerify.mockResolvedValue({
      subject: {
        id: "subject-1",
      },
    });
    mockedResolveByRoute.mockResolvedValue({
      permission: {
        id: "permission-1",
      },
      permissionsToBillingModuleCurrencies: [
        {
          billingModuleCurrencyId: "currency-1",
          amount: "1",
        },
      ],
    });
  });

  /**
   * BDD Scenario
   * Given: an OpenRouter request starts with a depleted or fractional balance.
   * When: the billing middleware executes before the controller.
   * Then: no provider request is allowed and no debit is written.
   */
  it.each(["0", "-12", "0.5"])(
    "rejects a %s token balance before generation",
    async (amount) => {
      const { service, subjectsToBillingModuleCurrenciesService } =
        createService(amount);

      await expect(
        service.execute(
          buildExecuteProps(
            "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
          ),
        ),
      ).rejects.toThrow("do not have enough balance for that route");
      expect(
        subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged,
      ).not.toHaveBeenCalled();
    },
  );

  it("reserves the last token without crossing below zero", async () => {
    const { service, subjectsToBillingModuleCurrenciesService } =
      createService("1");

    const result = await service.execute(
      buildExecuteProps(
        "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
      ),
    );

    expect(result).toMatchObject({
      ok: true,
      precharge: {
        amount: 1,
        balanceBefore: 1,
        balanceAfter: 0,
      },
    });
    expect(
      subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      expectedAmount: "1",
      amount: "0",
    });
  });

  /**
   * BDD Scenario
   * Given: an OpenRouter route is requested while the subject already has a negative balance.
   * When: the precharge guard runs before controller execution.
   * Then: the request is rejected before any additional debit is applied.
   */
  it("blocks subsequent OpenRouter requests while the balance is already negative", async () => {
    const { service, subjectsToBillingModuleCurrenciesService } =
      createService("-0.5");

    await expect(
      service.execute(
        buildExecuteProps(
          "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
        ),
      ),
    ).rejects.toThrow("do not have enough balance for that route");

    expect(
      subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged,
    ).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the route already precharged one token before provider usage was finalized.
   * When: settlement computes an exact charge below or above the precharge.
   * Then: the service refunds the difference or applies an additional debit.
   */
  it("reconciles refunds and additional debits during settlement", async () => {
    const refund = createService("-1");
    const refundResult = await refund.service.settle({
      ...buildExecuteProps(
        "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
      ),
      exactAmount: "0",
    });

    expect(refundResult).toMatchObject({
      ok: true,
      settlement: {
        prechargeAmount: 1,
        exactAmount: 0,
        deltaAmount: -1,
        balanceBefore: -1,
        balanceAfter: 0,
      },
    });
    expect(
      refund.subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      expectedAmount: "-1",
      amount: "0",
    });

    const additionalDebit = createService("0");
    const additionalDebitResult = await additionalDebit.service.settle({
      ...buildExecuteProps(
        "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
      ),
      exactAmount: "3",
    });

    expect(additionalDebitResult).toMatchObject({
      ok: true,
      settlement: {
        prechargeAmount: 1,
        exactAmount: 3,
        deltaAmount: 2,
        balanceBefore: 0,
        balanceAfter: -2,
      },
    });
    expect(
      additionalDebit.subjectsToBillingModuleCurrenciesService
        .updateAmountIfUnchanged,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      expectedAmount: "0",
      amount: "-2",
    });
  });

  it.each([
    ["0", "-27"],
    ["3000", "-3027"],
    ["0", "0"],
  ])(
    "blocks a depleted aggregate despite individual balance rows: %s and %s",
    async (first, second) => {
      const { service, subjectsToBillingModuleCurrenciesService } =
        createService([first, second]);
      await expect(
        service.execute(
          buildExecuteProps("/multi-balance/react-by/openrouter"),
        ),
      ).rejects.toThrow("do not have enough balance for that route");
      expect(
        subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged,
      ).not.toHaveBeenCalled();
    },
  );

  it("uses split credits and the same aggregate for precharge and settlement", async () => {
    const { service, balance } = createService(["0.4", "3.6"]);
    const props = buildExecuteProps("/split-credits/react-by/openrouter");
    await expect(service.execute(props)).resolves.toMatchObject({
      precharge: { balanceBefore: 4, balanceAfter: 3 },
    });
    await expect(
      service.settle({ ...props, exactAmount: "3" }),
    ).resolves.toMatchObject({
      settlement: { balanceBefore: 3, balanceAfter: 1 },
    });
    expect(balance()).toBe(1);
  });

  it("allows only one of two concurrent requests to reserve the last token", async () => {
    const { service, balance } = createService(["1", "0"]);
    const props = buildExecuteProps("/last-token/react-by/openrouter");
    const results = await Promise.allSettled([
      service.execute(props),
      service.execute(props),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({
      reason: expect.objectContaining({
        message: expect.stringContaining("do not have enough balance"),
      }),
    });
    expect(balance()).toBe(0);
  });

  it("blocks another generation after exact usage exceeds the reservation even with a zero row", async () => {
    const { service } = createService(["1", "0"]);
    const props = buildExecuteProps("/settled-overdraft/react-by/openrouter");
    await service.execute(props);
    await service.settle({ ...props, exactAmount: "13" });
    await expect(service.execute(props)).rejects.toThrow(
      "do not have enough balance",
    );
  });

  it("keeps fixed-price billing guards for other routes", async () => {
    const { service } = createService("0");
    await expect(
      service.execute(buildExecuteProps("/fixed-price-action")),
    ).rejects.toThrow("do not have enough balance");
  });

  it("does not permit a zero configured OpenRouter precharge to bypass the minimum", async () => {
    mockedResolveByRoute.mockResolvedValueOnce({
      permission: { id: "zero-configured" },
      permissionsToBillingModuleCurrencies: [
        { billingModuleCurrencyId: "currency-1", amount: "0" },
      ],
    });
    const { service } = createService("0");
    await expect(
      service.execute(
        buildExecuteProps("/zero-configured/react-by/openrouter"),
      ),
    ).rejects.toThrow("do not have enough balance");
  });
});

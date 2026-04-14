/**
 * BDD Suite: OpenRouter route billing service behavior.
 *
 * Given: route billing precharges before the OpenRouter controller executes.
 * When: the service applies the issue-158 balance guard and later settles exact usage.
 * Then: the first request may go negative, later negative requests are blocked, and settlement reconciles the delta.
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

import { Service } from "./bill-route";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import * as jwt from "hono/jwt";

const mockedResolveByRoute = permissionApi.resolveByRoute as jest.Mock;
const mockedJwtVerify = jwt.verify as jest.Mock;

function createService(subjectCurrencyAmount: string) {
  const subjectsToBillingModuleCurrenciesService = {
    find: jest.fn().mockResolvedValue([
      {
        id: "subject-currency-1",
        subjectId: "subject-1",
        billingModuleCurrencyId: "currency-1",
        amount: subjectCurrencyAmount,
      },
    ]),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const service = new Service(
    {} as any,
    subjectsToBillingModuleCurrenciesService as any,
  );

  return {
    service,
    subjectsToBillingModuleCurrenciesService,
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
   * Given: an OpenRouter request starts with zero balance and a one-token precharge.
   * When: the billing middleware executes before the controller.
   * Then: the request is allowed and the stored balance becomes negative.
   */
  it("allows the first OpenRouter request to cross below zero", async () => {
    const { service, subjectsToBillingModuleCurrenciesService } =
      createService("0");

    const result = await service.execute(
      buildExecuteProps(
        "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
      ),
    );

    expect(result).toMatchObject({
      ok: true,
      precharge: {
        amount: 1,
        balanceBefore: 0,
        balanceAfter: -1,
      },
    });
    expect(
      subjectsToBillingModuleCurrenciesService.update,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      data: expect.objectContaining({
        amount: "-1",
      }),
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
      subjectsToBillingModuleCurrenciesService.update,
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
      refund.subjectsToBillingModuleCurrenciesService.update,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      data: expect.objectContaining({
        amount: "0",
      }),
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
      additionalDebit.subjectsToBillingModuleCurrenciesService.update,
    ).toHaveBeenCalledWith({
      id: "subject-currency-1",
      data: expect.objectContaining({
        amount: "-2",
      }),
    });
  });
});

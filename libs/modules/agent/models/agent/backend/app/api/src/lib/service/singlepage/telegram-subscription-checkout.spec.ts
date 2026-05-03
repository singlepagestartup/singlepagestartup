/**
 * BDD Suite: Telegram subscription checkout duplicate handling.
 *
 * Given: the Telegram callback checkout flow receives active-subscription validation from RBAC checkout.
 * When: the agent service handles a repeated subscription checkout callback.
 * Then: the Telegram chat receives an existing-subscription message instead of an invoice.
 */

jest.mock("@sps/shared-utils", () => {
  return {
    RBAC_SECRET_KEY: "rbac-secret",
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME: "",
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK: "",
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID: "",
    telegramBotServiceMessages: {
      ecommerceModuleOrderAlreadyHaveSubscription: {
        ru: "У вас уже есть активная подписка.",
      },
    },
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      ecommerceModuleProductCheckout: jest.fn(),
    },
  };
});

import { Service } from "./index";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";

const mockedEcommerceModuleProductCheckout =
  rbacModuleSubjectApi.ecommerceModuleProductCheckout as jest.Mock;

function createService() {
  const service = Object.create(Service.prototype) as Service;

  (service as any).extendedEcommerceModuleProduct = jest
    .fn()
    .mockResolvedValue({
      id: "product-subscription",
    });
  (service as any).getMessageFromRbacModuleSubject = jest
    .fn()
    .mockResolvedValue({
      id: "message-subject",
    });
  (service as any).telegramBotReplyMessageCreate = jest
    .fn()
    .mockResolvedValue(undefined);
  (service as any).billingModule = {
    currency: {
      find: jest.fn().mockResolvedValue([
        {
          id: "currency-telegram-star",
          slug: "telegram-star",
        },
      ]),
    },
  };
  (service as any).statusMessages = {
    ecommerceModuleOrderAlreadyHaveSubscription: {
      ru: "У вас уже есть активная подписка.",
    },
  };

  return service;
}

describe("Given: Telegram subscription checkout duplicate handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   *
   * Given: the RBAC product checkout rejects a Telegram Star checkout because the subject already has the same active subscription.
   * When: the Telegram checkout callback handler catches that validation.
   * Then: it sends the existing-subscription message to the same chat context and does not rethrow.
   */
  it("Then: sends existing-subscription message for duplicate checkout", async () => {
    const service = createService();
    const checkoutMessage =
      "Validation error. Checking out order has active subscription products.";

    mockedEcommerceModuleProductCheckout.mockRejectedValue(
      new Error(
        JSON.stringify({
          message: checkoutMessage,
          status: 400,
          cause: [{ message: checkoutMessage }],
        }),
      ),
    );

    const props = {
      jwtToken: "jwt-token",
      rbacModuleSubject: {
        id: "bot-subject",
      },
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
      },
      socialModuleChat: {
        id: "chat-1",
        sourceSystemId: "telegram-chat-1",
      },
      socialModuleAction: {
        id: "action-1",
      },
      messageFromSocialModuleProfile: {
        id: "sender-profile",
      },
      ecommerceModuleProductId: "product-subscription",
    } as any;

    await expect(
      service.telegramBotEcommerceModuleProductFindByIdCheckout(props),
    ).resolves.toBeUndefined();

    expect(mockedEcommerceModuleProductCheckout).toHaveBeenCalledWith({
      id: "message-subject",
      productId: "product-subscription",
      data: {
        provider: "telegram-star",
        billingModule: {
          currency: {
            id: "currency-telegram-star",
            slug: "telegram-star",
          },
        },
        account: "telegram-chat-1",
      },
    });
    expect((service as any).telegramBotReplyMessageCreate).toHaveBeenCalledWith(
      {
        ...props,
        data: {
          description: "У вас уже есть активная подписка.",
        },
      },
    );
  });
});

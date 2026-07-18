/**
 * BDD Suite: Notification send idempotency
 *
 * Given a notification send request may reference missing, expired, or valid notifications
 * When the notification send service processes the request
 * Then it skips non-repeatable delivery outcomes and preserves valid provider delivery
 */
import { Service } from ".";
import { IModel } from "@sps/notification/models/notification/sdk/model";
import { api as notificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as templateApi } from "@sps/notification/models/template/sdk/server";

const mockTelegramSendDocument = jest.fn();
const mockTelegramSendMessage = jest.fn();

jest.mock("grammy", () => ({
  Bot: jest.fn().mockImplementation(() => ({
    api: {
      sendDocument: mockTelegramSendDocument,
      sendMessage: mockTelegramSendMessage,
    },
  })),
  InputFile: jest.fn(),
}));

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "test-telegram-token",
}));

jest.mock(
  "@sps/notification/relations/notifications-to-templates/sdk/server",
  () => ({
    api: {
      find: jest.fn(),
    },
  }),
);

jest.mock("@sps/notification/models/template/sdk/server", () => ({
  api: {
    find: jest.fn(),
    render: jest.fn(),
  },
}));

const notificationsToTemplatesFindMock =
  notificationsToTemplatesApi.find as jest.Mock;
const templateFindMock = templateApi.find as jest.Mock;

function createNotification(overrides: Partial<IModel> = {}): IModel {
  const now = new Date();

  return {
    id: "notification-id",
    createdAt: now,
    updatedAt: now,
    variant: "default",
    status: "new",
    title: "Notification title",
    data: {},
    reciever: "receiver@example.com",
    attachments: [],
    sendAfter: new Date(now.getTime() - 1000),
    sourceSystemId: null,
    ...overrides,
  } as IModel;
}

function createService(overrides: Record<string, jest.Mock> = {}) {
  return Object.assign(Object.create(Service.prototype), {
    findById: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    provider: jest.fn(),
    ...overrides,
  }) as Service & Record<string, jest.Mock>;
}

describe("notification send service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (jest.requireMock("grammy").Bot as jest.Mock).mockImplementation(() => ({
      api: {
        sendDocument: mockTelegramSendDocument,
        sendMessage: mockTelegramSendMessage,
      },
    }));
  });

  /**
   * BDD Scenario: Missing notification is skipped
   *
   * Given a send request references a notification that no longer exists
   * When the notification send service processes the request
   * Then it returns null and does not call the provider
   */
  it("returns null without provider delivery when the notification is missing", async () => {
    const service = createService({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(service.send({ id: "missing-id" })).resolves.toBeNull();
    expect(service.provider).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
    expect(notificationsToTemplatesFindMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Expired notification is skipped
   *
   * Given a new notification is older than the expiration timeout
   * When the notification send service processes the request
   * Then it deletes the notification best-effort, returns null, and does not call the provider
   */
  it("deletes and returns null without provider delivery when the notification is expired", async () => {
    const expiredNotification = createNotification({
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
    const service = createService({
      findById: jest.fn().mockResolvedValue(expiredNotification),
      delete: jest.fn().mockResolvedValue(expiredNotification),
    });

    await expect(
      service.send({ id: expiredNotification.id }),
    ).resolves.toBeNull();
    expect(service.delete).toHaveBeenCalledWith({ id: expiredNotification.id });
    expect(service.provider).not.toHaveBeenCalled();
    expect(notificationsToTemplatesFindMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Valid notification is delivered
   *
   * Given a new non-expired notification is ready to send
   * When the notification send service processes the request
   * Then it keeps existing template lookup and provider delivery behavior
   */
  it("keeps provider delivery behavior for a valid new notification", async () => {
    const notification = createNotification();
    const sentNotification = createNotification({ status: "sent" });
    const service = createService({
      findById: jest.fn().mockResolvedValue(notification),
      provider: jest.fn().mockResolvedValue(sentNotification),
    });

    notificationsToTemplatesFindMock.mockResolvedValue([
      {
        notificationId: notification.id,
        templateId: "template-id",
      },
    ]);
    templateFindMock.mockResolvedValue([
      {
        id: "template-id",
        variant: "generate-email-agent-result-admin",
      },
    ]);

    await expect(service.send({ id: notification.id })).resolves.toBe(
      sentNotification,
    );
    expect(service.provider).toHaveBeenCalledWith({
      method: "email",
      provider: "Amazon SES",
      id: notification.id,
      template: {
        id: "template-id",
        variant: "generate-email-agent-result-admin",
      },
    });
    expect(service.delete).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Blocked Telegram recipient is terminal
   *
   * Given a new notification is ready for Telegram delivery
   * When Telegram reports that the recipient blocked the bot
   * Then the notification is marked as error and returned without propagating the provider error
   */
  it("marks blocked Telegram recipient delivery as a terminal error", async () => {
    const notification = createNotification({ reciever: "5530000566" });
    const erroredNotification = createNotification({
      reciever: notification.reciever,
      status: "error",
    });
    const service = createService({
      findById: jest.fn().mockResolvedValue(notification),
      provider: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Call to 'sendMessage' failed! (403: Forbidden: bot was blocked by the user)",
          ),
        ),
      update: jest.fn().mockResolvedValue(erroredNotification),
    });

    notificationsToTemplatesFindMock.mockResolvedValue([
      {
        notificationId: notification.id,
        templateId: "template-id",
      },
    ]);
    templateFindMock.mockResolvedValue([
      {
        id: "template-id",
        variant: "generate-telegram-agent-result-user",
      },
    ]);

    await expect(service.send({ id: notification.id })).resolves.toBe(
      erroredNotification,
    );
    expect(service.provider).toHaveBeenCalledWith({
      method: "telegram",
      provider: "Telegram",
      id: notification.id,
      template: {
        id: "template-id",
        variant: "generate-telegram-agent-result-user",
      },
    });
    expect(service.update).toHaveBeenCalledWith({
      id: notification.id,
      data: {
        ...notification,
        status: "error",
      },
    });
    expect(service.delete).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Error notification is skipped
   *
   * Given a notification was already marked as an error
   * When the notification send service processes the request again
   * Then it returns the notification without template lookup or provider delivery
   */
  it("skips delivery when the notification is already marked as error", async () => {
    const erroredNotification = createNotification({ status: "error" });
    const service = createService({
      findById: jest.fn().mockResolvedValue(erroredNotification),
    });

    await expect(service.send({ id: erroredNotification.id })).resolves.toBe(
      erroredNotification,
    );
    expect(service.provider).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
    expect(notificationsToTemplatesFindMock).not.toHaveBeenCalled();
    expect(templateFindMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Non-blocked provider failure is preserved
   *
   * Given a new notification is ready for Telegram delivery
   * When the provider fails for a reason other than a blocked recipient
   * Then the original error is propagated and the notification is not marked as error
   */
  it("propagates unrelated Telegram provider errors without marking the notification as error", async () => {
    const notification = createNotification({ reciever: "5530000566" });
    const service = createService({
      findById: jest.fn().mockResolvedValue(notification),
      provider: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Call to 'sendMessage' failed! (500: Internal Server Error)",
          ),
        ),
    });

    notificationsToTemplatesFindMock.mockResolvedValue([
      {
        notificationId: notification.id,
        templateId: "template-id",
      },
    ]);
    templateFindMock.mockResolvedValue([
      {
        id: "template-id",
        variant: "generate-telegram-agent-result-user",
      },
    ]);

    await expect(service.send({ id: notification.id })).rejects.toThrow(
      "Internal Server Error",
    );
    expect(service.provider).toHaveBeenCalledWith({
      method: "telegram",
      provider: "Telegram",
      id: notification.id,
      template: {
        id: "template-id",
        variant: "generate-telegram-agent-result-user",
      },
    });
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Telegram media URL fetch failures are retried as uploads
   *
   * Given Telegram rejects a media URL because it cannot fetch readable content
   * When the notification service classifies the delivery error
   * Then it treats both curl and empty media failures as retriable upload-fallback cases
   */
  it("treats Telegram empty webpage media as a retriable upload fallback error", () => {
    const service = createService() as unknown as {
      isTelegramWebpageMediaFetchFailed: (error: unknown) => boolean;
    };

    expect(
      service.isTelegramWebpageMediaFetchFailed(
        new Error(
          "Call to 'sendMediaGroup' failed! (400: Bad Request: WEBPAGE_CURL_FAILED)",
        ),
      ),
    ).toBe(true);
    expect(
      service.isTelegramWebpageMediaFetchFailed(
        new Error(
          "Call to 'sendMediaGroup' failed! (400: Bad Request: failed to send message #1 with the error message \"WEBPAGE_MEDIA_EMPTY\")",
        ),
      ),
    ).toBe(true);
    expect(
      service.isTelegramWebpageMediaFetchFailed(
        new Error("Call to 'sendMessage' failed! (500: Internal Server Error)"),
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: A single text attachment is delivered as a Telegram document
   *
   * Given a Telegram notification contains one reachable TXT attachment
   * When the provider sends that notification
   * Then it uses sendDocument instead of an invalid one-item media group
   */
  it("sends one TXT attachment as a Telegram document", async () => {
    const notification = createNotification({
      reciever: "-100123",
      attachments: [
        {
          type: "document",
          url: "https://cdn.example.test/knowledge.txt",
        },
      ],
    });
    const sentNotification = createNotification({
      ...notification,
      status: "sent",
      sourceSystemId: "321",
    });
    const service = Object.assign(Object.create(Service.prototype), {
      findById: jest.fn().mockResolvedValue(notification),
      update: jest.fn().mockResolvedValue(sentNotification),
    }) as Service;
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
    } as Response);
    mockTelegramSendDocument.mockResolvedValue({ message_id: 321 });
    (templateApi.render as jest.Mock).mockResolvedValue(
      JSON.stringify({
        method: "sendMessage",
        props: ["Knowledge-документ", { message_thread_id: 77 }],
      }),
    );

    await expect(
      service.provider({
        method: "telegram",
        provider: "Telegram",
        id: notification.id,
        template: {
          id: "template-id",
          variant: "generate-telegram-agent-result-user",
        } as any,
      }),
    ).resolves.toBe(sentNotification);

    expect(mockTelegramSendDocument).toHaveBeenCalledWith(
      notification.reciever,
      notification.attachments?.[0].url,
      expect.objectContaining({
        caption: expect.any(String),
        message_thread_id: 77,
      }),
    );
    expect(service.update).toHaveBeenCalledWith({
      id: notification.id,
      data: expect.objectContaining({
        sourceSystemId: "321",
        status: "sent",
      }),
    });
    expect(mockTelegramSendMessage).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});

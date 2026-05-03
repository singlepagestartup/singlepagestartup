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
    provider: jest.fn(),
    ...overrides,
  }) as Service & Record<string, jest.Mock>;
}

describe("notification send service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});

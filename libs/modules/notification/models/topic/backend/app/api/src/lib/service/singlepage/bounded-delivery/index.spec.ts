import { Service, type ISendBoundedNotification } from ".";

describe("bounded delivery with a project template", () => {
  it("delivers a component-driven template without content under the same budget", async () => {
    const notification = {
      findById: jest
        .fn()
        .mockResolvedValue({ data: { attempts: 1 }, status: "error" }),
      updateDelivery: jest.fn(),
      provider: jest.fn().mockResolvedValue({ status: "sent" }),
    };
    const delivery = new Service(notification as any);
    jest.spyOn(delivery as any, "linkTopic").mockResolvedValue(undefined);
    jest.spyOn(delivery as any, "linkTemplate").mockResolvedValue(undefined);
    const props: ISendBoundedNotification = {
      key: "summary",
      recipientKey: "subject",
      method: "email",
      receiver: "admin@example.invalid",
      topicId: "topic",
      template: {
        id: "template",
        slug: "security-summary-email",
        adminTitle: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        variant: "project-security-email",
        title: "Security",
        content: null,
      },
      data: { counts: { failed: 3 } },
      expiresAt: Date.now() + 60000,
    };
    const result = await delivery.execute(props);
    expect(result.status).toBe("sent");
    expect(notification.updateDelivery).toHaveBeenCalledWith({
      id: result.id,
      data: expect.objectContaining({
        data: { counts: { failed: 3 }, attempts: 2 },
      }),
    });
    expect(notification.provider).toHaveBeenCalledWith(
      expect.objectContaining({
        template: props.template,
        singleMessage: true,
        timeoutMs: 5000,
      }),
    );

    notification.findById.mockResolvedValue({
      data: { attempts: 3 },
      status: "error",
    });
    const exhausted = await delivery.execute(props);
    expect(exhausted.status).toBe("error");
    expect(notification.provider).toHaveBeenCalledTimes(1);
  });
});

it("keeps a failed Topic link retryable and never sends an unlinked notification", async () => {
  const notification = {
    findById: jest.fn().mockResolvedValue(null),
    createDelivery: jest.fn(),
    updateDelivery: jest.fn(),
    provider: jest.fn().mockResolvedValue({ status: "sent" }),
  };
  const delivery = new Service(notification as any);
  const linkTopic = jest
    .spyOn(delivery as any, "linkTopic")
    .mockRejectedValueOnce(new Error("temporary relation failure"))
    .mockResolvedValue(undefined);
  const linkTemplate = jest
    .spyOn(delivery as any, "linkTemplate")
    .mockResolvedValue(undefined);
  const props: ISendBoundedNotification = {
    key: "summary",
    recipientKey: "subject",
    method: "email",
    receiver: "admin@example.invalid",
    topicId: "topic",
    template: {
      id: "template",
      variant: "content-email",
      title: "Security",
      content: "Summary",
    } as any,
    data: {},
    expiresAt: Date.now() + 60000,
  };
  const failed = await delivery.execute(props);
  expect(failed.status).toBe("error");
  expect(notification.provider).not.toHaveBeenCalled();
  expect(linkTemplate).not.toHaveBeenCalled();
  expect(notification.updateDelivery).toHaveBeenCalledWith({
    id: failed.id,
    data: { status: "error" },
  });
  notification.findById.mockResolvedValue({
    status: "error",
    data: { attempts: 1 },
  });
  const retried = await delivery.execute(props);
  expect(retried.id).toBe(failed.id);
  expect(retried.status).toBe("sent");
  expect(linkTopic).toHaveBeenCalledTimes(2);
  expect(notification.provider).toHaveBeenCalledTimes(1);
  notification.findById.mockResolvedValue({
    status: "sent",
    data: { attempts: 2 },
  });
  await delivery.execute(props);
  expect(notification.provider).toHaveBeenCalledTimes(1);
});

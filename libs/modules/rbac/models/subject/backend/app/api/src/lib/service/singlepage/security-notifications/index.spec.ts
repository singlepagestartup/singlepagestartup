import { Service } from ".";
import { SecurityEvents, logger } from "@sps/backend-utils";
import { securityNotificationTemplateSlugs } from "@sps/shared-utils";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  SECURITY_NOTIFICATIONS_ENABLED: true,
}));

jest.mock("@sps/providers-kv", () => ({ Provider: jest.fn() }));

describe("security summary configuration", () => {
  beforeEach(() => jest.spyOn(logger, "warn").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it.each([
    { templates: [] },
    {
      templates: [
        {
          slug: securityNotificationTemplateSlugs.email,
          variant: "default",
          content: "ignored",
        },
      ],
    },
    {
      templates: [
        {
          slug: securityNotificationTemplateSlugs.email,
          variant: "content-email",
          title: "Security",
          content: "",
        },
      ],
    },
  ])(
    "does not queue or send without a usable saved template: %j",
    async ({ templates }) => {
      jest.spyOn(SecurityEvents.prototype, "read").mockResolvedValue({
        start: 1,
        end: 2,
        counts: { "password-limited": 1 },
      });
      const sendBounded = jest.fn();
      const findChannel = jest.fn();
      const worker = new Service(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {
          topic: { find: async () => [{ id: "topic" }], sendBounded },
          template: { find: async () => templates },
        } as any,
        { channel: { find: findChannel } } as any,
      );
      await worker.execute();
      expect(logger.warn).toHaveBeenCalledWith({
        event: "security.summary.configuration-missing",
      });
      expect(findChannel).not.toHaveBeenCalled();
      expect(sendBounded).not.toHaveBeenCalled();
    },
  );

  it("does not create a Topic or templates on an empty installation", async () => {
    jest.spyOn(SecurityEvents.prototype, "read").mockResolvedValue({
      start: 1,
      end: 2,
      counts: { "password-limited": 1 },
    });
    const findTemplates = jest.fn();
    const worker = new Service(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        topic: { find: async () => [] },
        template: { find: findTemplates },
      } as any,
      {} as any,
    );
    await worker.execute();
    expect(findTemplates).not.toHaveBeenCalled();
  });
  it("selects project Host components without requiring saved content", async () => {
    const templates = [
      {
        slug: securityNotificationTemplateSlugs.email,
        variant: "project-security-email",
        title: "Security",
        content: null,
      },
      {
        slug: securityNotificationTemplateSlugs.telegram,
        variant: "project-security-telegram",
        title: "Security",
        content: null,
      },
    ];
    const worker = new Service(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        topic: { find: async () => [{ id: "topic" }] },
        template: { find: async () => templates },
      } as any,
      {} as any,
    );
    const configuration = await (worker as any).configuration();
    expect(configuration.templates.email).toBe(templates[0]);
    expect(configuration.templates.telegram).toBe(templates[1]);
  });
});

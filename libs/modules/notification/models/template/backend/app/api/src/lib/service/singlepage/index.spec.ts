/**
 * BDD Suite: Template render generator failures
 *
 * Given a template render delegates to the host generator
 * When the host generator returns a failed render response
 * Then the service returns null instead of propagating generator output as content
 */
import { Service } from ".";
import { IModel } from "@sps/notification/models/template/sdk/model";

function createTemplate(overrides: Partial<IModel> = {}): IModel {
  const now = new Date();

  return {
    id: "template-id",
    createdAt: now,
    updatedAt: now,
    variant: "generate-telegram-social-module-message-created",
    title: "Template title",
    adminTitle: "Template admin title",
    slug: "template-slug",
    ...overrides,
  } as IModel;
}

function createService(overrides: Record<string, jest.Mock> = {}) {
  return Object.assign(Object.create(Service.prototype), {
    findById: jest.fn().mockResolvedValue(createTemplate()),
    ...overrides,
  }) as Service & Record<string, jest.Mock>;
}

describe("template render service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Generator error JSON is treated as not rendered
   *
   * Given the host generator returns non-OK JSON with an error field
   * When the template render service receives that response
   * Then it returns null
   */
  it("returns null when the host generator returns non-OK error JSON", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      }) as any,
    );
    const service = createService();

    await expect(
      service.render({ id: "template-id", type: "telegram", payload: {} }),
    ).resolves.toBeNull();
  });

  /**
   * BDD Scenario: A JSON content type does not change how the body is read
   *
   * Given the host generator answers with a JSON content type
   * When the template render service fetches the rendered template
   * Then it returns the body unchanged, because it reads the body as text
   */
  it("returns the body unchanged when the host generator declares JSON", async () => {
    const renderedTemplate = JSON.stringify({
      method: "sendMessage",
      props: ["Message text", { parse_mode: "MarkdownV2" }],
    });
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(renderedTemplate, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }) as any,
    );
    const service = createService();

    await expect(
      service.render({ id: "template-id", type: "telegram", payload: {} }),
    ).resolves.toBe(renderedTemplate);
  });

  /**
   * BDD Scenario: Empty generator body is treated as not rendered
   *
   * Given the host generator returns a successful response with an empty body
   * When the template render service receives that response
   * Then it returns null
   */
  it("returns null when the host generator returns an empty body", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("", {
        status: 200,
      }) as any,
    );
    const service = createService();

    await expect(
      service.render({ id: "template-id", type: "telegram", payload: {} }),
    ).resolves.toBeNull();
  });
  it("renders saved content without calling Host and uses current data", async () => {
    const fetch = jest.spyOn(global, "fetch");
    const service = createService({
      findById: jest.fn().mockResolvedValue(
        createTemplate({
          variant: "content-email",
          content: "{{project}}: {{counts.failed}}",
        }),
      ),
    });
    const content = await service.render({
      id: "template-id",
      type: "email",
      payload: { project: "<project>", counts: { failed: 7 } },
    });
    expect(content).toBe("<p>&lt;project&gt;: 7</p>");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a mismatched delivery channel for a saved template", async () => {
    const service = createService({
      findById: jest
        .fn()
        .mockResolvedValue(
          createTemplate({ variant: "content-email", content: "Text" }),
        ),
    });
    await expect(
      service.render({ id: "template-id", type: "telegram" }),
    ).rejects.toThrow("does not match delivery channel");
  });
});

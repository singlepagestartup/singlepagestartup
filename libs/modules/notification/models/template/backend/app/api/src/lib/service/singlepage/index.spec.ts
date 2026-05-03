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
});

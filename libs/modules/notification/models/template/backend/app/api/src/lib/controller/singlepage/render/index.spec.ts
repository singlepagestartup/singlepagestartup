/**
 * BDD Suite: Template render controller nullable render result
 *
 * Given template render can fail in the host generator after the template is found
 * When the render controller receives a nullable service render result
 * Then it returns null data while keeping missing templates as not-found errors
 */
import { Handler } from ".";

function createContext(props: {
  uuid: string;
  body?: Record<string, unknown>;
}) {
  return {
    req: {
      param: jest.fn().mockReturnValue(props.uuid),
      parseBody: jest.fn().mockResolvedValue(props.body ?? { data: "{}" }),
    },
    json: jest.fn((body) => {
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }),
  };
}

describe("template render controller", () => {
  /**
   * BDD Scenario: Generator failure returns nullable data
   *
   * Given the template exists and the render service returns null
   * When the render endpoint is called
   * Then the controller responds with status 200 and data null
   */
  it("returns data null when the render service reports not rendered", async () => {
    const service = {
      findById: jest.fn().mockResolvedValue({
        id: "template-id",
        variant: "generate-telegram-social-module-message-created",
      }),
      render: jest.fn().mockResolvedValue(null),
    };
    const handler = new Handler(service as any);
    const context = createContext({ uuid: "template-id" });

    const response = await handler.execute(context as any, undefined);

    await expect(response.json()).resolves.toEqual({ data: null });
    expect(response.status).toBe(200);
    expect(service.render).toHaveBeenCalledWith({
      id: "template-id",
      type: "telegram",
      payload: {},
    });
    expect(context.json).toHaveBeenCalledWith({ data: null });
  });

  /**
   * BDD Scenario: Missing template remains a not-found error
   *
   * Given the requested template ID does not exist
   * When the render endpoint is called
   * Then the controller rejects with a not-found HTTP error
   */
  it("keeps missing template as a real not-found error", async () => {
    const service = {
      findById: jest.fn().mockResolvedValue(null),
      render: jest.fn(),
    };
    const handler = new Handler(service as any);
    const context = createContext({ uuid: "missing-template-id" });

    await expect(
      handler.execute(context as any, undefined),
    ).rejects.toMatchObject({
      status: 404,
    });
    expect(service.render).not.toHaveBeenCalled();
  });
});

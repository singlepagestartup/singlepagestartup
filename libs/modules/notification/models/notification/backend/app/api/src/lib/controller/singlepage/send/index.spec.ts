/**
 * BDD Suite: Notification send controller no-op response
 *
 * Given notification send can complete without a delivered notification
 * When the send controller receives a nullable service result
 * Then it returns a successful JSON response with null data
 */
import { Handler } from ".";

function createContext(props: { uuid: string }) {
  return {
    req: {
      param: jest.fn().mockReturnValue(props.uuid),
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

describe("notification send controller", () => {
  /**
   * BDD Scenario: Missing notification returns a successful no-op response
   *
   * Given the send service returns null for a missing notification
   * When the send endpoint is called
   * Then the controller responds with status 200 and data null
   */
  it("returns data null when the service skips notification delivery", async () => {
    const service = {
      send: jest.fn().mockResolvedValue(null),
      deleteExpired: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new Handler(service as any);
    const context = createContext({ uuid: "missing-id" });

    const response = await handler.execute(context as any, undefined);

    await expect(response.json()).resolves.toEqual({ data: null });
    expect(response.status).toBe(200);
    expect(service.send).toHaveBeenCalledWith({ id: "missing-id" });
    expect(context.json).toHaveBeenCalledWith({ data: null });
  });
});

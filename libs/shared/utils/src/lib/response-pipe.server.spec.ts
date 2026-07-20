/**
 * @jest-environment node
 *
 * BDD Suite: server responsePipe correlation metadata.
 *
 * Given: a server SDK receives a structured non-OK API response.
 * When: responsePipe converts it to an HTTPException.
 * Then: the downstream request identifier remains available without changing the success contract.
 */

import { util as responsePipe } from "./response-pipe";

describe("Given: a server API error with a request identifier", () => {
  /**
   * BDD Scenario: server correlation metadata.
   *
   * Given: the API returns requestId in its JSON error body.
   * When: a server-side SDK normalizes the response.
   * Then: both the serialized message and exception cause retain requestId.
   */
  it("When: the server exception is created Then: preserves requestId", async () => {
    const response = new Response(
      JSON.stringify({
        requestId: "request-server-123",
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    try {
      await responsePipe({ res: response });
      throw new Error("Expected responsePipe to throw");
    } catch (error) {
      expect(error).toMatchObject({
        status: 500,
        cause: expect.objectContaining({
          requestId: "request-server-123",
        }),
      });
      expect(JSON.parse((error as Error).message)).toEqual(
        expect.objectContaining({
          requestId: "request-server-123",
        }),
      );
    }
  });
});

/**
 * BDD Suite: MCP request body limit
 *
 * Given an HTTP request body and a byte limit
 * When the MCP server reads the body
 * Then a body within the limit comes back whole, and a declared or streamed body above it is refused and drained without being kept
 */
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import { readRequestBody, RequestBodyTooLargeError } from "./request-body";

function createRequest(chunks: string[], headers: Record<string, string> = {}) {
  return Object.assign(
    Readable.from(chunks.map((chunk) => Buffer.from(chunk))),
    { headers },
  );
}

describe("readRequestBody", () => {
  /**
   * BDD Scenario: A body within the limit
   *
   * Given a JSON body split over two chunks and a limit it fits
   * When the body is read
   * Then the whole body is returned
   */
  it("returns a body within the limit", async () => {
    const req = createRequest(['{"jsonrpc":', '"2.0"}']);

    await expect(
      readRequestBody(req as unknown as IncomingMessage, 32),
    ).resolves.toBe('{"jsonrpc":"2.0"}');
  });

  /**
   * BDD Scenario: A body of exactly the limit
   *
   * Given a body whose length equals the limit
   * When the body is read
   * Then it is accepted
   */
  it("accepts a body of exactly the limit", async () => {
    const req = createRequest(["0123456789abcdef"]);

    await expect(
      readRequestBody(req as unknown as IncomingMessage, 16),
    ).resolves.toBe("0123456789abcdef");
  });

  /**
   * BDD Scenario: A declared length above the limit
   *
   * Given a Content-Length larger than the limit
   * When the body is read
   * Then it is refused and the stream is still drained
   */
  it("refuses a declared length above the limit and drains the stream", async () => {
    const req = createRequest(["small"], { "content-length": "1024" });

    await expect(
      readRequestBody(req as unknown as IncomingMessage, 16),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
    await new Promise((resolve) => setImmediate(resolve));

    expect(req.readableEnded).toBe(true);
  });

  /**
   * BDD Scenario: A streamed body grows past the limit
   *
   * Given a body without Content-Length that grows past the limit
   * When the body is read
   * Then it is refused with the limit in the message
   */
  it("refuses a streamed body once it passes the limit", async () => {
    const req = createRequest(["0123456789", "0123456789"]);

    await expect(
      readRequestBody(req as unknown as IncomingMessage, 16),
    ).rejects.toThrow("Request body is larger than 16 bytes");
  });
});

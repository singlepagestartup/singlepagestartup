/**
 * BDD Suite: MCP content-management response envelopes
 * Given MCP tool callers parse text content as JSON
 * When content-management operations succeed or fail
 * Then responses use stable ok/error envelope shapes
 */

import { errorResponse, okEnvelope, okResponse } from "./response";

describe("MCP content-management response envelopes", () => {
  /**
   * BDD Scenario: Successful payloads include type and data
   * Given a content-management operation succeeds
   * When the response helper wraps the payload
   * Then the envelope includes ok, type, data, and optional metadata
   */
  it("wraps successful payloads in a stable JSON envelope", () => {
    expect(
      okEnvelope("content-entity-list", [{ key: "blog.widget" }], {
        limit: 25,
      }),
    ).toEqual({
      ok: true,
      type: "content-entity-list",
      data: [{ key: "blog.widget" }],
      meta: { limit: 25 },
    });
  });

  /**
   * BDD Scenario: MCP text responses contain JSON envelopes
   * Given a content-management tool returns through MCP text content
   * When success and error helpers format responses
   * Then the JSON text can be parsed by Codex
   */
  it("formats MCP text content as parseable JSON", () => {
    const ok = okResponse("content-record-find", [{ id: "record-1" }]);
    const failure = errorResponse("validation", "Bad input", {
      field: "entity",
    });

    expect(JSON.parse(ok.content[0].text)).toEqual({
      ok: true,
      type: "content-record-find",
      data: [{ id: "record-1" }],
    });
    expect(JSON.parse(failure.content[0].text)).toEqual({
      ok: false,
      error: {
        kind: "validation",
        message: "Bad input",
        details: { field: "entity" },
      },
    });
  });
});

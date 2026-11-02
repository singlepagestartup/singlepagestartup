/**
 * BDD Suite: Telegram generator response typing.
 *
 * Given: the telegram generator renders notification payloads for the API.
 * When: it answers any caller.
 * Then: it declares the type it actually produced and reflects nothing beyond the rendered variant.
 */

import { NextRequest } from "next/server";
import pako from "pako";
import QueryString from "qs";
import { GET } from "./route";

const CALLER_MARKER = "<img src=x onerror=CALLER_MARKER>";

function encodePayload(payload: unknown) {
  return Buffer.from(pako.deflate(JSON.stringify(payload))).toString("base64");
}

function createRequest(params: Record<string, unknown>) {
  return new NextRequest(
    "http://localhost:3000/api/telegram-generator?" +
      QueryString.stringify(params, { encodeValuesOnly: true }),
  );
}

describe("telegram generator route", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   *
   * Given: a request names a shipped telegram variant.
   * When: the generator answers.
   * Then: the response declares a JSON content type and forbids content sniffing.
   */
  it("declares JSON and forbids sniffing when a known variant is rendered", async () => {
    const response = await GET(
      createRequest({
        variant: "generate-telegram-social-module-message-created",
        data: encodePayload({
          socialModule: { message: { description: "Hello" } },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.parse(await response.text())).toEqual({
      method: "sendMessage",
      props: ["Hello", { parse_mode: "MarkdownV2" }],
    });
  });

  /**
   * BDD Scenario
   *
   * Given: a shipped variant returns text the caller supplied.
   * When: the generator answers.
   * Then: the text is carried as a JSON string value under a type no browser parses as a document.
   */
  it("carries caller text as a JSON value rather than as a document", async () => {
    const response = await GET(
      createRequest({
        variant: "generate-telegram-social-module-message-created",
        data: encodePayload({
          socialModule: { message: { description: CALLER_MARKER } },
        }),
      }),
    );

    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(JSON.parse(body).props[0]).toBe(CALLER_MARKER);
  });

  /**
   * BDD Scenario
   *
   * Given: a request names a variant that is not in the variant table.
   * When: the generator answers.
   * Then: the body is an empty object and carries none of the caller's data.
   */
  it("echoes nothing from the caller when the variant is unknown", async () => {
    const response = await GET(
      createRequest({
        variant: "no-such-variant",
        data: encodePayload({ marker: CALLER_MARKER }),
      }),
    );

    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(JSON.parse(body)).toEqual({});
    expect(body).not.toContain("CALLER_MARKER");
  });

  /**
   * BDD Scenario
   *
   * Given: a request names an inherited object member instead of a variant.
   * When: the generator answers.
   * Then: it is treated as an unknown variant rather than resolved.
   */
  it.each(["constructor", "toString", "valueOf", "hasOwnProperty"])(
    "treats the inherited member %s as an unknown variant",
    async (variant) => {
      const response = await GET(
        createRequest({
          variant,
          data: encodePayload({ marker: CALLER_MARKER }),
        }),
      );

      const body = await response.text();

      expect(JSON.parse(body)).toEqual({});
      expect(body).not.toContain("CALLER_MARKER");
    },
  );

  /**
   * BDD Scenario
   *
   * Given: a request carries data the generator cannot decode.
   * When: the generator answers.
   * Then: it returns a fixed error without internal detail.
   */
  it("returns a fixed error without internals when decoding fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(
      createRequest({
        variant: "generate-telegram-social-module-message-created",
        data: "not-a-deflated-payload",
      }),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not Found" });
  });
});

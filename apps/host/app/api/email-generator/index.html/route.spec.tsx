/**
 * BDD Suite: Email generator response typing.
 *
 * Given: the email generator renders the document that is delivered as an email body.
 * When: it answers a caller.
 * Then: it keeps its HTML content type and resolves only variants the table actually owns.
 */

import { NextRequest } from "next/server";
import pako from "pako";
import QueryString from "qs";
import { Fragment } from "react";
import { Component } from "./component";
import { variants } from "./component/variants";
import { GET } from "./route";

// `render` reaches for a dynamic import that jest cannot run without ESM VM
// modules, and the markup it produces is not what this suite is about.
jest.mock("@react-email/components", () => ({
  ...jest.requireActual("@react-email/components"),
  render: jest.fn(async () => '<html lang="en"></html>'),
}));

function encodePayload(payload: unknown) {
  return Buffer.from(pako.deflate(JSON.stringify(payload))).toString("base64");
}

function createRequest(params: Record<string, unknown>) {
  return new NextRequest(
    "http://localhost:3000/api/email-generator/index.html?" +
      QueryString.stringify(params, { encodeValuesOnly: true }),
  );
}

describe("email generator route", () => {
  /**
   * BDD Scenario
   *
   * Given: the email generator renders an email body for delivery.
   * When: it answers a request naming a shipped variant.
   * Then: it keeps the HTML content type and forbids content sniffing.
   */
  it("keeps the HTML content type and forbids sniffing for a shipped variant", async () => {
    const response = await GET(
      createRequest({
        variant: "generate-email-ecommerce-order-status-changed-default",
        data: encodePayload({}),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  /**
   * BDD Scenario
   *
   * Given: a variant name matching an inherited object member instead of the variant table.
   * When: the email generator dispatches it.
   * Then: it is treated as an unknown variant rather than resolved.
   */
  it.each(["constructor", "toString", "valueOf", "hasOwnProperty"])(
    "treats the inherited member %s as an unknown variant",
    (variant) => {
      const element = Component({ variant } as any);

      expect(element.type).toBe(Fragment);
    },
  );

  /**
   * BDD Scenario
   *
   * Given: a variant name the table actually owns.
   * When: the email generator dispatches it.
   * Then: the owned variant component is the one that renders.
   */
  it("renders the owned component for a shipped variant", () => {
    const element = Component({
      variant: "generate-email-ecommerce-order-status-changed-default",
    } as any);

    expect(element.type).toBe(
      variants["generate-email-ecommerce-order-status-changed-default"],
    );
  });
});

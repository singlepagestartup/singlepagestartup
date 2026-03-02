import { util as parseJwt } from "./parse-jwt";

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

describe("parse-jwt", () => {
  beforeAll(() => {
    Object.defineProperty(global, "window", {
      value: {
        atob: (value: string) =>
          Buffer.from(value, "base64").toString("binary"),
      },
      configurable: true,
    });
  });

  afterAll(() => {
    delete (global as any).window;
  });

  it("decodes jwt payload from base64url token", () => {
    const payload = {
      id: "subject-id",
      roles: ["admin"],
    };

    const token = [
      encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
      encodeBase64Url(JSON.stringify(payload)),
      "signature",
    ].join(".");

    expect(parseJwt(token)).toEqual(payload);
  });
});

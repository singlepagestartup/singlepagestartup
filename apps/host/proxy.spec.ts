/**
 * BDD Suite: locale redirects preserve the browser origin.
 *
 * Given: requests arrive directly or through a proxy using an internal port.
 * When: locale proxy adds the default language prefix.
 * Then: redirects retain the public host, port, path and query parameters.
 */
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    defaultLanguage: { code: "ru" },
    languages: [{ code: "ru" }, { code: "en" }],
  },
}));

describe("Locale redirects preserve the browser origin", () => {
  it.each(["127.0.0.1:3000", "localhost:3000"])(
    "keeps %s when Next normalizes nextUrl to localhost",
    async (host) => {
      const request = new NextRequest("http://localhost:3000/?check=origin", {
        headers: { host },
      });
      const response = await proxy(request);
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(
        `http://${host}/ru?check=origin`,
      );
    },
  );

  it.each([
    [
      "singlepagestartup.com",
      "https://singlepagestartup.com/ru/account/profile?view=list",
    ],
    [
      "singlepagestartup.com:443",
      "https://singlepagestartup.com/ru/account/profile?view=list",
    ],
    [
      "singlepagestartup.com:8443",
      "https://singlepagestartup.com:8443/ru/account/profile?view=list",
    ],
  ])("uses public authority %s behind a proxy", async (host, location) => {
    const request = new NextRequest(
      "https://localhost:3000/account/profile?view=list",
      { headers: { host } },
    );

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe(location);
  });

  it("keeps the request origin when no Host header is available", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3000/?check=origin"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/ru?check=origin",
    );
  });

  it("does not redirect an already localized route", async () => {
    const response = await proxy(
      new NextRequest("http://127.0.0.1:3000/ru/account/profile"),
    );
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

it.each([
  [
    "/en/ai-chat/reset-password?code=old",
    "/en/rbac/subject/authentication/email-and-password/reset-password?code=old",
  ],
  [
    "/ai-chat/sign-in",
    "/ru/rbac/subject/authentication/email-and-password?returnTo=%2Fai-chat%2Fprojects",
  ],
])("redirects the exact old form URL %s", async (oldPath, newPath) => {
  const response = await proxy(
    new NextRequest("http://localhost:3000" + oldPath),
  );
  expect(response.status).toBe(308);
  expect(response.headers.get("location")).toBe(
    "http://localhost:3000" + newPath,
  );
});

import { NextRequest } from "next/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { POST } from "./route";

function createRequest(
  body: Record<string, unknown>,
  secret = RBAC_SECRET_KEY,
) {
  return new NextRequest("http://localhost:3000/api/telegram-generator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RBAC-SECRET-KEY": secret ?? "",
    },
    body: JSON.stringify({
      template: { title: "Security summary", content: null },
      ...body,
    }),
  });
}

describe("Host Telegram rendering", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("renders saved content as one escaped message", async () => {
    const response = await POST(
      createRequest({
        variant: "content-telegram",
        template: { title: "Security", content: "<b>Project</b> & 7" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      method: "sendMessage",
      props: ["&lt;b&gt;Project&lt;/b&gt; &amp; 7", { parse_mode: "HTML" }],
    });
  });

  it("preserves the existing social-message component contract", async () => {
    const response = await POST(
      createRequest({
        variant: "generate-telegram-social-module-message-created",
        data: { socialModule: { message: { description: "Hello" } } },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      method: "sendMessage",
      props: ["Hello", { parse_mode: "MarkdownV2" }],
    });
  });

  it.each(["", "x".repeat(4001), "&".repeat(801)])(
    "rejects empty or oversized rendered content",
    async (content) => {
      const response = await POST(
        createRequest({
          variant: "content-telegram",
          template: { title: "Security", content },
        }),
      );
      expect(response.status).toBe(404);
    },
  );

  it.each(["constructor", "toString", "no-such-variant"])(
    "rejects unknown variant %s",
    async (variant) => {
      const response = await POST(
        createRequest({ variant, data: { marker: "private marker" } }),
      );
      expect(response.status).toBe(404);
      const body = await response.text();
      expect(body).not.toContain("private marker");
    },
  );

  it("rejects unauthenticated rendering before parsing the body", async () => {
    const request = createRequest(
      { variant: "content-telegram" },
      "wrong-secret",
    );
    const json = jest.spyOn(request, "json");
    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
  });

  it("rejects malformed input without returning internal details", async () => {
    const response = await POST(
      createRequest({ variant: "content-telegram", template: { content: 42 } }),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Not Found error. Template unavailable",
    });
  });
});

import { NextRequest } from "next/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { POST } from "./route";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { ReactNode } from "react";

// React Email's wrapper dynamically imports react-dom/server, which requires
// Jest VM modules. Use the same React server renderer through a static import
// here; the full React Email wrapper is also exercised by the live HTTP check.
// The actual registry, email components and Tailwind conversion stay real.
jest.mock("react-email", () => ({
  ...jest.requireActual("react-email"),
  render: (element: ReactNode) =>
    new Promise<string>((resolve, reject) => {
      const output = new PassThrough();
      let html = "";
      output.on("data", (chunk) => {
        html += chunk.toString();
      });
      output.on("end", () => resolve(html));
      output.on("error", reject);
      const stream = renderToPipeableStream(element, {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      });
    }),
}));

function createRequest(
  body: Record<string, unknown>,
  secret = RBAC_SECRET_KEY,
) {
  return new NextRequest(
    "http://localhost:3000/api/email-generator/index.html",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RBAC-SECRET-KEY": secret ?? "",
      },
      body: JSON.stringify({
        template: { title: "Security summary", content: null },
        ...body,
      }),
    },
  );
}

// Verify the actual email component tree, escaping and compiled styles.
describe("Host email rendering", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("renders editable copy in the Host layout and escapes it exactly once", async () => {
    const response = await POST(
      createRequest({
        variant: "content-email",
        language: "ru",
        template: {
          title: "<Security> & project",
          content:
            "<script>alert(1)</script> & test\nNext line\n\nSecond paragraph",
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const html = await response.text();
    expect(html).toContain('lang="ru"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;Security&gt; &amp; project");
    expect(html).not.toContain("&amp;lt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Second paragraph");
    expect(html).toMatch(/max-width:\s*600px/);
    expect(html).toMatch(/font-size:\s*15px/);
  });

  it("keeps existing component payloads working without saved content", async () => {
    const response = await POST(
      createRequest({
        variant: "generate-email-agent-result-admin",
        data: { title: "Existing agent result" },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Existing agent result");
  });

  it("puts the one-time code in the fragment of the reset form link", async () => {
    const response = await POST(
      createRequest({
        variant: "reset-password",
        data: { code: "example-code" },
      }),
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(
      "/rbac/subject/authentication/email-and-password/reset-password#code=example-code",
    );
    expect(html).not.toContain("?code=");
  });

  it("fails empty default content before delivery", async () => {
    const response = await POST(createRequest({ variant: "content-email" }));
    expect(response.status).toBe(404);
  });

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
    const request = createRequest({ variant: "content-email" }, "wrong-secret");
    const json = jest.spyOn(request, "json");
    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
  });

  it("rejects malformed input without returning internal details", async () => {
    const response = await POST(
      createRequest({ variant: "content-email", template: { content: 42 } }),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Not Found error. Template unavailable",
    });
  });
});

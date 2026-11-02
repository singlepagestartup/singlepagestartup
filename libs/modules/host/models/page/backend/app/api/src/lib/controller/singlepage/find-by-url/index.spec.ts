import { Hono } from "hono";
import { Handler } from "./index";
import type { Service } from "../../../service";
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    defaultLanguage: { code: "ru" },
    languages: [{ code: "ru" }, { code: "en" }],
  },
}));
it.each(["/about", "/ru/about", "/en/about"])(
  "resolves %s without a language argument or language-specific Page",
  async (url) => {
    const findByUrl = jest.fn(async () => ({
      id: "shared-page",
      url: "/about",
    }));
    const handler = new Handler({ findByUrl } as unknown as Service);
    const app = new Hono();
    app.get("/", (c) => handler.execute(c, undefined));
    const response = await app.request("/?url=" + encodeURIComponent(url));
    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe("shared-page");
    expect(findByUrl).toHaveBeenCalledWith({
      url: "/about",
      params: undefined,
    });
  },
);

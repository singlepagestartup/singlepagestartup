import { Hono } from "hono";
import { Middleware } from "./index";

it("keeps JSON API data out of indexing without blocking public media", async () => {
  const app = new Hono().use(new Middleware().init());
  app.get("/data", (c) => c.json({ data: [] }));
  app.get("/image", (c) =>
    c.body("image", 200, { "Content-Type": "image/png" }),
  );
  expect((await app.request("/data")).headers.get("X-Robots-Tag")).toBe(
    "noindex",
  );
  expect((await app.request("/image")).headers.get("X-Robots-Tag")).toBeNull();
});

/**
 * Given the relocated HTML preview and its relative resources,
 * opening the default or directory URL must load the complete preview.
 */
import { expect, test } from "bun:test";
import { createDesignSystemServer } from "./dev";

test("the default HTML preview resolves styles, runtime, local script and image", async () => {
  const server = await createDesignSystemServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing preview server address");
    const origin = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${origin}/?preview=1`);
    expect(response.status).toBe(200);
    expect(new URL(response.url).pathname).toBe(
      "/modules/website-builder/widget/singlepage/content-default/index.html",
    );
    expect(new URL(response.url).search).toBe("?preview=1");
    const html = await response.text();
    const resources = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(
      ([, value]) => new URL(value, response.url),
    );
    expect(resources.map((url) => url.pathname)).toEqual([
      "/runtime/styles.css",
      "/modules/website-builder/widget/singlepage/content-default/assets/content-default-media.png",
      "/runtime/runtime.js",
      "/modules/website-builder/widget/singlepage/content-default/script.js",
    ]);
    for (const url of resources) {
      const resource = await fetch(url);
      expect(resource.status).toBe(200);
      const bytes = await resource.arrayBuffer();
      expect(bytes.byteLength).toBeGreaterThan(0);
      if (url.pathname === "/runtime/styles.css") {
        const styles = new TextDecoder().decode(bytes);
        expect(styles).not.toContain('@import "tailwindcss"');
        expect(styles).not.toContain("@apply");
        expect(styles).not.toContain("@source");
        expect(styles).toContain(".max-w-7xl");
      }
    }
    for (const suffix of ["", "/"]) {
      const directory = await fetch(
        `${origin}/modules/website-builder/widget/singlepage/content-default${suffix}`,
      );
      expect(directory.status).toBe(200);
      expect(new URL(directory.url).pathname).toBe(
        new URL(response.url).pathname,
      );
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

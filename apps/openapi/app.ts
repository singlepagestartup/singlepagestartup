import { readFile } from "node:fs/promises";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const app = new Hono().basePath("/");

const specPath = new URL("./openapi.yaml", import.meta.url);
const bundledSpecPath = new URL(
  "./public/openapi-bundled.yaml",
  import.meta.url,
);
const docsPath = new URL("./public/index.html", import.meta.url);

async function serveFile(
  path: URL,
  contentType: string,
  missingMessage: string,
) {
  try {
    const file = await readFile(path, "utf8");
    return new Response(file, {
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("OpenAPI app: failed to read", path, error);
    return new Response(missingMessage, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

app.use(
  cors({
    origin: (origin) => {
      if (!origin) {
        return null;
      }

      return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "X-CSRF-Token",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Set-Cookie",
      "Cache-Control",
      "X-RBAC-SECRET-KEY",
    ],
    credentials: true,
    maxAge: 86400,
  }),
);

app.get("/", () => {
  return serveFile(
    docsPath,
    "text/html; charset=utf-8",
    "Swagger UI not found. Make sure swagger.html exists.",
  );
});

app.get("/openapi.yaml", () =>
  serveFile(specPath, "application/yaml; charset=utf-8", "Spec not found"),
);

app.get("/openapi-bundled.yaml", () =>
  serveFile(
    bundledSpecPath,
    "application/yaml; charset=utf-8",
    "Bundled spec not found",
  ),
);

app.get("/health", (c) => c.text("ok", 200 as ContentfulStatusCode));

app.options("*", (c) => c.text("OK", 204 as ContentfulStatusCode));

app.all("*", () =>
  serveFile(
    docsPath,
    "text/html; charset=utf-8",
    "Swagger UI not found. Make sure swagger.html exists.",
  ),
);

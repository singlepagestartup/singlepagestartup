import type { Hono, Env } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { createConsistencyRuntime } from "@sps/shared-backend-api";
import { websocketManager, verifyJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET, expandLegacyTopics } from "@sps/shared-utils";
import { v4 as uuidv4 } from "uuid";
import { Middleware as RevalidationMiddleware } from "../revalidation";
import { Middleware as OperatorSecretMiddleware } from "../operator-secret";

export interface IMiddlewareOptions {
  revalidation: Pick<RevalidationMiddleware, "revalidateTags">;
  runtime?: ReturnType<typeof createConsistencyRuntime>;
}

export class Middleware {
  readonly runtime: ReturnType<typeof createConsistencyRuntime>;

  constructor(options: IMiddlewareOptions) {
    this.runtime =
      options.runtime ||
      createConsistencyRuntime({
        verifyAuthorization: async (authorization) => {
          if (!authorization) return;
          if (!RBAC_JWT_SECRET)
            throw new Error("JWT verification is not configured");
          await verifyJwt(
            authorization.replace(/^Bearer\s+/i, ""),
            RBAC_JWT_SECRET,
          );
        },
        invalidateTags: (tags) =>
          options.revalidation.revalidateTags(tags, true),
        publishLegacy: async (topics) => {
          const now = Date.now();
          websocketManager.broadcastMessage({
            slug: "revalidation",
            payload: "/api",
            topics: expandLegacyTopics(topics),
            createdAt: new Date(now).toISOString(),
            expiresAt: new Date(now + 60000).toISOString(),
          });
        },
      });
  }

  init() {
    return this.runtime.middleware();
  }

  async start() {
    await this.runtime.store.assertCoverage();
    return this.runtime.start();
  }

  registerRoutes<Environment extends Env>(app: Hono<Environment>) {
    app.post("/api/consistency/check", async (c) => {
      const body = await c.req.json();
      if (
        !Array.isArray(body.refs) ||
        body.refs.length > 100 ||
        !body.refs.every(
          (ref: unknown) => typeof ref === "string" && ref.length < 128,
        )
      )
        return c.json({ error: "Invalid refs" }, 400);
      return c.json({
        data: await this.runtime.check(
          body.refs,
          c.req.header("Authorization") || "",
        ),
      });
    });
    app.get(
      "/api/consistency/status",
      new OperatorSecretMiddleware().init(),
      async (c) =>
        c.json({
          data: {
            ...(await this.runtime.store.diagnostics()),
            ...this.runtime.metrics(),
          },
        }),
    );
    const { upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();
    app.get(
      "/ws/revalidation",
      upgradeWebSocket((c) => {
        const clientId = c.req.header("X-Client-ID") || uuidv4();
        let socket:
          | { send: (message: string) => void; close: () => void }
          | undefined;
        return {
          onOpen: (_event, ws) => {
            websocketManager.addClient(clientId, ws);
            socket = {
              send: (message) => ws.send(message),
              close: () => ws.close(),
            };
          },
          onMessage: (event, ws) => {
            if (!socket) return;
            void this.runtime
              .receive(socket, String(event.data))
              .catch(() => ws.close(1008, "Invalid subscription"));
          },
          onClose: () => {
            websocketManager.removeClient(clientId);
            if (socket) this.runtime.disconnect(socket);
          },
        };
      }),
    );
  }
}

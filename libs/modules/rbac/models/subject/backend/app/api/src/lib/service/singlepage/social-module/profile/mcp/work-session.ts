import { createHash } from "node:crypto";
import type { IOpenRouterTool } from "@sps/shared-third-parties";
import type { IProfileMcpCatalogSession } from "./catalog";

export class WorkMcpSession {
  readonly tools: IOpenRouterTool[] = [];
  private readonly targets = new Map<
    string,
    { serverId: string; name: string }
  >();

  constructor(
    private readonly session: IProfileMcpCatalogSession,
    private readonly authorize: (serverId: string) => Promise<void>,
    readonly authorityKey?: string,
  ) {
    for (const server of session.catalog.connected) {
      for (const tool of server.tools) {
        const digest = createHash("sha256")
          .update(JSON.stringify([server.id, tool.name]))
          .digest("hex")
          .slice(0, 16);
        const prefix = (server.id + "_" + tool.name)
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 47);
        const name = prefix + "_" + digest;
        if (this.targets.has(name)) {
          throw new Error("Configuration error. Duplicate profile MCP tool");
        }
        this.targets.set(name, { serverId: server.id, name: tool.name });
        this.tools.push({
          type: "function",
          function: {
            name,
            description: [
              server.title,
              tool.description || tool.title || tool.name,
            ].join(" — "),
            parameters: tool.inputSchema,
          },
        });
      }
    }
  }

  describe(name: string) {
    return this.targets.get(name);
  }

  async call(name: string, args: Record<string, unknown>) {
    const target = this.targets.get(name);
    if (!target) {
      throw new Error("Validation error. Unknown profile MCP tool");
    }
    await this.authorize(target.serverId);
    return this.session.callTool({ ...target, arguments: args });
  }

  close() {
    return this.session.close();
  }
}

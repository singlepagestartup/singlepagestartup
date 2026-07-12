import {
  resolveMcpServerConfiguration,
  supportedMcpServerDescriptors,
  type IMcpServerDescriptor,
} from "@sps/social/models/profile/sdk/model";
import {
  PROJECT_MCP_SERVER_ID,
  type IMcpToolDefinition,
  type INormalizedMcpToolResult,
  type IProjectMcpSession,
  ProjectMcpClientService,
} from "./project-mcp-client";

export interface IProfileMcpServerCatalogItem extends IMcpServerDescriptor {
  tools: IMcpToolDefinition[];
}

export interface IProfileMcpCatalog {
  supported: IMcpServerDescriptor[];
  connected: IProfileMcpServerCatalogItem[];
  stale: string[];
}

export interface IProfileMcpCatalogSession {
  readonly catalog: IProfileMcpCatalog;
  callTool(props: {
    serverId: string;
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<INormalizedMcpToolResult>;
  close(): Promise<void>;
}

export class ProfileMcpCatalogService {
  private readonly projectMcpClient: ProjectMcpClientService;

  constructor(projectMcpClient = new ProjectMcpClientService()) {
    this.projectMcpClient = projectMcpClient;
  }

  async open(props: {
    configuredServerIds: readonly string[];
    employeeSpsJwt: string;
  }): Promise<IProfileMcpCatalogSession> {
    const resolved = resolveMcpServerConfiguration(props.configuredServerIds);
    const sessions = new Map<string, IProjectMcpSession>();
    const connected: IProfileMcpServerCatalogItem[] = [];

    try {
      for (const descriptor of resolved.supported) {
        if (descriptor.id !== PROJECT_MCP_SERVER_ID) {
          continue;
        }

        const session = await this.projectMcpClient.openSession({
          employeeSpsJwt: props.employeeSpsJwt,
        });
        sessions.set(descriptor.id, session);
        const tools = await session.listTools();
        connected.push({
          ...descriptor,
          tools,
        });
      }

      return new ProfileMcpCatalogSession({
        catalog: {
          supported: supportedMcpServerDescriptors,
          connected,
          stale: resolved.stale,
        },
        sessions,
      });
    } catch (error) {
      await Promise.allSettled(
        [...sessions.values()].map((session) => session.close()),
      );
      throw error;
    }
  }
}

class ProfileMcpCatalogSession implements IProfileMcpCatalogSession {
  readonly catalog: IProfileMcpCatalog;
  private readonly sessions: Map<string, IProjectMcpSession>;
  private closed = false;

  constructor(props: {
    catalog: IProfileMcpCatalog;
    sessions: Map<string, IProjectMcpSession>;
  }) {
    this.catalog = props.catalog;
    this.sessions = props.sessions;
  }

  async callTool(props: {
    serverId: string;
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<INormalizedMcpToolResult> {
    if (this.closed) {
      throw new Error("MCP catalog session is closed");
    }

    const session = this.sessions.get(props.serverId);

    if (!session) {
      throw new Error(
        `Validation error. MCP server ${props.serverId} is not connected for this profile`,
      );
    }

    return session.callTool({
      name: props.name,
      arguments: props.arguments,
    });
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    const results = await Promise.allSettled(
      [...this.sessions.values()].map((session) => session.close()),
    );
    const rejection = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (rejection) {
      throw rejection.reason;
    }
  }
}

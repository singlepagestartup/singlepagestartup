import {
  supportedMcpServerDescriptors,
  type IMcpServerDescriptor,
} from "@sps/social/models/profile/sdk/model";
import { Service as SinglePageStartupMcpClientService } from "../../../../startup/social-module/profile/mcp/singlepagestartup-client";
import {
  SINGLEPAGESTARTUP_MCP_SERVER_ID,
  type IMcpToolDefinition,
  type IMcpToolCallProps,
  type INormalizedMcpToolResult,
  type ISinglePageStartupMcpSession,
} from "./singlepagestartup-client";

interface IServerDescriptor extends Omit<IMcpServerDescriptor, "id"> {
  id: string;
}

type TMcpSession = Pick<
  ISinglePageStartupMcpSession,
  "listTools" | "callTool" | "close"
>;

export interface IProfileMcpConnector {
  descriptor: IServerDescriptor;
  openSession(identity: { subjectId: string }): Promise<TMcpSession>;
}

export interface IProfileMcpServerCatalogItem extends IServerDescriptor {
  tools: IMcpToolDefinition[];
}

export interface IProfileMcpCatalog {
  supported: IServerDescriptor[];
  connected: IProfileMcpServerCatalogItem[];
  stale: string[];
}

export interface IProfileMcpCatalogSession {
  readonly catalog: IProfileMcpCatalog;
  callTool(
    props: IMcpToolCallProps & { serverId: string },
  ): Promise<INormalizedMcpToolResult>;
  close(): Promise<void>;
}

export interface IProfileMcpCatalogOpenProps {
  configuredServerIds: readonly string[];
  subjectId?: string;
  rbacSubjectAuthenticationJwt: string;
}

export class McpCatalogUnavailable extends Error {
  constructor(cause: unknown) {
    super("The configured MCP catalog could not be opened", { cause });
  }
}

export class Service {
  constructor(
    private readonly singlePageStartupMcpClient = new SinglePageStartupMcpClientService(),
    private readonly additionalConnectors: readonly IProfileMcpConnector[] = [],
  ) {}

  async open(
    props: IProfileMcpCatalogOpenProps,
  ): Promise<IProfileMcpCatalogSession> {
    const descriptors = new Map<string, IServerDescriptor>(
      supportedMcpServerDescriptors.map((descriptor) => [
        descriptor.id,
        descriptor,
      ]),
    );
    const connectors = new Map<string, () => Promise<TMcpSession>>([
      [
        SINGLEPAGESTARTUP_MCP_SERVER_ID,
        () =>
          this.singlePageStartupMcpClient.openSession({
            rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
          }),
      ],
    ]);
    for (const connector of this.additionalConnectors) {
      if (connectors.has(connector.descriptor.id)) {
        throw new Error("Configuration error. Duplicate profile MCP server");
      }
      descriptors.set(connector.descriptor.id, connector.descriptor);
      connectors.set(connector.descriptor.id, () => {
        if (!props.subjectId) {
          throw new Error("Authentication error. No MCP subject identity");
        }
        return connector.openSession({ subjectId: props.subjectId });
      });
    }
    const configured = new Set(props.configuredServerIds);
    const sessions = new Map<string, TMcpSession>();
    const connected: IProfileMcpServerCatalogItem[] = [];

    try {
      for (const descriptor of descriptors.values()) {
        const open = connectors.get(descriptor.id);
        if (!open || !configured.has(descriptor.id)) {
          continue;
        }
        const session = await open();
        sessions.set(descriptor.id, session);
        const tools = await session.listTools();
        connected.push({ ...descriptor, tools });
      }

      return new ProfileMcpCatalogSession({
        catalog: {
          supported: [...descriptors.values()],
          connected,
          stale: [...configured].filter((id) => !connectors.has(id)),
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
  private readonly sessions: Map<string, TMcpSession>;
  private closed = false;

  constructor(props: {
    catalog: IProfileMcpCatalog;
    sessions: Map<string, TMcpSession>;
  }) {
    this.catalog = props.catalog;
    this.sessions = props.sessions;
  }

  async callTool({
    serverId,
    ...call
  }: IMcpToolCallProps & {
    serverId: string;
  }): Promise<INormalizedMcpToolResult> {
    if (this.closed) {
      throw new Error("MCP catalog session is closed");
    }

    const session = this.sessions.get(serverId);

    if (!session) {
      throw new Error(
        `Validation error. MCP server ${serverId} is not connected for this profile`,
      );
    }

    const server = this.catalog.connected.find(({ id }) => id === serverId);
    if (!server?.tools.some(({ name }) => name === call.name)) {
      throw new Error("Validation error. Unknown tool for this MCP server");
    }

    return session.callTool(call);
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

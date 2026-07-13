import {
  supportedMcpServerIdentifiers,
  type TSupportedMcpServerIdentifier,
} from "@sps/social/models/profile/backend/repository/database";

export type { TSupportedMcpServerIdentifier } from "@sps/social/models/profile/backend/repository/database";

export interface IMcpServerDescriptor {
  id: TSupportedMcpServerIdentifier;
  title: string;
  description: string;
}

export interface IResolvedMcpServerConfiguration {
  supported: IMcpServerDescriptor[];
  stale: string[];
}

export const supportedMcpServerDescriptors: IMcpServerDescriptor[] = [
  {
    id: "project",
    title: "Project MCP",
    description: "Built-in MCP server for this SPS project.",
  },
];

const supportedMcpServerIdentifierSet = new Set<string>(
  supportedMcpServerIdentifiers,
);

export function isSupportedMcpServerIdentifier(
  identifier: string,
): identifier is TSupportedMcpServerIdentifier {
  return supportedMcpServerIdentifierSet.has(identifier);
}

export function resolveMcpServerConfiguration(
  configuredIdentifiers: readonly string[],
): IResolvedMcpServerConfiguration {
  const uniqueIdentifiers = [...new Set(configuredIdentifiers)];

  return {
    supported: supportedMcpServerDescriptors.filter((descriptor) =>
      uniqueIdentifiers.includes(descriptor.id),
    ),
    stale: uniqueIdentifiers.filter(
      (identifier) => !isSupportedMcpServerIdentifier(identifier),
    ),
  };
}

export function setMcpServerEnabled(
  configuredIdentifiers: readonly string[],
  identifier: TSupportedMcpServerIdentifier,
  enabled: boolean,
): TSupportedMcpServerIdentifier[] {
  const nextIdentifiers = configuredIdentifiers.filter(
    (
      configuredIdentifier,
    ): configuredIdentifier is TSupportedMcpServerIdentifier =>
      isSupportedMcpServerIdentifier(configuredIdentifier) &&
      configuredIdentifier !== identifier,
  );

  if (enabled) {
    nextIdentifiers.push(identifier);
  }

  return [...new Set(nextIdentifiers)];
}

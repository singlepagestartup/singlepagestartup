import {
  AI_CHAT_AGENTS,
  AI_CHAT_DOCUMENT_AGENTS,
  AI_CHAT_DEFAULT_AGENT,
  type IProjectAgent,
} from "@sps/shared-utils";
export { AI_CHAT_AGENTS, type IProjectAgent };

export function documentAgent(documentId: string): IProjectAgent {
  const id =
    AI_CHAT_DOCUMENT_AGENTS[documentId] ??
    (documentId.startsWith("product-") || documentId.includes("-product-")
      ? "business-analyst"
      : AI_CHAT_DEFAULT_AGENT);
  return AI_CHAT_AGENTS.find((agent) => agent.id === id)!;
}

export function snapshotAgent(agent: IProjectAgent): IProjectAgent {
  return { ...agent };
}

export function resolveThreadAgent(
  agent: IProjectAgent | null | undefined,
): IProjectAgent | null {
  return agent === undefined ? documentAgent("thread") : agent;
}

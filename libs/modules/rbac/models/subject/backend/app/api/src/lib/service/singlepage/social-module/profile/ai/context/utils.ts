import { createHash } from "node:crypto";
import type { IOpenRouterRequestMessage } from "@sps/shared-third-parties";
import type { IAiContextHistoryMessage } from "./interface";

export function hashAiContext(value: unknown): string {
  const canonical = (item: any): any =>
    item instanceof Date
      ? item.toJSON()
      : Array.isArray(item)
        ? item.map(canonical)
        : item && typeof item === "object"
          ? Object.fromEntries(
              Object.keys(item)
                .sort()
                .map((key) => [key, canonical(item[key])]),
            )
          : item;
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

export function fingerprintAiContextMessage(
  message: {
    id: string;
    description?: unknown;
    updatedAt?: unknown;
    createdAt?: unknown;
  },
  files: Array<{ id: string; updatedAt?: unknown }>,
): string {
  return hashAiContext([
    message.id,
    message.description,
    message.updatedAt,
    message.createdAt,
    files.map((file) => [file.id, file.updatedAt]),
  ]);
}

export function aiContextText(message: IOpenRouterRequestMessage): string {
  return typeof message.content === "string"
    ? message.content
    : message.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");
}

export function aiContextPrefixHash(
  history: IAiContextHistoryMessage[],
): string {
  return hashAiContext(
    history.map((message) => [message.id, message.role, message.fingerprint]),
  );
}

export function aiContextRecentStart(
  history: IAiContextHistoryMessage[],
  exchanges: number,
): number {
  const completed: number[] = [];
  let start: number | null = null;
  for (let index = 0; index < history.length - 1; index++) {
    if (history[index].role === "user" && start === null) start = index;
    else if (history[index].role === "assistant" && start !== null) {
      completed.push(start);
      start = null;
    }
  }
  return completed.length >= exchanges
    ? completed[completed.length - exchanges]
    : 0;
}

export function compactAiContextMessage(
  message: IAiContextHistoryMessage,
  triggerId: string,
): IOpenRouterRequestMessage {
  if (message.id === triggerId || typeof message.content === "string")
    return { role: message.role, content: message.content };
  return {
    role: message.role,
    content: [
      aiContextText(message),
      ...message.attachments.map(
        (file) =>
          `Historical attachment: ${file.adminTitle || file.id}; fileId=${file.id}; messageId=${message.id}. Read the original with profile_thread_attachment_read when visual/file contents are needed.`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

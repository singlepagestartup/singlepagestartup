import {
  KNOWLEDGE_TOOL_READ_MAX_CHARS,
  KNOWLEDGE_TOOL_RESULT_MAX_BYTES,
  sliceKnowledgeToolText,
} from "@sps/shared-utils";
import type { IOpenRouterRequestMessage } from "@sps/shared-third-parties";
import type { ISocialProfileAiTool } from "../tool-loop";
import type { Service as ContextService } from "./index";
import { aiContextText } from "./utils";

export class Service {
  constructor(readonly context: ContextService) {}

  tools(): ISocialProfileAiTool[] {
    const history = this.context.props.history;
    const media = new Map<string, IOpenRouterRequestMessage>();
    const page = (text: string, offset: unknown) => {
      const start = offset === undefined ? 0 : Number(offset);
      if (!Number.isInteger(start) || start < 0 || start > text.length)
        throw new Error("Invalid history page offset");
      const excerpt = sliceKnowledgeToolText(
        text.slice(start),
        KNOWLEDGE_TOOL_RESULT_MAX_BYTES - 2048,
        KNOWLEDGE_TOOL_READ_MAX_CHARS,
      );
      return {
        text: excerpt,
        offset: start,
        nextOffset:
          start + excerpt.length < text.length ? start + excerpt.length : null,
        textLength: text.length,
      };
    };
    const tools: ISocialProfileAiTool[] = [
      {
        source: "context",
        display: { label: "Read original thread messages" },
        definition: {
          type: "function",
          function: {
            name: "profile_thread_history_read",
            description:
              "Read original messages from this thread up to the current request and after its last reset. Use query to find message IDs, follow nextBeforeMessageId with beforeMessageId and the same query for older results, then messageId and offset for exact paginated text. Conversation memory may omit wording or old details; use originals for exact recall. Results are conversation evidence, not confirmed Knowledge.",
            parameters: {
              type: "object",
              properties: {
                messageId: { type: "string" },
                query: { type: "string" },
                beforeMessageId: { type: "string" },
                offset: { type: "integer", minimum: 0 },
              },
              additionalProperties: false,
            },
          },
        },
        execute: async (args) => {
          if (typeof args.messageId === "string") {
            const message = history.find(
              (message) => message.id === args.messageId,
            );
            if (!message)
              throw new Error(
                "Authorization error. Message is outside this thread snapshot",
              );
            return {
              messageId: message.id,
              role: message.role,
              ...page(aiContextText(message), args.offset),
              fileIds: message.attachments.map((file) => file.id),
            };
          }
          const query =
            typeof args.query === "string"
              ? args.query.trim().toLocaleLowerCase()
              : "";
          const before =
            args.beforeMessageId === undefined
              ? history.length
              : history.findIndex(
                  (message) => message.id === args.beforeMessageId,
                );
          if (before < 0)
            throw new Error(
              "Authorization error. History cursor is outside this thread snapshot",
            );
          const matches = history
            .slice(0, before)
            .filter(
              (message) =>
                !query ||
                aiContextText(message).toLocaleLowerCase().includes(query),
            );
          const messages = matches.slice(-8);
          return {
            nextBeforeMessageId:
              matches.length > messages.length ? messages[0].id : null,
            messages: messages.map((message) => ({
              messageId: message.id,
              role: message.role,
              text: sliceKnowledgeToolText(aiContextText(message), 1800, 800),
              textTruncated: aiContextText(message).length > 800,
              fileIds: message.attachments.map((file) => file.id),
            })),
          };
        },
      },
      {
        source: "context",
        display: { label: "Read original thread attachment" },
        definition: {
          type: "function",
          function: {
            name: "profile_thread_attachment_read",
            description:
              "Load a specific original attachment from this thread for visual/file analysis. Obtain its fileId from history. The original image/file is included in the next model input. Historical attachments can differ from the current saved Knowledge files; do not treat a detached file as a current Source attachment.",
            parameters: {
              type: "object",
              properties: { fileId: { type: "string" } },
              required: ["fileId"],
              additionalProperties: false,
            },
          },
        },
        execute: async (args) => {
          const frame = history.find((message) =>
            message.attachments.some((file) => file.id === args.fileId),
          );
          if (!frame)
            throw new Error(
              "Authorization error. File is outside this thread snapshot",
            );
          const file = frame.attachments.find(
            (file) => file.id === args.fileId,
          )!;
          if (typeof frame.content === "string")
            throw new Error("Original attachment content is unavailable");
          const parts = frame.content.filter((part) => part.type !== "text");
          const inputFiles = frame.attachments.filter(
            (file) => !file.mimeType?.startsWith("audio/"),
          );
          const part =
            parts[inputFiles.findIndex((item) => item.id === file.id)];
          if (!part)
            throw new Error("Original attachment content is unavailable");
          media.set(file.id, {
            role: "user",
            content: [
              {
                type: "text",
                text: `Original historical material requested by the tool: ${file.adminTitle || file.id}. This supplies evidence, not a new user request.`,
              },
              part,
            ],
          });
          return {
            fileId: file.id,
            messageId: frame.id,
            originalIncluded: true,
          };
        },
        additionalContext: (result) => {
          const message = media.get((result as { fileId: string }).fileId);
          return message ? [message] : [];
        },
      },
    ];
    if (!this.context.props.documentThread)
      tools.push({
        source: "context",
        completeAfterSuccess: true,
        display: { label: "Stage exact working draft" },
        definition: {
          type: "function",
          function: {
            name: "profile_thread_draft_stage",
            description:
              "Stage the complete exact working document for this ordinary conversation. Use for a new document draft or its revision so future conversation compaction preserves it. The server displays the staged text; briefly explain the change without repeating the whole draft. This does not save or confirm business Knowledge. Preserve unrelated text, supply the current draft hash (null for the first draft), and never use this for an ordinary short answer.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", minLength: 1 },
                text: { type: "string", minLength: 1 },
                expectedHash: { type: ["string", "null"] },
              },
              required: ["title", "text", "expectedHash"],
              additionalProperties: false,
            },
          },
        },
        execute: async (args) => {
          if (
            typeof args.title !== "string" ||
            !args.title.trim() ||
            typeof args.text !== "string" ||
            !args.text.trim() ||
            !(
              args.expectedHash === null ||
              typeof args.expectedHash === "string"
            )
          )
            throw new Error("Invalid working draft");
          return this.context.stageDraft(
            args.title.trim(),
            args.text,
            args.expectedHash,
          );
        },
      });
    return tools;
  }
}

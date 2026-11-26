import type { SubjectServiceDependencies } from "../../index";
import type {
  IModel,
  IChatMessage,
  IChatAttachmentIndexEntry,
} from "@sps/social/models/message/sdk/model";
import { CHAT_THREAD_MESSAGES_PAGE_SIZE } from "@sps/shared-utils";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";
import { Service as Presentations } from "../../../startup/social-module/chat/presentations";
import {
  customerWorkAttachments,
  projectCustomerWorkAttachments,
} from "../../ecommerce/customer-work/media";

export class Service {
  constructor(readonly service: SubjectServiceDependencies) {}

  async editable(input: {
    chatId: string;
    messageId: string;
    profileId: string;
  }) {
    const [membership, messageLink] = await Promise.all([
      this.service.modules.social.profilesToChats.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "chatId", method: "eq", value: input.chatId },
              { column: "profileId", method: "eq", value: input.profileId },
            ],
          },
        },
      }),
      this.service.modules.social.chatsToMessages.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "chatId", method: "eq", value: input.chatId },
              { column: "messageId", method: "eq", value: input.messageId },
            ],
          },
        },
      }),
    ]);
    if (!membership.length || !messageLink.length) {
      throw new Error(
        "Not Found error. The message is unavailable in this chat",
      );
    }
    const message = await this.service.modules.social.message.findById({
      id: input.messageId,
    });
    if (!message) {
      throw new Error(
        "Not Found error. The message is unavailable in this chat",
      );
    }
    if (message.variant === "customer-work" || message.workReplyKey) {
      throw new Error(
        "Forbidden error. Work conversation messages cannot be changed",
      );
    }
    return message;
  }

  private async attachmentRecords(messageIds: string[]) {
    if (!messageIds.length) {
      return { links: [], records: [] };
    }
    const links =
      await this.service.modules.social.messagesToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              { column: "messageId", method: "inArray", value: messageIds },
            ],
          },
          orderBy: {
            and: [
              { column: "orderIndex", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
        },
      });
    const fileIds = [
      ...new Set(
        links.map(({ fileStorageModuleFileId }) => fileStorageModuleFileId),
      ),
    ];
    const records: NonNullable<
      Awaited<
        ReturnType<
          SubjectServiceDependencies["modules"]["fileStorage"]["file"]["find"]
        >
      >
    > = [];
    for (
      let offset = 0;
      offset < fileIds.length;
      offset += CHAT_THREAD_MESSAGES_PAGE_SIZE
    ) {
      const ids = fileIds.slice(
        offset,
        offset + CHAT_THREAD_MESSAGES_PAGE_SIZE,
      );
      const batch = await this.service.modules.fileStorage.file.find({
        params: {
          filters: { and: [{ column: "id", method: "inArray", value: ids }] },
        },
      });
      records.push(...(batch ?? []));
    }
    return { links, records };
  }

  /** The caller holds a read-only snapshot across keyset pages of thread membership. */
  async threadAttachmentIndex(
    threadId: string,
  ): Promise<IChatAttachmentIndexEntry[]> {
    const found = new Map<
      string,
      { createdAt: number; entry: IChatAttachmentIndexEntry }
    >();
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const links = await this.service.modules.social.threadsToMessages.find({
        params: {
          filters: {
            and: [
              { column: "threadId", method: "eq", value: threadId },
              ...(cursor
                ? [{ column: "id", method: "gt" as const, value: cursor }]
                : []),
            ],
          },
          orderBy: { and: [{ column: "id", method: "asc" }] },
          limit: CHAT_THREAD_MESSAGES_PAGE_SIZE,
        },
      });
      if (!links.length) {
        break;
      }
      const messages = await this.service.modules.social.message.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: links.map(({ messageId }) => messageId),
              },
            ],
          },
        },
      });
      const dates = new Map(
        messages.map(({ id, createdAt }) => [
          id,
          new Date(createdAt).getTime(),
        ]),
      );
      for (const entry of await this.attachmentIndex(messages)) {
        found.set(entry.id, { createdAt: dates.get(entry.id)!, entry });
      }
      cursor = links[links.length - 1].id;
      hasMore = links.length === CHAT_THREAD_MESSAGES_PAGE_SIZE;
    }
    return Array.from(found.values())
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt || a.entry.id.localeCompare(b.entry.id),
      )
      .map(({ entry }) => entry);
  }

  async attachmentIndex(
    messages: IModel[],
  ): Promise<IChatAttachmentIndexEntry[]> {
    const publicIds = messages
      .filter(({ variant }) => variant !== "customer-work")
      .map(({ id }) => id);
    const { links, records } = await this.attachmentRecords(publicIds);
    const files = new Map(
      (records ?? []).map((file) => [
        file.id,
        {
          id: file.id,
          name:
            file.adminTitle ||
            file.alt ||
            file.file.split(/[?#]/)[0].split("/").at(-1) ||
            "",
        },
      ]),
    );
    const refs = new Map<
      string,
      IChatAttachmentIndexEntry["publicAttachmentRefs"]
    >();
    for (const link of links) {
      const file = files.get(link.fileStorageModuleFileId);
      if (file) {
        const attached = refs.get(link.messageId) ?? [];
        attached.push(file);
        refs.set(link.messageId, attached);
      }
    }
    const result: IChatAttachmentIndexEntry[] = [];
    for (const message of messages) {
      const privateAttachments = customerWorkAttachments(message).map(
        ({ id, name, mimeType }) => ({ id, name, mimeType }),
      );
      const publicAttachmentRefs = refs.get(message.id) ?? [];
      if (privateAttachments.length || publicAttachmentRefs.length) {
        result.push({
          id: message.id,
          variant: message.variant,
          privateAttachments,
          publicAttachmentRefs,
        });
      }
    }
    return result;
  }

  async enrich(messages: IModel[]): Promise<IChatMessage[]> {
    if (!messages.length) return [];
    const params = {
      filters: {
        and: [
          {
            column: "messageId",
            method: "inArray" as const,
            value: messages.map((m) => m.id),
          },
        ],
      },
    };
    const [authors, { links, records: files }] = await Promise.all([
      this.service.modules.social.profilesToMessages.find({ params }),
      this.attachmentRecords(messages.map(({ id }) => id)),
    ]);
    const safeFiles: NonNullable<typeof files> = [];
    for (const file of files || []) {
      try {
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: file.extension ? "file." + file.extension : file.file,
          mimeType: file.mimeType || undefined,
        });
        assertKnowledgeAttachmentBytes({
          bytes: await this.service.modules.fileStorage.file.readBytes(file),
          name: file.file,
          mimeType: file.mimeType || undefined,
        });
        safeFiles.push(file);
      } catch (error) {
        safeFiles.push({
          ...file,
          mimeType:
            error instanceof Error && /SVG/.test(error.message)
              ? "image/svg+xml"
              : "application/x-knowledge-unavailable",
        });
      }
    }
    const filesById = new Map(safeFiles.map((file) => [file.id, file]));
    const messageIds = new Set(messages.map((message) => message.id));
    const scopedAuthors = authors.filter((link) =>
      messageIds.has(link.messageId),
    );
    const profiles = await new Presentations(this.service).find(
      scopedAuthors.map((link) => link.profileId),
    );
    return messages.map((message) => ({
      ...projectCustomerWorkAttachments(message),
      authorProfileIds: scopedAuthors
        .filter((link) => link.messageId === message.id)
        .map((link) => link.profileId),
      authorProfiles: scopedAuthors
        .filter((link) => link.messageId === message.id)
        .flatMap((link) => {
          const profile = profiles.get(link.profileId);
          return profile ? [profile] : [];
        }),
      attachments: links
        .filter((link) => link.messageId === message.id)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        .flatMap((link) =>
          filesById.has(link.fileStorageModuleFileId)
            ? [filesById.get(link.fileStorageModuleFileId)!]
            : [],
        ),
    }));
  }
}

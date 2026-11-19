import type { SubjectServiceDependencies } from "../../index";
import type {
  IModel,
  IChatMessage,
} from "@sps/social/models/message/sdk/model";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";
import { Service as Presentations } from "../../../startup/social-module/chat/presentations";
import { projectCustomerWorkAttachments } from "../../ecommerce/customer-work/media";

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
    const [authors, links] = await Promise.all([
      this.service.modules.social.profilesToMessages.find({ params }),
      this.service.modules.social.messagesToFileStorageModuleFiles.find({
        params,
      }),
    ]);
    const fileIds = [
      ...new Set(links.map((link) => link.fileStorageModuleFileId as string)),
    ];
    let files: Awaited<
      ReturnType<
        SubjectServiceDependencies["modules"]["fileStorage"]["file"]["find"]
      >
    >;
    if (fileIds.length) {
      files = await this.service.modules.fileStorage.file.find({
        params: {
          filters: {
            and: [{ column: "id", method: "inArray", value: fileIds }],
          },
        },
      });
    } else {
      files = [];
    }
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

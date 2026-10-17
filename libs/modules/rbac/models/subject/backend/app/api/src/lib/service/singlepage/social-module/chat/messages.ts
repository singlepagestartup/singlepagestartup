import type { Service as SubjectService } from "../../index";
import type {
  IModel,
  IChatMessage,
} from "@sps/social/models/message/sdk/model";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";

export class Service {
  constructor(
    readonly service: Pick<
      SubjectService,
      "socialModule" | "fileStorageModule"
    >,
  ) {}

  async enrich(messages: IModel[]): Promise<IChatMessage[]> {
    if (!messages.length) return [];
    const params = {
      filters: {
        and: [
          {
            column: "messageId",
            method: "inArray",
            value: messages.map((m) => m.id),
          },
        ],
      },
    };
    const [authors, links] = await Promise.all([
      this.service.socialModule.profilesToMessages.find({ params }),
      this.service.socialModule.messagesToFileStorageModuleFiles.find({
        params,
      }),
    ]);
    const fileIds = [
      ...new Set(links.map((link) => link.fileStorageModuleFileId as string)),
    ];
    const files = fileIds.length
      ? await this.service.fileStorageModule.file.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: fileIds }],
            },
          },
        })
      : [];
    const safeFiles: NonNullable<typeof files> = [];
    for (const file of files || []) {
      try {
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: file.extension ? "file." + file.extension : file.file,
          mimeType: file.mimeType || undefined,
        });
        assertKnowledgeAttachmentBytes({
          bytes: await this.service.fileStorageModule.file.readBytes(file),
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
    return messages.map((message) => ({
      ...message,
      authorProfileIds: authors
        .filter((link) => link.messageId === message.id)
        .map((link) => link.profileId),
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

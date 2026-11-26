import {
  localizedFieldHasValue,
  normalizeLocalizedField,
} from "@sps/backend-utils";
import type { IModel as Chat } from "@sps/social/models/chat/sdk/model";
import type { IModel as ChatFile } from "@sps/social/relations/chats-to-file-storage-module-files/sdk/model";
import type { Service as Subject } from "../../index";

import { Service as Presentations } from "../../../startup/social-module/chat/presentations";
import type { IModel as Profile } from "@sps/social/models/profile/sdk/model";

interface IChatDetail {
  subjectId: string;
  viewerProfileId?: string;
  includeParticipants: boolean;
  staff: boolean;
  readTaskSettings: boolean;
  sharedThread?: { taskId: string; threadId: string };
}

interface ICoverImage {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

interface ISettings {
  title?: unknown;
  description?: unknown;
  removeCover?: boolean;
  coverFile?: File;
}

export class Service {
  constructor(private readonly subject: Subject) {}

  async detail(chat: Chat, input: IChatDetail) {
    let display = chat;
    let participants: Profile[] | undefined;
    let coverFileId: string | null = null;
    let settings;
    if (input.sharedThread) {
      const viewer = input.includeParticipants
        ? input.viewerProfileId
        : undefined;
      const scope =
        await this.subject.crmWorkspace.chatSettings.threadPresentation(
          chat.id,
          input.sharedThread,
          viewer,
        );
      display = scope.chat;
      participants = scope.participants;
      settings = {
        taskChatThreadId: input.sharedThread.threadId,
        canManageChat: false,
      };
    } else {
      coverFileId = await this.coverId(chat.id);
      if (input.readTaskSettings) {
        settings = await this.subject.crmWorkspace.chatSettings.presentation(
          input.subjectId,
          chat.id,
        );
      } else {
        settings = {
          canManageChat: await this.subject.chatOwnership.isOwner(
            input.subjectId,
            chat.id,
          ),
        };
      }
      if (input.includeParticipants) {
        participants = await this.subject.socialModuleChatParticipants({
          socialModuleChatId: chat.id,
        });
      }
    }
    let participantData;
    if (participants) {
      const profiles = await new Presentations(this.subject).find(
        participants.map(({ id }) => id),
      );
      participantData = {
        participants,
        participantPresentations: [...profiles.values()],
      };
    }
    return {
      ...display,
      coverFileId,
      ...participantData,
      ...settings,
      ...(input.staff ? { taskChatStaff: true } : {}),
    };
  }

  private get links() {
    return this.subject.modules.social.chatsToFileStorageModuleFiles;
  }

  private async coverLink(chatId: string) {
    const [cover] = await this.links.find({
      params: {
        filters: {
          and: [
            { column: "chatId", method: "eq", value: chatId },
            { column: "variant", method: "eq", value: "cover" },
          ],
        },
      },
    });
    return cover;
  }

  async coverId(chatId: string) {
    return (await this.coverLink(chatId))?.fileStorageModuleFileId ?? null;
  }

  async coverContent(chatId: string) {
    const id = await this.coverId(chatId);
    if (!id) {
      throw new Error("Not found error. Chat cover not found");
    }
    const file =
      await this.subject.modules.fileStorage.file.privateContent.findById({
        id,
        variant: "chat-cover",
      });
    if (!file) {
      throw new Error("Not found error. Chat cover not found");
    }
    return file;
  }

  async update(chatId: string, input: ISettings) {
    const title = normalizeLocalizedField(input.title, "title", {
      entityName: "Chat",
    });
    const description = normalizeLocalizedField(
      input.description,
      "description",
      { entityName: "Chat" },
    );
    if (title && !localizedFieldHasValue(title)) {
      throw new Error("Validation error. Chat title is required");
    }
    if (!(title || description || input.coverFile || input.removeCover)) {
      throw new Error("Validation error. No chat settings provided");
    }
    if (input.coverFile && input.removeCover) {
      throw new Error(
        "Validation error. Choose whether to replace or remove the chat cover",
      );
    }
    const patch: Partial<Chat> = {};
    if (title) {
      patch.title = JSON.stringify(title);
    }
    if (description) {
      patch.description = JSON.stringify(description);
    }
    let image: ICoverImage | undefined;
    if (input.coverFile) {
      image = await this.prepareImage(input.coverFile);
    }

    return this.subject.repository.withChatSettingsLock(chatId, async () => {
      const chats = this.subject.modules.social.chat;
      let chat;
      if (Object.keys(patch).length) {
        chat = await chats.update({ id: chatId, data: patch });
      } else {
        chat = await chats.findById({ id: chatId });
      }
      if (!chat) {
        throw new Error("Not found error. Chat not found");
      }

      const previous = await this.coverLink(chatId);
      if (!image && !input.removeCover) {
        return {
          ...chat,
          coverFileId: previous?.fileStorageModuleFileId ?? null,
        };
      }
      const coverFileId = await this.replaceCover(chatId, previous, image);
      return { ...chat, coverFileId };
    });
  }

  async deleteChat(chatId: string) {
    return this.subject.repository.withChatSettingsLock(chatId, async () => {
      const cover = await this.coverLink(chatId);
      if (cover) {
        await this.replaceCover(chatId, cover);
      }
      return this.subject.modules.social.chat.delete({ id: chatId });
    });
  }

  private async replaceCover(
    chatId: string,
    previous: ChatFile | undefined,
    image?: ICoverImage,
  ) {
    const files = this.subject.modules.fileStorage.file.privateContent;
    let cover;
    if (image) {
      cover = await files.write({ ...image, variant: "chat-cover" });
    }
    if (cover && previous) {
      await this.links.update({
        id: previous.id,
        data: { fileStorageModuleFileId: cover.id },
      });
    } else if (cover) {
      await this.links.create({
        data: { chatId, variant: "cover", fileStorageModuleFileId: cover.id },
      });
    } else if (previous) {
      await this.links.delete({ id: previous.id });
    }
    if (previous) {
      const id = previous.fileStorageModuleFileId;
      const remaining = await this.links.find({
        params: {
          filters: {
            and: [
              { column: "fileStorageModuleFileId", method: "eq", value: id },
            ],
          },
        },
      });
      if (!remaining.length) {
        await files.delete({ id, variant: "chat-cover" });
      }
    }
    return cover?.id ?? null;
  }

  private async prepareImage(file: File): Promise<ICoverImage> {
    if (!file.size || file.size > 2 * 1024 * 1024) {
      throw new Error("Validation error. Chat covers must be at most 2 MB");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(bytes).catch(() => undefined);
    if (
      !detected ||
      !["image/png", "image/jpeg", "image/webp"].includes(detected.mime)
    ) {
      throw new Error("Validation error. Upload a PNG, JPEG or WebP cover");
    }
    const { imageSize } = await import("image-size");
    try {
      const dimensions = imageSize(bytes);
      if (!dimensions.width || !dimensions.height) {
        throw new Error("Empty image");
      }
    } catch {
      throw new Error("Validation error. Image dimensions could not be read");
    }
    return { name: "cover." + detected.ext, mimeType: detected.mime, bytes };
  }
}

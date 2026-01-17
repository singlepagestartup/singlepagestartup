import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/notification/backend/repository/database";
import { AWS } from "@sps/shared-third-parties";
import {
  AWS_SES_FROM_EMAIL,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_BOT_TOKEN,
} from "@sps/shared-utils";
import { api as notificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as templateApi } from "@sps/notification/models/template/sdk/server";
import { IModel as ITemplate } from "@sps/notification/models/template/sdk/model";
import { Bot } from "grammy";
import { InlineKeyboardButton } from "@grammyjs/types";
import { telegramMarkdownFormatter } from "@sps/backend-utils";
import { IModel } from "@sps/notification/models/notification/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  private splitTelegramText(text: string, limit: number): string[] {
    if (!text) {
      return [""];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > limit) {
      let slice = remaining.slice(0, limit);
      let splitIndex = Math.max(
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(" "),
      );

      if (splitIndex <= 0) {
        splitIndex = limit;
      }

      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex).trimStart();
    }

    if (remaining.length) {
      chunks.push(remaining);
    }

    return chunks;
  }

  private normalizeTelegramProps(props: unknown[]) {
    if (!props.length) {
      return props;
    }

    const [text, options, ...rest] = props;

    if (typeof text === "string") {
      const parseMode =
        options && typeof options === "object"
          ? (options as Record<string, unknown>)?.parse_mode
          : undefined;
      const shouldFormat = !parseMode || parseMode === "MarkdownV2";
      const formattedText = shouldFormat
        ? telegramMarkdownFormatter({ input: text })
        : text;
      const nextOptions =
        options && typeof options === "object"
          ? {
              ...(options as Record<string, unknown>),
              parse_mode: parseMode || "MarkdownV2",
            }
          : { parse_mode: "MarkdownV2" };

      return [formattedText, nextOptions, ...rest];
    }

    return props;
  }

  private normalizeInlineKeyboard(interaction?: {
    inline_keyboard?: {
      text: string;
      url?: string;
      callback_data?: string;
    }[][];
  }): InlineKeyboardButton[][] | undefined {
    if (!interaction?.inline_keyboard?.length) {
      return;
    }

    const keyboard = interaction.inline_keyboard
      .map((row) => {
        return row
          .map((button) => {
            if (button.url) {
              return {
                text: button.text,
                url: button.url,
              };
            }

            if (button.callback_data) {
              return {
                text: button.text,
                callback_data: button.callback_data,
              };
            }

            return null;
          })
          .filter(Boolean) as InlineKeyboardButton[];
      })
      .filter((row) => row.length);

    return keyboard.length ? keyboard : undefined;
  }

  private normalizeReplyMarkup(
    replyMarkup?:
      | {
          inline_keyboard?: {
            text: string;
            url?: string;
            callback_data?: string;
          }[][];
        }
      | Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!replyMarkup || typeof replyMarkup !== "object") {
      return undefined;
    }

    const inlineKeyboard = this.normalizeInlineKeyboard(
      replyMarkup as {
        inline_keyboard?: {
          text: string;
          url?: string;
          callback_data?: string;
        }[][];
      },
    );
    const nextReplyMarkup = { ...(replyMarkup as Record<string, unknown>) };

    if (inlineKeyboard) {
      return { ...nextReplyMarkup, inline_keyboard: inlineKeyboard };
    }

    delete (nextReplyMarkup as { inline_keyboard?: unknown }).inline_keyboard;

    return Object.keys(nextReplyMarkup).length ? nextReplyMarkup : undefined;
  }

  async telegramEditMessage(props: {
    chatId: string | number;
    messageId: string | number;
    text: string;
    interaction?: {
      inline_keyboard?: {
        text: string;
        url?: string;
        callback_data?: string;
      }[][];
    };
    parseMode?: "MarkdownV2" | "HTML";
  }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN not set",
      );
    }

    const parseMode = props.parseMode || "MarkdownV2";
    const shouldFormat = parseMode === "MarkdownV2";
    const formattedText = shouldFormat
      ? telegramMarkdownFormatter({ input: props.text })
      : props.text;
    const inlineKeyboard = this.normalizeInlineKeyboard(props.interaction);

    const bot = new Bot(TELEGRAM_SERVICE_BOT_TOKEN);

    try {
      const normalizedMessageId =
        typeof props.messageId === "string"
          ? parseInt(props.messageId, 10)
          : props.messageId;
      await bot.api.editMessageText(
        props.chatId,
        normalizedMessageId,
        formattedText,
        {
          parse_mode: parseMode,
          ...(inlineKeyboard
            ? { reply_markup: { inline_keyboard: inlineKeyboard } }
            : {}),
        },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("message is not modified")
      ) {
        return;
      }

      throw error;
    }
  }

  async editBySourceSystem(props: {
    reciever: string;
    sourceSystemId: string | number;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const notification = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "reciever",
              method: "eq",
              value: props.reciever,
            },
            {
              column: "sourceSystemId",
              method: "eq",
              value: String(props.sourceSystemId),
            },
          ],
        },
      },
    });

    if (!notification?.length) {
      throw new Error("Not Found error. Notification not found");
    }

    const entity = notification[0];

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' not set.");
    }

    const notificationToTemplates = await notificationsToTemplatesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "notificationId",
              method: "eq",
              value: entity.id,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!notificationToTemplates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    const templates = await templateApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: notificationToTemplates.map(
                (notificationToTemplate) => notificationToTemplate.templateId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!templates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    const method = templates[0].variant.includes("email")
      ? "email"
      : templates[0].variant.includes("telegram")
        ? "telegram"
        : undefined;

    if (method !== "telegram") {
      return entity;
    }

    const template = templates.find((item) =>
      item.variant.includes("telegram"),
    );

    if (!template) {
      throw new Error("Not Found error. Telegram template not found");
    }

    const renderResult = await templateApi.render({
      id: template.id,
      data: entity.data,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!renderResult) {
      throw new Error("Internal error. Template not rendered");
    }

    const parsedRenderResult = JSON.parse(renderResult);
    const text = parsedRenderResult.props?.[0] || "";
    const options = parsedRenderResult.props?.[1] || {};
    const parseMode = options?.parse_mode;
    const interaction = options?.reply_markup as {
      inline_keyboard?: {
        text: string;
        url?: string;
        callback_data?: string;
      }[][];
    };

    await this.telegramEditMessage({
      chatId: entity.reciever,
      messageId: entity.sourceSystemId || String(props.sourceSystemId),
      text,
      interaction,
      parseMode,
    });

    return entity;
  }

  async deleteBySourceSystem(props: {
    entity: IModel;
    reciever: string;
    sourceSystemId: string | number;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' not set.");
    }

    const notificationToTemplates = await notificationsToTemplatesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "notificationId",
              method: "eq",
              value: props.entity.id,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!notificationToTemplates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    const templates = await templateApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: notificationToTemplates.map(
                (notificationToTemplate) => notificationToTemplate.templateId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!templates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    const method = templates[0].variant.includes("email")
      ? "email"
      : templates[0].variant.includes("telegram")
        ? "telegram"
        : undefined;

    if (!TELEGRAM_SERVICE_BOT_TOKEN && method === "telegram") {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN not set",
      );
    }

    if (method !== "telegram") {
      return;
    }

    const bot = new Bot(TELEGRAM_SERVICE_BOT_TOKEN as string);
    const normalizedMessageId =
      typeof props.sourceSystemId === "string"
        ? parseInt(props.sourceSystemId, 10)
        : props.sourceSystemId;

    try {
      await bot.api.deleteMessage(props.reciever, normalizedMessageId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("message to delete not found")
      ) {
        return;
      }

      throw error;
    }
  }

  getMimeType(url: string) {
    const ext = url.split(".")?.pop()?.toLowerCase();

    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      pdf: "application/pdf",
    };

    if (!ext) {
      throw new Error("Validation error. Mime type not recognized");
    }

    return mimeTypes[ext] || "application/octet-stream";
  }

  async provider(props: {
    method: "email" | "telegram";
    provider: "Amazon SES" | "Telegram";
    id: string;
    template: ITemplate;
  }): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Not Found error. Notification not found");
    }

    if (!entity.reciever) {
      throw new Error("Not Found error. Reciever not found");
    }

    const attachments = entity.attachments || [];

    const validAttachments: typeof attachments = [];

    for (const attachment of attachments) {
      try {
        const response = await fetch(attachment.url, { method: "HEAD" });
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType?.startsWith("image/")) {
          validAttachments.push(attachment);
        } else {
          console.log(`Skipping invalid attachment: ${attachment.url}`);
        }
      } catch (error) {
        console.log(`Error checking ${attachment.url}:`, error);
      }
    }

    let sourceSystemId: string | undefined;

    if (props.method === "email") {
      if (props.provider === "Amazon SES") {
        if (!AWS_SES_FROM_EMAIL) {
          throw new Error("Configuration error. AWS SES from email not found");
        }

        const renderResult = await templateApi.render({
          id: props.template.id,
          data: entity.data,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!renderResult) {
          throw new Error("Internal error. Template not rendered");
        }

        const aws = new AWS();

        const response = await aws.ses.sendEmail({
          to: entity.reciever,
          subject:
            entity.title ||
            props.template.title ||
            "Notification from Single Page Startup",
          html: renderResult,
          from: AWS_SES_FROM_EMAIL,
          filePaths: validAttachments.map((attachment) => attachment.url),
        });

        if (response.MessageId) {
          sourceSystemId = String(response.MessageId);
        }
      }
    } else if (props.method === "telegram") {
      if (!props.template) {
        throw new Error("Not Found error. Template not found");
      }

      if (entity.reciever && TELEGRAM_SERVICE_BOT_TOKEN) {
        const renderResult = await templateApi.render({
          id: props.template.id,
          data: entity.data,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!renderResult) {
          throw new Error("Internal error. Template not rendered");
        }

        const parsedRenderResult = JSON.parse(renderResult);

        const bot = new Bot(TELEGRAM_SERVICE_BOT_TOKEN);

        if (validAttachments?.length) {
          const captionOptions = parsedRenderResult.props[1] || {};
          const baseCaptionOptions = { ...(captionOptions || {}) };
          delete (baseCaptionOptions as { reply_markup?: unknown })
            .reply_markup;
          const normalizedReplyMarkup = this.normalizeReplyMarkup(
            (captionOptions as { reply_markup?: unknown })?.reply_markup as {
              inline_keyboard?: {
                text: string;
                url?: string;
                callback_data?: string;
              }[][];
            },
          );
          const parseMode = captionOptions?.parse_mode;
          const shouldFormat = !parseMode || parseMode === "MarkdownV2";
          const captionSource = shouldFormat
            ? telegramMarkdownFormatter({
                input: parsedRenderResult.props[0],
              })
            : parsedRenderResult.props[0];
          const captionLimit = 1024;
          const captionChunks = this.splitTelegramText(
            captionSource || "",
            captionLimit,
          );
          const formattedCaption = captionChunks.shift() || "";
          const finalParseMode = parseMode || "MarkdownV2";
          const response = await bot.api.sendMediaGroup(
            entity.reciever,
            validAttachments.map((attachment, index) => {
              const mimeType = this.getMimeType(attachment.url);
              return {
                type: mimeType.startsWith("image/") ? "photo" : "document",
                media: attachment.url,
                ...(index === 0 && {
                  caption: formattedCaption,
                  parse_mode: finalParseMode,
                }),
              };
            }),
          );

          if (response.length) {
            const messageId = response[0].message_id;

            sourceSystemId = String(messageId);
          }

          if (captionChunks.length) {
            const chunkCount = captionChunks.length;
            for (const [index, chunk] of captionChunks.entries()) {
              const isLast = index === chunkCount - 1;
              const nextOptions = {
                ...baseCaptionOptions,
                ...(isLast && normalizedReplyMarkup
                  ? { reply_markup: normalizedReplyMarkup }
                  : {}),
              };
              if (!isLast) {
                delete (nextOptions as { reply_markup?: unknown }).reply_markup;
              }
              await bot.api.sendMessage(entity.reciever, chunk, nextOptions);
            }
          } else if (normalizedReplyMarkup) {
            await bot.api.sendMessage(entity.reciever, ".", {
              ...baseCaptionOptions,
              reply_markup: normalizedReplyMarkup,
            });
          }
        } else {
          const formattedProps = this.normalizeTelegramProps(
            parsedRenderResult.props || [],
          );
          if (
            parsedRenderResult.method === "sendMessage" &&
            typeof formattedProps[0] === "string"
          ) {
            const [text, options] = formattedProps;
            const baseOptions =
              options && typeof options === "object"
                ? { ...(options as Record<string, unknown>) }
                : undefined;
            if (baseOptions) {
              delete (baseOptions as { reply_markup?: unknown }).reply_markup;
            }
            const normalizedReplyMarkup = this.normalizeReplyMarkup(
              (options as { reply_markup?: unknown })?.reply_markup as {
                inline_keyboard?: {
                  text: string;
                  url?: string;
                  callback_data?: string;
                }[][];
              },
            );
            const chunks = this.splitTelegramText(text as string, 4000);
            const chunkCount = chunks.length;
            let lastResponse: { message_id?: number } | undefined = undefined;

            for (const [index, chunk] of chunks.entries()) {
              const isLast = index === chunkCount - 1;
              const nextOptions = baseOptions
                ? {
                    ...baseOptions,
                    ...(isLast && normalizedReplyMarkup
                      ? { reply_markup: normalizedReplyMarkup }
                      : {}),
                  }
                : normalizedReplyMarkup && isLast
                  ? { reply_markup: normalizedReplyMarkup }
                  : undefined;

              if (nextOptions && !isLast) {
                delete (nextOptions as { reply_markup?: unknown }).reply_markup;
              }

              const response = await bot.api.sendMessage(
                entity.reciever,
                chunk,
                nextOptions as any,
              );
              lastResponse = response;
            }

            if (lastResponse?.message_id) {
              sourceSystemId = String(lastResponse.message_id);
            }
          } else {
            const response = await bot.api[parsedRenderResult.method](
              entity.reciever,
              ...formattedProps,
            );

            if (response.message_id) {
              sourceSystemId = String(response.message_id);
            }
          }
        }
      }
    }

    const updatedNotification = await this.update({
      id: entity.id,
      data: {
        ...entity,
        sourceSystemId: sourceSystemId || null,
        status: "sent",
      },
    });

    if (!updatedNotification) {
      throw new Error("Internal error. Notification not updated");
    }

    return updatedNotification;
  }

  async send(params: { id: string }): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const notification = await this.findById({
      id: params.id,
    });

    if (!notification) {
      throw new Error("Not Found error. Notification not found");
    }

    if (notification.status !== "new") {
      return notification;
    }

    const sendAfterTimestamp = new Date(
      notification.sendAfter ?? new Date(),
    ).getTime();

    const currentTimestamp = new Date().getTime();

    if (sendAfterTimestamp > currentTimestamp) {
      return notification;
    }

    const notificationToTemplates = await notificationsToTemplatesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "notificationId",
              method: "eq",
              value: params.id,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!notificationToTemplates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    const templates = await templateApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: notificationToTemplates.map(
                (notificationToTemplate) => notificationToTemplate.templateId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!templates?.length) {
      throw new Error("Not Found error. Template not found");
    }

    for (const template of templates) {
      const type = template.variant.includes("email")
        ? "email"
        : template.variant.includes("telegram")
          ? "telegram"
          : undefined;

      if (!type) {
        throw new Error(
          "Validation error. Invalid type. Expected 'email|telegram'. Got: " +
            type,
        );
      }

      if (type === "email") {
        return await this.provider({
          method: "email",
          provider: "Amazon SES",
          id: params.id,
          template,
        });
      } else if (type === "telegram") {
        return await this.provider({
          method: "telegram",
          provider: "Telegram",
          id: params.id,
          template,
        });
      }
    }

    return notification;
  }

  async deleteExpired() {
    const expiredNotifications = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "createdAt",
              method: "lt",
              value: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          ],
        },
      },
    });

    for (const expiredNotification of expiredNotifications) {
      this.delete({
        id: expiredNotification.id,
      }).catch((error) => {
        //
      });
    }
  }
}

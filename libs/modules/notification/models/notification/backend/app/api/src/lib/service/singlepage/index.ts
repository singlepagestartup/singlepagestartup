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
import { IModel } from "@sps/notification/models/notification/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
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

    const attachments: { type: "image"; url: string }[] =
      JSON.parse(entity.attachments || "[]") || [];

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
          data: entity.data ? JSON.parse(entity.data) : {},
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
          data: entity.data ? JSON.parse(entity.data) : {},
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
          const response = await bot.api.sendMediaGroup(
            entity.reciever,
            validAttachments.map((attachment, index) => {
              const mimeType = this.getMimeType(attachment.url);
              return {
                type: mimeType.startsWith("image/") ? "photo" : "document",
                media: attachment.url,
                ...(index === 0 && {
                  caption: parsedRenderResult.props[0],
                  parse_mode: parsedRenderResult.props[1]?.parse_mode || "HTML",
                }),
              };
            }),
          );

          if (response.length) {
            const messageId = response[0].message_id;

            sourceSystemId = String(messageId);
          }
        } else {
          const response = await bot.api[parsedRenderResult.method](
            entity.reciever,
            ...parsedRenderResult.props,
          );

          if (response.message_id) {
            sourceSystemId = String(response.message_id);
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
              value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
    });

    for (const expiredNotification of expiredNotifications) {
      try {
        await this.delete({
          id: expiredNotification.id,
        });
      } catch (error) {
        //
      }
    }
  }
}

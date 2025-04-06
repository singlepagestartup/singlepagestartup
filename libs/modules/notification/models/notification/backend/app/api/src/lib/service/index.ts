import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/notification/backend/repository/database";
import { AWS } from "@sps/shared-third-parties";
import { api } from "@sps/notification/models/notification/sdk/server";
import {
  AWS_SES_FROM_EMAIL,
  RBAC_SECRET_KEY,
  TELEGRAM_BOT_TOKEN,
} from "@sps/shared-utils";
import { api as notificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as templateApi } from "@sps/notification/models/template/sdk/server";
import { IModel as ITemplate } from "@sps/notification/models/template/sdk/model";
import { Bot } from "grammy";

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
      throw new Error("Mime type not recognized");
    }

    return mimeTypes[ext] || "application/octet-stream";
  }

  async provider(props: {
    method: "email" | "telegram";
    provider: "Amazon SES" | "Telegram";
    id: string;
    template: ITemplate;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Secret key not found");
    }

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Notification not found");
    }

    if (!entity.reciever) {
      throw new Error("Reciever not found");
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

    if (props.method === "email") {
      if (props.provider === "Amazon SES") {
        if (!AWS_SES_FROM_EMAIL) {
          throw new Error("AWS SES from email not found");
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
          throw new Error("Template not rendered");
        }

        const aws = new AWS();

        await aws.ses.sendEmail({
          to: entity.reciever,
          subject:
            entity.title ||
            props.template.title ||
            "Notification from Single Page Startup",
          html: renderResult,
          from: AWS_SES_FROM_EMAIL,
          filePaths: validAttachments.map((attachment) => attachment.url),
        });
      }
    } else if (props.method === "telegram") {
      if (!props.template) {
        throw new Error("Template not found");
      }

      if (entity.reciever && TELEGRAM_BOT_TOKEN) {
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
          throw new Error("Template not rendered");
        }

        const parsedRenderResult = JSON.parse(renderResult);

        const bot = new Bot(TELEGRAM_BOT_TOKEN);

        if (validAttachments?.length) {
          await bot.api.sendMediaGroup(
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
        } else {
          await bot.api[parsedRenderResult.method](
            entity.reciever,
            ...parsedRenderResult.props,
          );
        }
      }
    }

    await this.update({
      id: entity.id,
      data: {
        ...entity,
        status: "sent",
      },
    });

    await api.update({
      id: entity.id,
      data: {
        ...entity,
        status: "sent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    return { ok: true };
  }

  async send(params: { id: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Secret key not found");
    }

    const notification = await this.findById({
      id: params.id,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.status !== "new") {
      return { ok: true };
    }

    const sendAfterTimestamp = new Date(
      notification.sendAfter ?? new Date(),
    ).getTime();

    const currentTimestamp = new Date().getTime();

    if (sendAfterTimestamp > currentTimestamp) {
      return { ok: true };
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
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!notificationToTemplates?.length) {
      throw new Error("Template not found");
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
      throw new Error("Template not found");
    }

    for (const template of templates) {
      const type = template.variant.includes("email")
        ? "email"
        : template.variant.includes("telegram")
          ? "telegram"
          : undefined;

      if (!type) {
        throw new Error(
          "Invalid type. Expected 'email|telegram'. Got: " + type,
        );
      }

      if (type === "email") {
        await this.provider({
          method: "email",
          provider: "Amazon SES",
          id: params.id,
          template,
        });
      } else if (type === "telegram") {
        await this.provider({
          method: "telegram",
          provider: "Telegram",
          id: params.id,
          template,
        });
      }
    }

    return {
      ok: true,
    };
  }
}

import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/notification/backend/repository/database";
import { AWS } from "@sps/shared-third-parties";
import { api } from "@sps/notification/models/notification/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as notificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as templateApi } from "@sps/notification/models/template/sdk/server";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async provider(props: { provider: "email"; id: string }) {
    try {
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
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!notificationToTemplates?.length) {
        throw new Error("Template not found");
      }

      const attachments: { type: "image"; url: string }[] =
        JSON.parse(entity.attachments || "[]") || [];

      const renderResult = await templateApi.render({
        id: notificationToTemplates[0].templateId,
        data: entity.data ? JSON.parse(entity.data) : {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      console.log(`🚀 ~ provider ~ renderResult:`, renderResult);

      if (!renderResult) {
        throw new Error("Template not rendered");
      }

      const aws = new AWS();

      await aws.ses.sendEmail({
        to: entity.reciever,
        subject: entity.title || "Notification from Single Page Startup",
        html: renderResult,
        from: "no-reply@mail.singlepagestartup.com",
        filePaths: attachments.map((attachment) => attachment.url),
      });

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
    } catch (error: any) {
      throw new Error(error.message, error.stack);
    }
  }

  async send(params: { id: string }) {
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

    if (notification.method === "email") {
      return await this.provider({
        provider: "email",
        id: params.id,
      });
    }

    throw new Error("Provider not found");
  }
}

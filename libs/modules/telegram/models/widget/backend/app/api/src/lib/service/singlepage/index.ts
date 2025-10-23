import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/widget/backend/repository/database";
import { api } from "@sps/telegram/models/widget/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context as GrammyContext } from "grammy";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async telegramWidgets() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const widgets = await api.find({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!widgets) {
      return null;
    }

    const message = widgets.map((widget) => {
      return `Widget: ${widget.id}`;
    });

    return message;
  }
}

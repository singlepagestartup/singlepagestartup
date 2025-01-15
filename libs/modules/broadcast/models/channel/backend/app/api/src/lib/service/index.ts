import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as channelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as messageApi } from "@sps/broadcast/models/message/sdk/server";
import { api as channelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async pushMessage(props: { data: { channelName: string; payload: any } }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined");
    }

    const { data } = props;

    let [channel] = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "title",
              method: "eq",
              value: data.channelName,
            },
          ],
        },
      },
    });

    if (!channel) {
      channel = await channelApi.create({
        data: {
          title: data.channelName,
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
    }

    const message = await messageApi.create({
      data: {
        ...data,
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

    await channelsToMessagesApi.create({
      data: {
        channelId: channel.id,
        messageId: message.id,
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

    return channel;
  }
}

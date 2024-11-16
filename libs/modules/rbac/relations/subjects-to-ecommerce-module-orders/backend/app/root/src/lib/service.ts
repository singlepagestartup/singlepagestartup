import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database";
import { HOST_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async create(props: { data: any }): Promise<any | null> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined");
    }

    const superResult = await super.create(props);

    await broadcastChannelApi.pushMessage({
      data: {
        channelName: "observer",
        payload: JSON.stringify({
          action: {
            type: "request",
            method: "PATCH",
            url: `${HOST_URL}/api/ecommerce/orders/${superResult.ecommerceModuleOrderId}`,
          },
          callback: {
            type: "request",
            method: "POST",
            url: `${HOST_URL}/api/rbac/subjects/${superResult.subjectId}/notify`,
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            body: {
              data: {
                ecommerce: {
                  order: {
                    id: superResult.ecommerceModuleOrderId,
                  },
                },
                notification: {
                  topic: {
                    title: "Information",
                  },
                  template: {
                    variant: "order-status-changed-to-paid",
                  },
                  notification: {
                    data: JSON.stringify({
                      title: "Order status updated",
                      subject: "Order status updated",
                      id: superResult.ecommerceModuleOrderId,
                    }),
                  },
                },
              },
            },
          },
        }),
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

    return superResult;
  }
}

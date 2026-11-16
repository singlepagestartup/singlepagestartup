import { verifyJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { isRbacSubjectTokenRevoked } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IOwner } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/model";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOrderIntent } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { IModel as ILine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { Service as SubjectService } from "../../index";

interface ICart {
  id: string;
  owner: IOwner;
  guest: boolean;
  editable: boolean;
  lines: ILine[];
}

export class Service {
  constructor(
    private readonly service: Pick<
      SubjectService,
      | "repository"
      | "subjectsToIdentities"
      | "subjectsToEcommerceModuleOrders"
      | "ecommerceModule"
    >,
  ) {}

  async execute({
    subjectId,
    guestToken,
  }: {
    subjectId: string;
    guestToken: string;
  }) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }
    let token;
    try {
      token = await verifyJwt(guestToken, RBAC_JWT_SECRET, { type: "access" });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Authentication error.")
      ) {
        return;
      }
      throw error;
    }
    const guestId = token.subject?.["id"];
    if (typeof guestId !== "string" || !guestId || guestId === subjectId) {
      return;
    }
    const { repository } = this.service;
    const [first, second] = [guestId, subjectId].sort();
    await repository.withSubjectLock({ subjectId: first }, () =>
      repository.withSubjectLock({ subjectId: second }, async () => {
        const guest = await repository.lockCartGuest(guestId);
        if (
          !guest ||
          guest.variant !== "default" ||
          isRbacSubjectTokenRevoked({ subject: guest, issuedAt: token.iat })
        ) {
          return;
        }
        const identities = await this.service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: guestId }],
            },
            limit: 1,
          },
        });
        if (identities.length) {
          return;
        }
        const carts = await this.readCarts(guestId, subjectId);
        await this.merge(carts, subjectId);
      }),
    );
  }

  private async readCarts(
    guestId: string,
    subjectId: string,
  ): Promise<ICart[]> {
    const { ecommerceModule, subjectsToEcommerceModuleOrders } = this.service;
    const links = await subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "inArray",
              value: [guestId, subjectId],
            },
          ],
        },
      },
    });
    if (!links.some((link) => link.subjectId === guestId)) {
      return [];
    }
    const active = await this.findOpenOrders(
      links.map((link) => link.ecommerceModuleOrderId),
    );
    const ids = active.map((order) => order.id).sort();
    if (!ids.length) {
      return [];
    }
    for (const id of ids) {
      await ecommerceModule.order.lockForLifecycle({ id });
    }
    const byOrder = {
      params: {
        filters: {
          and: [{ column: "orderId", method: "inArray", value: ids }],
        },
      },
    };
    const orders = await this.findOpenOrders(ids);
    const owners = await subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            { column: "ecommerceModuleOrderId", method: "inArray", value: ids },
          ],
        },
      },
    });
    const payments: IOrderIntent[] =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find(byOrder);
    const lines: ILine[] = await ecommerceModule.ordersToProducts.find(byOrder);
    const carts: ICart[] = [];
    for (const order of orders) {
      const orderOwners = owners.filter(
        (owner) => owner.ecommerceModuleOrderId === order.id,
      );
      const accountOwner = orderOwners.find(
        (owner) => owner.subjectId === subjectId,
      );
      const owner =
        accountOwner ??
        orderOwners.find((owner) => owner.subjectId === guestId);
      const editable =
        orderOwners.length === 1 &&
        !payments.some((payment) => payment.orderId === order.id);
      if (!owner || (!accountOwner && !editable)) {
        continue;
      }
      carts.push({
        id: order.id,
        guest: !accountOwner,
        owner,
        editable,
        lines: lines.filter((line) => line.orderId === order.id),
      });
    }
    return carts;
  }

  private findOpenOrders(ids: string[]): Promise<IOrder[]> {
    return this.service.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ids },
            { column: "type", method: "eq", value: "cart" },
            { column: "status", method: "eq", value: "new" },
          ],
        },
      },
    });
  }

  private async merge(carts: ICart[], subjectId: string) {
    const { ecommerceModule, subjectsToEcommerceModuleOrders } = this.service;
    // Leave a guest order intact if an overlapping account order is already in
    // payment or shared. Its lines, store and currency must stay together.
    const protectedProducts = new Set(
      carts
        .filter((cart) => !cart.editable)
        .flatMap((cart) => cart.lines.map((line) => line.productId)),
    );
    const editableCarts = carts.filter(
      (cart) =>
        cart.editable &&
        (!cart.guest ||
          !cart.lines.some((line) => protectedProducts.has(line.productId))),
    );
    const incoming = new Set(
      editableCarts
        .filter((cart) => cart.guest)
        .flatMap((cart) => cart.lines.map((line) => line.productId)),
    );
    if (!incoming.size) {
      return;
    }
    const winners = new Map<string, ILine>();
    // Read account rows first so identical timestamps retain the account's choice.
    for (const cart of [...editableCarts].sort(
      (left, right) => Number(left.guest) - Number(right.guest),
    )) {
      for (const line of cart.lines) {
        if (!incoming.has(line.productId)) {
          continue;
        }
        const winner = winners.get(line.productId);
        if (
          !winner ||
          new Date(line.updatedAt).getTime() >
            new Date(winner.updatedAt).getTime()
        ) {
          winners.set(line.productId, line);
        }
      }
    }
    for (const cart of editableCarts) {
      if (!cart.lines.length) {
        continue;
      }
      let retained = 0;
      for (const line of cart.lines) {
        const duplicate =
          incoming.has(line.productId) &&
          winners.get(line.productId)?.id !== line.id;
        if (duplicate) {
          await ecommerceModule.ordersToProducts.delete({ id: line.id });
        } else {
          retained++;
        }
      }
      if (!retained) {
        await ecommerceModule.order.delete({ id: cart.id });
      } else if (cart.guest) {
        const owner = await subjectsToEcommerceModuleOrders.update({
          id: cart.owner.id,
          data: { ...cart.owner, subjectId },
        });
        if (!owner) {
          throw new Error(
            "Conflict error. Guest cart owner changed during sign-in",
          );
        }
      }
    }
  }
}

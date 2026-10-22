import type { IArticleContentAccess } from "@sps/rbac/models/subject/sdk/model";
import { Service as Graph } from "./graph";
export interface IExecuteProps {
  subjectId?: string;
  articleId: string;
  now?: Date;
  operator?: boolean;
}
export class Service {
  constructor(readonly graph: Graph) {}
  async execute(props: IExecuteProps): Promise<IArticleContentAccess> {
    if (props.operator)
      return {
        state: "granted",
        expiresAt: new Date(8640000000000000).toISOString(),
      };
    if (!props.subjectId) return { state: "guest", expiresAt: null };
    const subjectId = props.subjectId;
    const identities = await this.graph.find("rbac/subjects-to-identities", [
      { column: "subjectId", method: "eq", value: subjectId },
    ]);
    const guestPrincipal = !identities.some(
      (link) => link.subjectId === subjectId,
    );
    const requirements = await this.graph.find(
      "blog/articles-to-ecommerce-module-products",
      [
        { column: "articleId", method: "eq", value: props.articleId },
        { column: "variant", method: "eq", value: "subscription" },
      ],
    );
    if (!requirements.length)
      return { state: guestPrincipal ? "guest" : "locked", expiresAt: null };
    const [grants, ownerLinks] = await Promise.all([
      this.graph.find("rbac/subjects-to-roles", [
        { column: "subjectId", method: "eq", value: subjectId },
      ]),
      this.graph.find("rbac/subjects-to-ecommerce-module-orders", [
        { column: "subjectId", method: "eq", value: subjectId },
      ]),
    ]);
    const roles = new Set(
      grants
        .filter((link) => link.subjectId === subjectId)
        .map((link) => link.roleId),
    );
    const orderIds = ownerLinks
      .filter((link) => link.subjectId === subjectId)
      .map((link) => link.ecommerceModuleOrderId)
      .filter((id): id is string => typeof id === "string");
    if (!orderIds.length)
      return { state: guestPrincipal ? "guest" : "locked", expiresAt: null };
    const orders = await this.graph.find("ecommerce/orders", [
      { column: "id", method: "inArray", value: orderIds },
    ]);
    const lines = await this.graph.find("ecommerce/orders-to-products", [
      { column: "orderId", method: "inArray", value: orderIds },
    ]);
    const now = (props.now || new Date()).getTime();
    let expiry = 0;
    let expired = false;
    for (const requirement of requirements) {
      const productId = requirement.ecommerceModuleProductId;
      if (typeof productId !== "string") continue;
      const product = await this.graph.services["ecommerce/products"].findById({
        id: productId,
      });
      if (product?.type !== "subscription") continue;
      const productRoles = await this.graph.find(
        "rbac/roles-to-ecommerce-module-products",
        [
          {
            column: "ecommerceModuleProductId",
            method: "eq",
            value: productId,
          },
        ],
      );
      if (
        !productRoles.length ||
        productRoles.some((role) => !roles.has(role.roleId))
      )
        continue;
      for (const order of orders) {
        if (
          !orderIds.includes(order.id) ||
          order.type !== "history" ||
          !["delivering", "requested_cancelation"].includes(
            String(order.status),
          ) ||
          !lines.some(
            (line) => line.orderId === order.id && line.productId === productId,
          ) ||
          !order.subscriptionPeriodInvoiceId ||
          order.subscriptionRevokedAt
        )
          continue;
        const checkout =
          this.graph.services["ecommerce/orders"].findByIdCheckoutAttributes;
        if (!checkout)
          throw new Error(
            "Permission error. Subscription checkout cannot be verified",
          );
        if (
          (
            await checkout.call(this.graph.services["ecommerce/orders"], {
              id: order.id,
            })
          )?.type !== "subscription"
        )
          continue;
        const [start, end] = [
          order.subscriptionPeriodStartsAt,
          order.subscriptionPeriodEndsAt,
        ].map((value) => {
          if (value instanceof Date) return value.getTime();
          if (typeof value === "number") return new Date(value).getTime();
          if (
            typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(
              value,
            )
          )
            return Number.NaN;
          const timestamp = new Date(value).getTime();
          const dateLength = value.length === 10 ? 10 : 19;
          return Number.isFinite(timestamp) &&
            new Date(timestamp).toISOString().slice(0, dateLength) ===
              value.slice(0, dateLength)
            ? timestamp
            : Number.NaN;
        });
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
          continue;
        if (now >= end) {
          expired = true;
          continue;
        }
        if (now < start) continue;
        expiry = Math.max(expiry, end);
      }
    }
    return expiry
      ? { state: "granted", expiresAt: new Date(expiry).toISOString() }
      : {
          state: expired ? "expired" : guestPrincipal ? "guest" : "locked",
          expiresAt: null,
        };
  }
}

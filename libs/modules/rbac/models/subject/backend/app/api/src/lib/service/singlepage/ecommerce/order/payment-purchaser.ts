import type { IEcommerceModule, ISocialModule } from "../../../../di";
import type { Service as Purchasers } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export interface IConstructorProps {
  purchasers: Pick<Purchasers, "find" | "create">;
  ecommerceModule: Pick<
    IEcommerceModule,
    "ordersToBillingModulePaymentIntents"
  >;
  socialModule: Pick<ISocialModule, "profilesToEcommerceModuleOrders">;
}

/** Resolves the account recorded when payment was created, independently of profile managers. */
export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async assign(props: { subjectId: string; paymentIntentId: string }) {
    const links = await this.dependencies.purchasers.find({
      params: {
        filters: {
          and: [
            { column: "variant", method: "eq", value: "purchaser" },
            {
              column: "billingModulePaymentIntentId",
              method: "eq",
              value: props.paymentIntentId,
            },
          ],
        },
      },
    });
    if (
      links.length > 1 ||
      links.some((link) => link.subjectId !== props.subjectId)
    ) {
      throw new Error("Conflict error. PaymentIntent purchaser is ambiguous");
    }
    if (!links.length) {
      await this.dependencies.purchasers.create({
        data: {
          variant: "purchaser",
          subjectId: props.subjectId,
          billingModulePaymentIntentId: props.paymentIntentId,
        },
      });
    }
  }

  async resolveOrder(orderId: string) {
    const [owners, intents] = await Promise.all([
      this.dependencies.socialModule.profilesToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleOrderId",
                method: "eq",
                value: orderId,
              },
            ],
          },
        },
      }),
      this.dependencies.ecommerceModule.ordersToBillingModulePaymentIntents.find(
        {
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: orderId }],
            },
          },
        },
      ),
    ]);
    if (owners.length !== 1 || !owners[0].profileId || !intents.length) {
      throw new Error(
        "Conflict error. Order profile or payment is missing or ambiguous",
      );
    }
    const intentIds = [
      ...new Set<string>(
        intents.map((link) => link.billingModulePaymentIntentId),
      ),
    ];
    const purchasers = await this.dependencies.purchasers.find({
      params: {
        filters: {
          and: [
            { column: "variant", method: "eq", value: "purchaser" },
            {
              column: "billingModulePaymentIntentId",
              method: "inArray",
              value: intentIds,
            },
          ],
        },
      },
    });
    for (const intentId of intentIds) {
      const matching = purchasers.filter(
        (link) => link.billingModulePaymentIntentId === intentId,
      );
      if (matching.length !== 1 || !matching[0].subjectId) {
        throw new Error(
          "Conflict error. PaymentIntent purchaser is missing or ambiguous",
        );
      }
    }
    const subjectIds = [...new Set(purchasers.map((link) => link.subjectId))];
    if (subjectIds.length !== 1) {
      throw new Error(
        "Conflict error. Order payments have different purchasers",
      );
    }
    return {
      subjectId: subjectIds[0],
      profileId: owners[0].profileId as string,
      ecommerceModuleOrderId: orderId,
    };
  }

  async orderIdsForSubject(subjectId: string): Promise<string[]> {
    const ids = new Set<string>();
    let offset = 0;
    let hasMore = true;
    const limit = 100;
    while (hasMore) {
      const purchasers = await this.dependencies.purchasers.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: subjectId },
              { column: "variant", method: "eq", value: "purchaser" },
            ],
          },
          limit,
          offset,
          orderBy: { and: [{ column: "id", method: "asc" }] },
        },
      });
      const intentIds = purchasers
        .filter(
          (link) =>
            link.subjectId === subjectId && link.variant === "purchaser",
        )
        .map((link) => link.billingModulePaymentIntentId);
      if (intentIds.length) {
        let orderOffset = 0;
        let hasMoreOrders = true;
        while (hasMoreOrders) {
          const links =
            await this.dependencies.ecommerceModule.ordersToBillingModulePaymentIntents.find(
              {
                params: {
                  filters: {
                    and: [
                      {
                        column: "billingModulePaymentIntentId",
                        method: "inArray",
                        value: intentIds,
                      },
                    ],
                  },
                  limit,
                  offset: orderOffset,
                  orderBy: { and: [{ column: "id", method: "asc" }] },
                },
              },
            );
          for (const link of links) {
            if (intentIds.includes(link.billingModulePaymentIntentId)) {
              ids.add(link.orderId);
            }
          }
          hasMoreOrders = links.length === limit;
          orderOffset += limit;
        }
      }
      hasMore = purchasers.length === limit;
      offset += limit;
    }
    return [...ids];
  }
}

import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  sourceSubjectId: string;
  subjectId: string;
  socialModuleProfileId?: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async execute(props: IExecuteProps): Promise<void> {
    if (props.sourceSubjectId === props.subjectId) {
      return;
    }
    await this.service.repository.withSubjectLock(
      { subjectId: props.sourceSubjectId },
      async () => {
        const source = await this.service.findById({
          id: props.sourceSubjectId,
        });
        const identities = await this.service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.sourceSubjectId,
                },
              ],
            },
            limit: 1,
          },
        });
        if (
          !source ||
          !["default", "anonymous"].includes(source.variant) ||
          identities.length
        ) {
          throw new Error(
            "Permission error. Only an authenticated guest session can transfer a cart",
          );
        }
        const sourceProfiles =
          await this.service.subjectsToSocialModuleProfiles.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: props.sourceSubjectId,
                  },
                ],
              },
            },
          });
        if (!sourceProfiles.length) {
          return;
        }
        const sourceProfileIds = [
          ...new Set(sourceProfiles.map((link) => link.socialModuleProfileId)),
        ];
        if (sourceProfileIds.length !== 1) {
          throw new Error(
            "Data integrity error. Guest must have one personal profile",
          );
        }
        const sourceProfileId = sourceProfileIds[0];
        let targetProfileId = props.socialModuleProfileId;
        if (!targetProfileId) {
          const ownership =
            await this.service.socialModuleProfileOwnershipEnsure({
              subjectId: props.subjectId,
            });
          targetProfileId = ownership.profile.id;
        }
        targetProfileId = await this.service.ecommerceModuleResolveProfile({
          subjectId: props.subjectId,
          socialModuleProfileId: targetProfileId,
        });
        if (sourceProfileId === targetProfileId) {
          return;
        }
        await this.service.repository.withProfilesLock(
          { profileIds: [sourceProfileId, targetProfileId] },
          async () => {
            const owners =
              this.service.socialModule.profilesToEcommerceModuleOrders;
            const links = await owners.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "profileId",
                      method: "inArray",
                      value: [sourceProfileId, targetProfileId],
                    },
                  ],
                },
              },
            });
            if (!links.length) {
              return;
            }
            const orders = await this.service.ecommerceModule.order.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: links.map((link) => link.ecommerceModuleOrderId),
                    },
                    { column: "type", method: "eq", value: "cart" },
                    { column: "status", method: "eq", value: "new" },
                  ],
                },
              },
            });
            if (!orders.length) {
              return;
            }
            const lines =
              await this.service.ecommerceModule.ordersToProducts.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "orderId",
                        method: "inArray",
                        value: orders.map((order) => order.id),
                      },
                    ],
                  },
                },
              });
            const sourceOrders = new Set(
              links
                .filter((link) => link.profileId === sourceProfileId)
                .map((link) => link.ecommerceModuleOrderId),
            );
            const winners = new Map<string, (typeof lines)[number]>();
            // Read target first: exact timestamp ties keep its current quantity.
            const sortedLines = [...lines].sort((left, right) => {
              const sourceDifference =
                Number(sourceOrders.has(left.orderId)) -
                Number(sourceOrders.has(right.orderId));
              return sourceDifference || left.id.localeCompare(right.id);
            });
            for (const line of sortedLines) {
              const winner = winners.get(line.productId);
              if (
                !winner ||
                new Date(line.createdAt).getTime() >
                  new Date(winner.createdAt).getTime()
              ) {
                winners.set(line.productId, line);
              }
            }
            const retainedIds = new Set(
              [...winners.values()].map((line) => line.id),
            );
            for (const line of lines) {
              if (!retainedIds.has(line.id)) {
                await this.service.ecommerceModule.ordersToProducts.delete({
                  id: line.id,
                });
              }
            }
            for (const order of orders) {
              const retained = lines.some(
                (line) => line.orderId === order.id && retainedIds.has(line.id),
              );
              if (!retained) {
                await this.service.ecommerceModule.order.delete({
                  id: order.id,
                });
                continue;
              }
              if (sourceOrders.has(order.id)) {
                const owner = links.find(
                  (link) => link.ecommerceModuleOrderId === order.id,
                );
                if (!owner) {
                  throw new Error(
                    "Data integrity error. Cart owner is missing",
                  );
                }
                await owners.update({
                  id: owner.id,
                  data: { profileId: targetProfileId },
                });
              }
            }
          },
        );
      },
    );
  }
}

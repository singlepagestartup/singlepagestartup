import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export const SUBJECT_DOES_NOT_OWN_ORDER_ERROR =
  "Permission error. Only order owner can read order";

export type IExecuteProps = {
  subjectId: string;
  ecommerceModuleOrderId: string;
};

type IConstructorProps = {
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
};

/**
 * Asserts that a subject owns an ecommerce order.
 *
 * Knowing that the caller is the subject named in the path is not the same as
 * knowing that the order in the path is theirs. Every per-order route needs
 * both, so the relation lookup lives here instead of being written out again in
 * each handler.
 */
export class Service {
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  async execute(props: IExecuteProps): Promise<void> {
    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectId,
              },
              {
                column: "ecommerceModuleOrderId",
                method: "eq",
                value: props.ecommerceModuleOrderId,
              },
            ],
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      throw new Error(SUBJECT_DOES_NOT_OWN_ORDER_ERROR);
    }
  }
}

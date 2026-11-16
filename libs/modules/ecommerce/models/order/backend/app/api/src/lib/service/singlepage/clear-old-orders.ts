import { FindServiceProps } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

export type IExecuteProps = {};

type IConstructorProps = {
  find: (props?: FindServiceProps) => Promise<any[]>;
  deleteCanceledWithoutPayment: (props: {
    id: string;
    createdBefore: Date;
  }) => Promise<unknown>;
};

export class Service {
  find: IConstructorProps["find"];
  deleteCanceledWithoutPayment: IConstructorProps["deleteCanceledWithoutPayment"];

  constructor(props: IConstructorProps) {
    this.find = props.find;
    this.deleteCanceledWithoutPayment = props.deleteCanceledWithoutPayment;
  }

  async execute(_props: IExecuteProps) {
    try {
      void _props;

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
      }

      const createdBefore = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
      const oldOrders = await this.find({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: createdBefore,
              },
              {
                column: "status",
                method: "eq",
                value: "canceled",
              },
              {
                column: "paymentFailureCanceledAt",
                method: "isNull",
                value: "",
              },
            ],
          },
        },
      });

      if (oldOrders?.length) {
        for (const oldOrder of oldOrders) {
          await this.deleteCanceledWithoutPayment({
            id: oldOrder.id,
            createdBefore,
          });
        }
      }
    } catch (error) {
      logger.error("clearOldOrders", error);
    }
  }
}

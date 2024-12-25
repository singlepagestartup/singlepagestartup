import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import {
  Service as ClearOldOrders,
  IExecuteProps as IClearOldOrdersExecuteProps,
} from "./clear-old-orders";
import {
  Service as CheckoutAttributes,
  IExecuteProps as ICheckoutAttributesExecuteProps,
} from "./checkout-attributes";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async clearOldOrders(props: IClearOldOrdersExecuteProps) {
    return new ClearOldOrders(this.repository).execute(props);
  }

  async getCheckoutAttributes(props: ICheckoutAttributesExecuteProps) {
    return new CheckoutAttributes(this.repository).execute(props);
  }
}

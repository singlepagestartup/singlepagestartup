import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import {
  Service as GetTotal,
  type IExecuteProps as IGetTotalExecuteProps,
} from "./get-total";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async getTotal(props: IGetTotalExecuteProps) {
    return new GetTotal(this.repository).execute(props);
  }
}

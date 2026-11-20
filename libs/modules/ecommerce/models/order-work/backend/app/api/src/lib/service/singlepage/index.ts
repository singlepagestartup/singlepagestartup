import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order-work/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  async byOrder(orderId: string) {
    const rows = await this.find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    return rows.at(0);
  }

  add(data: typeof Table.$inferInsert) {
    return this.insert(data);
  }

  revise(id: string, data: Partial<typeof Table.$inferInsert>) {
    return this.repository.updateFirstByField("id", id, data) as Promise<
      typeof Table.$inferSelect
    >;
  }

  undeliveredPayments(limit: number) {
    return (this.repository as Repository).undeliveredPayments(limit);
  }

  missingPayments(limit: number) {
    return (this.repository as Repository).missingPayments(limit);
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Register order work through Order");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Register order work through Order");
  }

  override async update(): Promise<never> {
    throw new Error(
      "Forbidden error. Update order work through Order commands",
    );
  }

  override async delete(): Promise<never> {
    throw new Error("Forbidden error. Order work history is retained");
  }
}

import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository, type IRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  override insert(data: Record<string, unknown>) {
    if (data.createdAt !== undefined)
      throw new Error("Validation error. Invoice createdAt is server assigned");
    return super.insert({ ...data });
  }

  private async immutableData(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
  ) {
    const writable = { ...data };
    if (writable.createdAt !== undefined) {
      const record = await this.findFirstByField(field, value);
      if (
        !record ||
        writable.createdAt == null ||
        new Date(writable.createdAt as string).getTime() !==
          new Date(record.createdAt).getTime()
      )
        throw new Error("Validation error. Invoice createdAt is immutable");
      delete writable.createdAt;
    }
    return writable;
  }

  override async updateFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
  ) {
    const immutableData = await this.immutableData(field, value, data);

    return super.updateFirstByField(field, value, immutableData);
  }

  override async consumeFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
    predicate?: Parameters<IRepository["consumeFirstByField"]>[3],
  ) {
    const immutableData = await this.immutableData(field, value, data);

    return super.consumeFirstByField(field, value, immutableData, predicate);
  }
}

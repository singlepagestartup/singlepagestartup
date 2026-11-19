import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/funnel-publication/backend/repository/database";

import type { IPage, IPageInput } from "@sps/crm/models/funnel/sdk/model";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  async page(
    funnelId: string,
    { limit = 50, cursor }: IPageInput,
  ): Promise<IPage<typeof Table.$inferSelect>> {
    const predicates: {
      column: string;
      method: "eq" | "lt";
      value: string | number;
    }[] = [{ column: "funnelId", method: "eq", value: funnelId }];
    if (cursor) {
      const version = Number(cursor);
      if (
        !/^[1-9]\d*$/.test(cursor) ||
        !Number.isSafeInteger(version) ||
        version > 2_147_483_647
      ) {
        throw new Error("Validation error. Invalid publication cursor");
      }
      predicates.push({ column: "version", method: "lt", value: version });
    }
    const rows = await this.find({
      params: {
        filters: { and: predicates },
        orderBy: { and: [{ column: "version", method: "desc" }] },
        limit: limit + 1,
      },
    });
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    let nextCursor: string | null = null;
    if (last && rows.length > limit) {
      nextCursor = String(last.version);
    }
    return { items, nextCursor };
  }

  async byVersion(funnelId: string, version: number) {
    const [row] = await this.find({
      params: {
        filters: {
          and: [
            { column: "funnelId", method: "eq", value: funnelId },
            { column: "version", method: "eq", value: version },
          ],
        },
      },
    });
    return row;
  }

  async byOperation(funnelId: string, operationKey: string) {
    const [row] = await this.find({
      params: {
        filters: {
          and: [
            { column: "funnelId", method: "eq", value: funnelId },
            { column: "operationKey", method: "eq", value: operationKey },
          ],
        },
      },
    });
    return row;
  }

  append(data: typeof Table.$inferInsert) {
    return this.insert(data);
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Publish the funnel to add a publication");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Publish the funnel to add a publication");
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Funnel publications are immutable");
  }

  override async delete(): Promise<never> {
    throw new Error("Forbidden error. Funnel publications are immutable");
  }
}

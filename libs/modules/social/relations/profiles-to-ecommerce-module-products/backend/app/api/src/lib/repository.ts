import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/repository/database";
import { Table as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/backend/repository/database";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";

export interface IStoreExpertScope {
  storeId: string;
  productId: string | null;
  offerId: string | null;
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async resolveStoreExpert(scope: IStoreExpertScope) {
    await this.trackRead({
      and: [
        { column: "storeId", method: "eq", value: scope.storeId },
        { column: "variant", method: "eq", value: "store-expert" },
      ],
    });
    if (scope.productId) {
      await trackRepositoryRead(CategoriesToProducts, this.db, {
        and: [{ column: "productId", method: "eq", value: scope.productId }],
      });
    }
    const offer = scope.offerId
      ? and(
          eq(Table.offerId, scope.offerId),
          isNull(Table.ecommerceModuleProductId),
          isNull(Table.categoryId),
        )
      : sql`false`;
    const product = scope.productId
      ? and(
          eq(Table.ecommerceModuleProductId, scope.productId),
          isNull(Table.offerId),
          isNull(Table.categoryId),
        )
      : sql`false`;
    const category = scope.productId
      ? and(
          isNull(Table.offerId),
          isNull(Table.ecommerceModuleProductId),
          inArray(
            Table.categoryId,
            this.db
              .select({ id: CategoriesToProducts.categoryId })
              .from(CategoriesToProducts)
              .where(eq(CategoriesToProducts.productId, scope.productId)),
          ),
        )
      : sql`false`;
    const priority =
      sql<number>`case when ${offer} then 1 when ${product} then 2 else 3 end`.as(
        "priority",
      );
    const [first, second] = await this.db
      .selectDistinct({ profileId: Table.profileId, priority })
      .from(Table)
      .where(
        and(
          eq(Table.storeId, scope.storeId),
          eq(Table.variant, "store-expert"),
          or(offer, product, category),
        ),
      )
      .orderBy(priority)
      .limit(2);

    const conflict = first !== undefined && first.priority === second?.priority;
    return { conflict, profileId: conflict ? undefined : first?.profileId };
  }
}

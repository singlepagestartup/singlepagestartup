import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI, type ISeedResult } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
import type { Repository as OfferRepository } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/repository";
import type { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Repository } from "../../repository";
import { OfferLinksDI } from "../../di";

@injectable()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  constructor(
    @inject(DI.IRepository) readonly repository: Repository,
    @inject(OfferLinksDI.IOfferReader)
    readonly offers: Pick<OfferRepository, "find">,
    @inject(OfferLinksDI.IProductsService)
    readonly products: Pick<CRUDService<typeof Product.$inferSelect>, "find">,
  ) {
    super(repository);
  }

  private async assertLink(data: typeof Table.$inferInsert) {
    await this.repository.lockTargetService(data.targetOfferId);
    await this.repository.lockOfferProducts([
      data.sourceOfferId,
      data.targetOfferId,
    ]);
    const offers = await this.offers.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: [data.sourceOfferId, data.targetOfferId],
            },
          ],
        },
      },
    });
    const source = offers.find((offer) => offer.id === data.sourceOfferId);
    const target = offers.find((offer) => offer.id === data.targetOfferId);
    const products = await this.products.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: offers.map((offer) => offer.productId),
            },
          ],
        },
      },
    });
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    if (
      !source ||
      !target ||
      !productById.has(source.productId) ||
      source.id === target.id ||
      (source.variant !== "default" &&
        (source.variant !== "hidden" || data.variant === "fulfilled-by")) ||
      productById.get(target.productId)?.kind !== "service"
    ) {
      throw new Error("Validation error. Invalid source offer or service");
    }
    if (data.variant === "fulfilled-by") {
      if (
        target.variant !== "provider" ||
        source.productId !== target.productId
      ) {
        throw new Error(
          "Validation error. Provider must fulfill the same service product",
        );
      }
    } else if (target.variant !== "default") {
      throw new Error(
        "Validation error. Delivery and add-ons must be active service offers",
      );
    }
    if (data.variant !== "fulfilled-by") {
      const siblings = await this.offers.find({
        params: {
          filters: {
            and: [
              { column: "productId", method: "eq", value: source.productId },
            ],
          },
        },
      });
      const existing = await this.find({
        params: {
          filters: {
            and: [
              {
                column: "sourceOfferId",
                method: "inArray",
                value: siblings.map((offer) => offer.id),
              },
              { column: "targetOfferId", method: "eq", value: target.id },
            ],
          },
        },
      });
      if (
        existing.some(
          (link) =>
            link.id !== data.id &&
            (link.variant !== (data.variant ?? Table.variant.default) ||
              link.recurrence !==
                (data.recurrence ?? Table.recurrence.default)),
        )
      ) {
        throw new Error(
          "Validation error. Service role and recurrence must agree across offers for the same product",
        );
      }
    }
  }

  protected override async insert(data: typeof Table.$inferInsert) {
    return this.repository.withWriteLock(async () => {
      await this.assertLink(data);
      return super.insert(data);
    });
  }

  override async update(props: {
    id: string;
    data: typeof Table.$inferSelect;
  }) {
    return this.updateLink(props.id, props.data, () => super.update(props));
  }

  private async updateLink(
    id: string,
    data: Partial<typeof Table.$inferInsert>,
    write: () => Promise<typeof Table.$inferSelect | null>,
  ) {
    return this.repository.withWriteLock(async () => {
      const previous = await this.repository.lockById(id);
      if (!previous) {
        return null;
      }
      await this.assertLink({ ...previous, ...data });
      return write();
    });
  }

  override async seed(props?: { seeds: ISeedResult[] }) {
    return this.repository.seed(props, {
      insert: (data) => this.insert(data),
      update: (id, data) =>
        this.updateLink(id, data, () =>
          this.repository.updateFirstByField("id", id, data),
        ),
    });
  }
}

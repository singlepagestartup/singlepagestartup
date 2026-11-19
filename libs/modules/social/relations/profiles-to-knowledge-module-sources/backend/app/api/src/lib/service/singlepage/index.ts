import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-knowledge-module-sources/backend/repository/database";
import {
  EXPERT_ORDER_SPECIFICATION_LIMIT,
  EXPERT_ORDER_SPECIFICATION_MAX_BYTES,
} from "@sps/shared-utils";
import { z } from "zod";

const specificationScope = z.object({
  storeId: z.uuid(),
  offerId: z.uuid(),
  profileId: z.uuid(),
  knowledgeModuleSourceId: z.uuid(),
});

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  protected override async insert(data: Record<string, unknown>) {
    await this.assertSpecification(data);
    return super.insert(data);
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    const current = await this.findById({ id: props.id });
    if (current) {
      await this.assertSpecification({ ...current, ...props.data }, current.id);
    }
    return super.update(props);
  }

  private async assertSpecification(
    data: Record<string, unknown>,
    id?: string,
  ) {
    if (data.variant !== "product-specification") {
      return;
    }
    const scope = specificationScope.safeParse(data);
    if (!scope.success || data.projectId) {
      throw new Error(
        "Validation error. A product specification needs one store and offer",
      );
    }
    const { storeId, offerId, profileId, knowledgeModuleSourceId } = scope.data;
    const [offer, sources] = await Promise.all([
      this.modules.ecommerce.storesToProducts.findById({ id: offerId }),
      this.modules.knowledge.source.specificationSnapshots([
        knowledgeModuleSourceId,
      ]),
    ]);
    if (offer?.storeId !== storeId || offer.variant !== "default") {
      throw new Error(
        "Validation error. The specification offer does not belong to the store",
      );
    }
    if (!sources.length) {
      throw new Error(
        `Validation error. A product specification needs content within ${EXPERT_ORDER_SPECIFICATION_MAX_BYTES} bytes`,
      );
    }
    const linked = await this.find({
      params: {
        limit: EXPERT_ORDER_SPECIFICATION_LIMIT,
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "offerId", method: "eq", value: offerId },
            { column: "profileId", method: "eq", value: profileId },
            { column: "variant", method: "eq", value: "product-specification" },
            ...(id ? [{ column: "id", method: "ne" as const, value: id }] : []),
          ],
        },
      },
    });
    if (linked.length >= EXPERT_ORDER_SPECIFICATION_LIMIT) {
      throw new Error(
        `Validation error. The offer already has ${EXPERT_ORDER_SPECIFICATION_LIMIT} specifications for this expert`,
      );
    }
  }
}

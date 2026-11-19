import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { createModules } from "@sps/crm/backend/app/api/src/lib/modules";
import { Table } from "@sps/crm/models/funnel/backend/repository/database";
import {
  listFunnelsSchema,
  listPublicationsSchema,
  publishFunnelSchema,
  resolveFunnelSchema,
  saveDraftSchema,
  type IFunnelBindings,
  type IListFunnels,
  type IListPublications,
  type IPublishFunnel,
  type IResolveFunnel,
  type ISaveFunnelDraft,
} from "@sps/crm/models/funnel/sdk/model";
import { createModule } from "../module";
import type { Repository } from "../../repository";
import { validatePublication } from "./utils";

interface ISelection {
  storeId: string;
  productId?: string;
  offerId?: string;
  formId?: string;
}

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  private owner() {
    return this.repository as Repository;
  }

  async get(storeId: string, funnelId: string) {
    const funnel = await this.owner().scoped(storeId, funnelId);
    if (!funnel) {
      throw new Error("Not Found error. Funnel does not exist in this store");
    }
    return funnel;
  }

  async current(storeId: string, funnelId: string) {
    const funnel = await this.get(storeId, funnelId);
    if (funnel.publishedVersion === null) {
      throw new Error(
        "Conflict error. Publish the funnel before opening tasks",
      );
    }

    const publication = await this.module.funnelPublication.byVersion(
      funnel.id,
      funnel.publishedVersion,
    );
    if (!publication) {
      throw new Error("Internal error. The funnel publication is missing");
    }
    return publication;
  }

  async list(input: IListFunnels) {
    return this.owner().list(listFunnelsSchema.parse(input));
  }

  async listPublications(input: IListPublications) {
    const data = listPublicationsSchema.parse(input);
    const funnel = await this.get(data.storeId, data.funnelId);
    return this.module.funnelPublication.page(funnel.id, data);
  }

  assertApplicable(bindings: IFunnelBindings, input: ISelection) {
    if (
      (bindings.formIds.length ||
        bindings.offerIds.length ||
        bindings.productIds.length) &&
      !(input.formId && bindings.formIds.includes(input.formId)) &&
      !(input.offerId && bindings.offerIds.includes(input.offerId)) &&
      !(input.productId && bindings.productIds.includes(input.productId))
    ) {
      throw new Error(
        "Conflict error. The published funnel does not apply to this request",
      );
    }
  }

  async resolveSelection(input: ISelection) {
    const catalog = this.modules.ecommerce.storesToProducts;
    if (input.offerId) {
      const offer = await catalog.findById({ id: input.offerId });
      if (
        !offer ||
        offer.storeId !== input.storeId ||
        (input.productId && offer.productId !== input.productId)
      ) {
        throw new Error(
          "Not Found error. Offer does not match the store and product",
        );
      }
      return { offerId: offer.id, productId: offer.productId };
    }

    if (input.productId) {
      const [offer] = await catalog.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "storeId", method: "eq", value: input.storeId },
              { column: "productId", method: "eq", value: input.productId },
            ],
          },
        },
      });
      if (!offer) {
        throw new Error(
          "Not Found error. Product is unavailable in this store",
        );
      }
      return { offerId: undefined, productId: input.productId };
    }

    return { offerId: undefined, productId: undefined };
  }

  private async validateBindings(storeId: string, bindings: IFunnelBindings) {
    for (const productId of new Set(bindings.productIds)) {
      await this.resolveSelection({ storeId, productId });
    }
    for (const offerId of new Set(bindings.offerIds)) {
      await this.resolveSelection({ storeId, offerId });
    }
    for (const id of new Set(bindings.formIds)) {
      const form = await this.module.form.findById({ id });
      if (!form) {
        throw new Error("Not Found error. Funnel form does not exist");
      }
    }
  }

  async saveDraft(input: ISaveFunnelDraft) {
    const data = saveDraftSchema.parse(input);
    const owner = this.owner();

    return owner.transaction(async () => {
      const draft = {
        storeId: data.storeId,
        name: data.name,
        kind: data.kind,
        definition: data.definition,
        bindings: data.bindings,
        updatedAt: new Date(),
      };
      if (!data.funnelId) {
        if (data.expectedRevision !== undefined) {
          throw new Error(
            "Validation error. A new funnel has no draft revision",
          );
        }
        const store = await this.modules.ecommerce.store.findById({
          id: data.storeId,
        });
        if (!store) {
          throw new Error("Not Found error. Store does not exist");
        }

        await this.validateBindings(data.storeId, data.bindings);
        const saved = await owner.createDraft(draft);
        await this.module.funnelsToEcommerceModuleStores.create({
          data: { funnelId: saved.id, storeId: data.storeId },
        });
        return saved;
      }

      const current = await owner.scoped(data.storeId, data.funnelId, true);
      if (!current) {
        throw new Error("Not Found error. Funnel does not exist in this store");
      }
      if (current.revision !== data.expectedRevision) {
        throw new Error(
          "Conflict error. Reload the funnel before saving the draft",
        );
      }
      if (current.kind !== data.kind) {
        throw new Error(
          "Validation error. The funnel kind is fixed when the draft is created",
        );
      }

      await this.validateBindings(data.storeId, data.bindings);
      return owner.replaceDraft(current.id, {
        ...draft,
        revision: current.revision + 1,
      });
    });
  }

  async publish(input: IPublishFunnel) {
    const data = publishFunnelSchema.parse(input);
    const owner = this.owner();

    return owner.transaction(async () => {
      const funnel = await owner.scoped(data.storeId, data.funnelId, true);
      if (!funnel) {
        throw new Error("Not Found error. Funnel does not exist in this store");
      }

      const publications = this.module.funnelPublication;
      const previous = await publications.byOperation(
        funnel.id,
        data.operationKey,
      );
      if (previous) {
        if (
          previous.draftRevision !== data.expectedRevision ||
          previous.actorId !== data.actorId
        ) {
          throw new Error(
            "Conflict error. Publication operation key already belongs to another request",
          );
        }
        return previous;
      }
      if (funnel.revision !== data.expectedRevision) {
        throw new Error("Conflict error. Reload the funnel before publishing");
      }

      if (funnel.publishedVersion !== null) {
        const latest = await publications.byVersion(
          funnel.id,
          funnel.publishedVersion,
        );
        if (latest?.draftRevision === funnel.revision) {
          throw new Error(
            "Conflict error. This draft revision has already been published",
          );
        }
      }

      validatePublication(funnel.definition, funnel.kind);
      await this.validateBindings(funnel.storeId, funnel.bindings);
      const version = (funnel.publishedVersion ?? 0) + 1;
      const publication = await publications.append({
        funnelId: funnel.id,
        version,
        draftRevision: funnel.revision,
        name: funnel.name,
        kind: funnel.kind,
        definition: funnel.definition,
        bindings: funnel.bindings,
        actorId: data.actorId,
        operationKey: data.operationKey,
      });

      await this.module.funnelsToFunnelPublications.create({
        data: { funnelId: funnel.id, publicationId: publication.id },
      });
      await owner.replaceDraft(funnel.id, {
        publishedVersion: version,
        updatedAt: new Date(),
      });
      return publication;
    });
  }

  async resolveFormIntake(formId: string) {
    const matches = await this.owner().publishedForForm(formId);
    if (matches.length > 1) {
      throw new Error(
        "Conflict error. Multiple stores or workflows accept this form",
      );
    }
    return matches[0];
  }

  async resolve(input: IResolveFunnel) {
    const data = resolveFunnelSchema.parse(input);
    const { offerId, productId } = await this.resolveSelection(data);
    const publications = await this.owner().published(data.storeId, data.kind);
    const bySpecificity = [[], [], [], []] as (typeof publications)[];
    for (const candidate of publications) {
      const { bindings } = candidate.publication;
      if (data.formId && bindings.formIds.includes(data.formId)) {
        bySpecificity[0].push(candidate);
      } else if (offerId && bindings.offerIds.includes(offerId)) {
        bySpecificity[1].push(candidate);
      } else if (productId && bindings.productIds.includes(productId)) {
        bySpecificity[2].push(candidate);
      } else if (
        bindings.formIds.length === 0 &&
        bindings.offerIds.length === 0 &&
        bindings.productIds.length === 0
      ) {
        bySpecificity[3].push(candidate);
      }
    }

    const matches = bySpecificity.find((candidates) => candidates.length > 0);
    if (!matches) {
      return null;
    }
    if (matches.length > 1) {
      throw new Error(
        "Conflict error. Multiple published funnels match this selection",
      );
    }
    return matches[0].publication;
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Use saveDraft to create a funnel");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Use saveDraft to create a funnel");
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Use funnel commands to change a funnel");
  }

  override async delete(): Promise<never> {
    throw new Error(
      "Forbidden error. Funnel history requires a permanent record",
    );
  }
}

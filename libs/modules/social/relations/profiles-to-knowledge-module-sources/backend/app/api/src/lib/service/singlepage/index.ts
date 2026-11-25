import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-knowledge-module-sources/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  protected override async insert(data: Record<string, unknown>) {
    this.assertProfileScope(data);
    return super.insert(data);
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    const fields = [
      "profileId",
      "knowledgeModuleSourceId",
      "variant",
      "storeId",
      "offerId",
      "projectId",
    ] as const;
    if (fields.some((field) => props.data[field] !== undefined)) {
      const current = await this.findById({ id: props.id });
      if (current) {
        const changesScope = fields.some(
          (field) =>
            props.data[field] !== undefined &&
            props.data[field] !== current[field],
        );
        if (changesScope) {
          if (
            current.storeId ||
            current.offerId ||
            current.projectId ||
            current.variant === "customer-memory"
          ) {
            throw new Error(
              "Validation error. The access scope of an existing knowledge link must be preserved",
            );
          }
          this.assertProfileScope({ ...current, ...props.data });
        }
      }
    }
    return super.update(props);
  }

  private assertProfileScope(data: Record<string, unknown>) {
    if (
      data.variant === "product-specification" ||
      data.offerId ||
      (data.variant === "customer-memory"
        ? data.projectId && !data.storeId
        : data.storeId || data.projectId)
    ) {
      throw new Error(
        "Validation error. Link the knowledge source to the profile",
      );
    }
  }
}

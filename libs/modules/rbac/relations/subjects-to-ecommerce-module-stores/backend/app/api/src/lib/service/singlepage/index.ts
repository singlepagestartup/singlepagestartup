import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  bindAssistant(input: {
    subjectId: string;
    customerSubjectId: string;
    ecommerceModuleStoreId: string;
  }) {
    return this.insert({ ...input, variant: "assistant" });
  }

  override async create(props: { data: Partial<typeof Table.$inferInsert> }) {
    this.assertOrdinaryRole(props.data);
    return super.create(props);
  }

  override async findOrCreate(props: {
    data: Partial<typeof Table.$inferInsert>;
  }) {
    this.assertOrdinaryRole(props.data);
    return super.findOrCreate(props);
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    this.assertOrdinaryRole(props.data);
    const current = await this.findById({ id: props.id });
    if (current) {
      this.assertOrdinaryRole(current);
    }
    return super.update(props);
  }

  override async delete(props: { id: string }) {
    const current = await this.findById(props);
    if (current) {
      this.assertOrdinaryRole(current);
    }
    return super.delete(props);
  }

  private assertOrdinaryRole(data: Partial<typeof Table.$inferSelect>) {
    if (data.variant === "assistant" || data.customerSubjectId) {
      throw new Error(
        "Forbidden error. Store assistants are managed by customer work",
      );
    }
  }
}

import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  protected override async insert(data: typeof Table.$inferInsert) {
    const owner = this.repository as Repository;
    return owner.transaction(async () => {
      await owner.lockTask(data.taskId);
      const primary = await owner.primary(data.taskId);
      const storeId = await owner.funnelStore(data.funnelId);
      if (!storeId || (primary && primary.storeId !== storeId)) {
        throw new Error(
          "Validation error. Funnel and task must belong to the same store",
        );
      }
      const variant = primary ? "related" : "primary";
      if (data.variant !== undefined && data.variant !== variant) {
        throw new Error("Conflict error. Each task has one executing funnel");
      }
      return super.insert({ ...data, variant });
    });
  }

  override async findOrCreate(props: { data: typeof Table.$inferInsert }) {
    const owner = this.repository as Repository;
    return owner.transaction(async () => {
      await owner.lockTask(props.data.taskId);
      return super.findOrCreate(props);
    });
  }

  override async update(): Promise<never> {
    throw new Error(
      "Validation error. Remove the related funnel and attach its replacement",
    );
  }

  override async delete(props: { id: string }) {
    const owner = this.repository as Repository;
    return owner.transaction(async () => {
      const link = await owner.lockLink(props.id);
      if (link?.variant === "primary") {
        throw new Error(
          "Conflict error. The executing funnel must remain attached",
        );
      }
      return super.delete(props);
    });
  }
}

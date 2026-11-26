import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/funnels-to-stages/backend/repository/database";

import { createService as createFunnel } from "@sps/crm/models/funnel/backend/app/api/src/lib/bootstrap";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  private get funnel() {
    return createFunnel(this.appAssembly);
  }

  protected override insert(data: typeof Table.$inferInsert) {
    return this.funnel.editStages([data.funnelId], () => super.insert(data));
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    const previous = await this.findById({ id: props.id });
    if (!previous) {
      return null;
    }
    const ids = [previous.funnelId, props.data.funnelId ?? previous.funnelId];
    return this.funnel.editStages(ids, async () => {
      const locked = await this.findById({ id: props.id });
      if (locked?.funnelId !== previous.funnelId) {
        throw new Error("Conflict error. Funnel stage link has changed");
      }
      return super.update(props);
    });
  }

  override async delete(props: { id: string }) {
    const previous = await this.findById(props);
    if (!previous) {
      throw new Error("Not Found error. Funnel stage link does not exist");
    }
    return this.funnel.editStages([previous.funnelId], async () => {
      const locked = await this.findById(props);
      if (locked?.funnelId !== previous.funnelId) {
        throw new Error("Conflict error. Funnel stage link has changed");
      }
      return super.delete(props);
    });
  }
}

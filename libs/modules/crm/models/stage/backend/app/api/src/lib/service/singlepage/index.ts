import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/stage/backend/repository/database";

import { createService as createFunnel } from "@sps/crm/models/funnel/backend/app/api/src/lib/bootstrap";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    const funnel = createFunnel(this.appAssembly);
    return funnel.editLinkedStage(props.id, async (linked) => {
      if (linked && props.data.key !== undefined) {
        const existing = await this.findById({ id: props.id });
        if (existing?.key !== props.data.key) {
          throw new Error(
            "Conflict error. A linked stage keeps its workflow key",
          );
        }
      }
      return super.update(props);
    });
  }
}

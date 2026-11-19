import { createModule } from "../module";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  private async assertLoginIdentity(identityId: string | undefined) {
    if (identityId) {
      const identity = await this.module.identity.findById({ id: identityId });
      if (identity?.usage === "outbound_api") {
        throw new Error(
          "Permission error. An outbound credential cannot be used for sign-in",
        );
      }
    }
  }

  protected override async insert(data: any) {
    await this.assertLoginIdentity(data.identityId);
    return super.insert(data);
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    await this.assertLoginIdentity(props.data.identityId);
    return super.update(props);
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }
}

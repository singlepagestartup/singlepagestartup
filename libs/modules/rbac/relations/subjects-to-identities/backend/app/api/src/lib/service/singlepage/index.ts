import type { Repository } from "../../repository";
import { createModule } from "../module";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  setProviderAssignment(
    ...args: Parameters<Repository["setProviderAssignment"]>
  ) {
    return this.repository.setProviderAssignment(...args);
  }

  updateProviderConnection(
    ...args: Parameters<Repository["updateProviderConnection"]>
  ) {
    return this.repository.updateProviderConnection(...args);
  }

  createProviderConnection(
    ...args: Parameters<Repository["createProviderConnection"]>
  ) {
    return this.repository.createProviderConnection(...args);
  }

  providerAssignments(...args: Parameters<Repository["providerAssignments"]>) {
    return this.repository.providerAssignments(...args);
  }

  providerConnections(...args: Parameters<Repository["providerConnections"]>) {
    return this.repository.providerConnections(...args);
  }

  private assertLoginVariant(variant: unknown) {
    if (
      typeof variant === "string" &&
      [
        "provider-connection",
        "provider-default",
        "provider-assignment",
      ].includes(variant)
    ) {
      throw new Error(
        "Permission error. Provider identities are managed by their store owner",
      );
    }
  }

  private async assertLoginIdentity(identityId: string | undefined) {
    if (identityId) {
      const identity = await this.module.identity.findById({ id: identityId });
      if (!identity) {
        throw new Error(
          "Permission error. An inbound identity is required for sign-in",
        );
      }
    }
  }

  protected override async insert(data: any) {
    this.assertLoginVariant(data.variant);
    await this.assertLoginIdentity(data.identityId);
    return super.insert(data);
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    this.assertLoginVariant(props.data.variant);
    await this.assertLoginIdentity(props.data.identityId);
    const updated = await this.repository.consumeFirstByField(
      "id",
      props.id,
      props.data,
    );
    return updated ?? null;
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }
}

import { createModule } from "../module";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";
import type { Repository } from "../../repository";
type IGrant = typeof Table.$inferSelect;
export interface IFulfillmentGrant {
  id: string;
  subjectId: string;
  orderId: string;
}
export interface IRevocationDependencies {
  revoke(grant: IGrant): Promise<void>;
  canFulfill(grant: IGrant, scope: IFulfillmentGrant): Promise<boolean>;
}
@injectable()
@injectFromBase()
export class Service extends CRUDService<IGrant> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  private revocation?: IRevocationDependencies;
  configureRevocation(dependencies: IRevocationDependencies) {
    this.revocation = dependencies;
  }
  private configured() {
    if (!this.revocation) {
      throw new Error(
        "Configuration error. Subject role revocation is not configured",
      );
    }
    return this.revocation;
  }
  override async delete(props: { id: string }): Promise<IGrant> {
    const dependencies = this.configured();
    const before = await this.findById(props);
    if (!before) {
      return super.delete(props);
    }
    return (this.repository as Repository).withSubjectGrantTransaction(
      before.subjectId,
      async () => {
        const grant = await this.findById(props);
        if (!grant) {
          return super.delete(props);
        }
        if (grant.subjectId !== before.subjectId) {
          throw new Error(
            "Conflict error. Grant owner changed during revocation",
          );
        }
        await dependencies.revoke(grant);
        return super.delete(props);
      },
    );
  }
  override async update(props: {
    id: string;
    data: IGrant;
  }): Promise<IGrant | null> {
    const { subjectId, roleId } = props.data;
    if (subjectId === undefined && roleId === undefined) {
      return super.update(props);
    }
    const dependencies = this.configured();
    const before = await this.findById(props);
    if (!before) {
      return super.update(props);
    }
    return (this.repository as Repository).withSubjectGrantTransaction(
      before.subjectId,
      async () => {
        const grant = await this.findById(props);
        if (!grant) {
          return super.update(props);
        }
        if (grant.subjectId !== before.subjectId) {
          throw new Error(
            "Conflict error. Grant owner changed during reassignment",
          );
        }
        if (
          (subjectId !== undefined && subjectId !== grant.subjectId) ||
          (roleId !== undefined && roleId !== grant.roleId)
        ) {
          await dependencies.revoke(grant);
        }
        return super.update(props);
      },
    );
  }
  /** Internal fulfillment capability; no REST route or request flag invokes it. */
  async deleteForOrderFulfillment(scope: IFulfillmentGrant): Promise<IGrant> {
    const dependencies = this.configured();
    return (this.repository as Repository).withSubjectGrantTransaction(
      scope.subjectId,
      async () => {
        const grant = await this.findById({ id: scope.id });
        if (
          !grant ||
          grant.subjectId !== scope.subjectId ||
          !(await dependencies.canFulfill(grant, scope))
        ) {
          throw new Error(
            "Permission error. Owned order fulfillment scope could not be verified",
          );
        }
        return super.delete({ id: scope.id });
      },
    );
  }
}

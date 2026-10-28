import "reflect-metadata";
import { injectable } from "inversify";
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
export class Service extends CRUDService<IGrant> {
  private revocation?: IRevocationDependencies;
  configureRevocation(dependencies: IRevocationDependencies) {
    this.revocation = dependencies;
  }
  private configured() {
    if (!this.revocation)
      throw new Error(
        "Configuration error. Subject role revocation is not configured",
      );
    return this.revocation;
  }
  override async delete(props: { id: string }): Promise<IGrant> {
    const before = await this.findById(props);
    if (!before) return super.delete(props);
    const dependencies = this.configured();
    return (this.repository as Repository).withSubjectGrantTransaction(
      before.subjectId,
      async () => {
        const grant = await this.findById(props);
        if (!grant) return super.delete(props);
        if (grant.subjectId !== before.subjectId)
          throw new Error(
            "Conflict error. Grant owner changed during revocation",
          );
        await dependencies.revoke(grant);
        return super.delete(props);
      },
    );
  }
  override async update(props: {
    id: string;
    data: IGrant;
  }): Promise<IGrant | null> {
    const before = await this.findById(props);
    if (!before) return super.update(props);
    if (
      (props.data.subjectId === undefined ||
        props.data.subjectId === before.subjectId) &&
      (props.data.roleId === undefined || props.data.roleId === before.roleId)
    )
      return super.update(props);
    const dependencies = this.configured();
    return (this.repository as Repository).withSubjectGrantTransaction(
      before.subjectId,
      async () => {
        const grant = await this.findById(props);
        if (!grant) return super.update(props);
        if (grant.subjectId !== before.subjectId)
          throw new Error(
            "Conflict error. Grant owner changed during reassignment",
          );
        await dependencies.revoke(grant);
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
        )
          throw new Error(
            "Permission error. Owned order fulfillment scope could not be verified",
          );
        return super.delete({ id: scope.id });
      },
    );
  }
}

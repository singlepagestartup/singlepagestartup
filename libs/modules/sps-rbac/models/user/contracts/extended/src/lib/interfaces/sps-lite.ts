import { IRelation as IUsersToRoles } from "@sps/sps-rbac-relations-users-to-roles-contracts";
import { IRelation as IUsersToIdentities } from "@sps/sps-rbac-relations-users-to-identities-contracts";
import type { IModel as IParentModel } from "@sps/sps-rbac-models-user-contracts";

export interface IModel extends IParentModel {
  usersToRoles: IUsersToRoles[];
  usersToIdentities: IUsersToIdentities[];
}

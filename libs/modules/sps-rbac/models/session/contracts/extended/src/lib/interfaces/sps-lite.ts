import { IRelation as ISessionsToAuthentications } from "@sps/sps-rbac-relations-sessions-to-authentications-contracts";

import type { IModel as IParentModel } from "@sps/sps-rbac-models-session-contracts";

export interface IModel extends IParentModel {
  sessionsToAuthentications: ISessionsToAuthentications[];
}

import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IRelationExtended,
  host,
} from "@sps/sps-rbac/relations/subjects-to-sessions/frontend/api/model";

export const api = factory<IRelationExtended>({
  route,
  host,
});

import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IRelationExtended,
  host,
} from "@sps/sps-rbac/relations/widgets-to-authentication-blocks/frontend/api/model";

export const api = factory<IRelationExtended>({
  route,
  host,
});

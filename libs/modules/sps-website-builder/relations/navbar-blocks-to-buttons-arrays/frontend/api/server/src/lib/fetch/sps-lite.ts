import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IRelationExtended,
  host,
} from "@sps/sps-website-builder/relations/navbar-blocks-to-buttons-arrays/frontend/api/model";

export const api = factory<IRelationExtended>({
  route,
  host,
});

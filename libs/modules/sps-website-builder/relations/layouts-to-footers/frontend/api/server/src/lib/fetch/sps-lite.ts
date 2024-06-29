import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IRelationExtended,
  host,
} from "@sps/sps-website-builder/relations/layouts-to-footers/frontend/api/model";

export const api = factory<IRelationExtended>({
  route,
  host,
});

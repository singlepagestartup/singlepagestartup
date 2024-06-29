import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IRelationExtended,
  host,
} from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/frontend/api/model";

export const api = factory<IRelationExtended>({
  route,
  host,
});

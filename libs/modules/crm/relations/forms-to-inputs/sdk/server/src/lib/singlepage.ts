import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/crm/relations/forms-to-inputs/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});

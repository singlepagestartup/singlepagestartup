import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/crm/relations/widgets-to-forms/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});

import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import { action as me } from "./actions/me";
import { action as isAuthorized } from "./actions/is-authorized";
import { action as identities } from "./actions/identities";
import { action as ecommerceProductOneStepCheckout } from "./actions/ecommerce-product-one-step-checkout";
import { action as ecommerceOrdersUpdate } from "./actions/ecommerce-orders-update";
import { action as ecommerceOrdersDelete } from "./actions/ecommerce-orders-delete";
import { action as ecommerceOrdersCheckout } from "./actions/ecommerce-orders-checkout";
import { action as identitiesUpdate } from "./actions/identities-update";
import { action as identitiesCreate } from "./actions/identities-create";
import { action as identitiesDelete } from "./actions/identities-delete";

export const api = {
  ...factory<IModel>({
    route,
    host,
    options,
    params: query,
  }),
  me,
  isAuthorized,
  identities,
  ecommerceProductOneStepCheckout,
  identitiesUpdate,
  identitiesCreate,
  identitiesDelete,
  ecommerceOrdersUpdate,
  ecommerceOrdersDelete,
  ecommerceOrdersCheckout,
};

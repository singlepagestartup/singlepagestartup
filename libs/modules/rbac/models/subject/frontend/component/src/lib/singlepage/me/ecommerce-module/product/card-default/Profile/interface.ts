import type { ISpsComponentBase } from "@sps/ui-adapter";
/** authorFind selects allowlisted public sellers for the exact Product ID. */
export interface IProductAuthorProps extends ISpsComponentBase {
  ecommerceModuleProductId: string;
  language: string;
}

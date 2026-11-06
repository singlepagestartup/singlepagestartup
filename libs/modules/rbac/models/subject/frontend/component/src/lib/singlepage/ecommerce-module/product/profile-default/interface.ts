import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IResult } from "@sps/social/models/profile/sdk/server";
export const variant = "ecommerce-module-product-profile-default" as const;
/** authorFind reads allowlisted public sellers for this Product; no Subject session is used. */
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  ecommerceModuleProductId: string;
  language: string;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IResult["IAuthorFindResult"];
}

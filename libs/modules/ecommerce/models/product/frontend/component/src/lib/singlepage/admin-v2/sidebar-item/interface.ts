export { type IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-sidebar-item" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  className?: string;
  isActive?: boolean;
}

export interface IComponentPropsExtended extends IComponentProps {}

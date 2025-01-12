export { type IModel } from "@sps/ecommerce/models/order/sdk/model";
import { IModel } from "@sps/ecommerce/models/order/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "create" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  className?: string;
  successCallback?: (data: IModel) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}

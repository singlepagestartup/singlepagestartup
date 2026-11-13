export { type IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { Dispatch, SetStateAction } from "react";

export const variant = "amount" as const;

export interface IComponentProps
  extends Omit<IParentComponentProps<IModel, typeof variant>, "children"> {
  set?: Dispatch<SetStateAction<string | undefined>>;
  children?: ({ data }: { data: string | undefined }) => any;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

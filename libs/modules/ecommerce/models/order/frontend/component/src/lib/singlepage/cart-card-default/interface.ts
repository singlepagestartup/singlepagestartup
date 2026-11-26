import type { ReactNode } from "react";
import type {
  IModel,
  ICartDetails,
} from "@sps/ecommerce/models/order/sdk/model";
import type {
  IComponentProps as IParentProps,
  IComponentPropsExtended as IParentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "cart-card-default" as const;

export interface IComponentProps extends IParentProps<IModel, typeof variant> {
  language: string;
  cartDetails: ICartDetails | undefined;
  headerSlot?: ReactNode;
  priceLabel?: string;
  quantitySlots?: Record<string, ReactNode>;
  selectionSlots?: Record<string, ReactNode>;
  currencySlot?: ReactNode;
  removeSlot?: ReactNode;
}

export interface IComponentPropsExtended extends IParentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

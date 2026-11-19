export { type IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";
import type { IComponentProps as IParentComponentProps } from "@sps/shared-frontend-components/singlepage/default/interface";
import { ReactNode } from "react";

export const variant = "cart-default" as const;

export interface ICartProductData extends Pick<
  IModel,
  "id" | "slug" | "title" | "shortDescription" | "type"
> {}

export interface IComponentPropsExtended extends IParentComponentProps<
  ICartProductData,
  typeof variant
> {
  language: string;
  productHref?: string;
  priceSlot?: ReactNode;
  middleSlot?: ReactNode;
  children?: ReactNode;
}

interface IApiProps extends IComponentPropsExtended {
  dataSource?: "api";
  data: IModel;
}

interface IProvidedProps extends IComponentPropsExtended {
  dataSource: "props";
}

export type IComponentProps = IApiProps | IProvidedProps;

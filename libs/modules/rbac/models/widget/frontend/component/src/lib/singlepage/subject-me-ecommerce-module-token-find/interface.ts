import type { ReactNode } from "react";
import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "subject-me-ecommerce-module-token-find" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IContentProps {
  widgetId: string;
  isServer: boolean;
  language: string;
}

export interface IProductCardProps {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  language: string;
}

export interface ITokenTopupChoice {
  id: string;
  title: string;
  card: ReactNode;
}

export interface ITokenCatalogProps {
  language: string;
  proCard: ReactNode;
  topups: ITokenTopupChoice[];
}

export interface ITokenPackChoiceProps {
  id: string;
  title: string;
  name: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

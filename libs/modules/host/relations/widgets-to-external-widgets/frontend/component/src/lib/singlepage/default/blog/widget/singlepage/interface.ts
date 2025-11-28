import { IComponentProps as IArticleOverviewDefaultComponentProps } from "./article/overview/default/interface";
import { IComponentProps as IArticleOverviewEcommerceModuleProductListDefaultComponentProps } from "./article/overview/ecommerce-module-product-list-default/interface";
import { IComponentProps as IArticleOverviewWithPrivateContentDefaultComponentProps } from "./article/overview/with-private-content-default/interface";
import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview/default/interface";

export type IComponentProps =
  | IArticleOverviewDefaultComponentProps
  | IArticleOverviewEcommerceModuleProductListDefaultComponentProps
  | IArticleOverviewWithPrivateContentDefaultComponentProps
  | ICategoryOverviewDefaultComponentProps;

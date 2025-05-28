import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview-default/interface";
import { IComponentProps as IProductListDefaultComponentProps } from "./product/list/default/interface";
import { IComponentProps as IProductOverviewDefaultComponentProps } from "./product/overview/default/interface";
import { IComponentProps as IStoreListDefaultComponentProps } from "./store/list/default/interface";
import { IComponentProps as IStoreOverviewDefaultComponentProps } from "./store/overview/default/interface";

export type IComponentProps =
  | ICategoryOverviewDefaultComponentProps
  | IProductListDefaultComponentProps
  | IProductOverviewDefaultComponentProps
  | IStoreListDefaultComponentProps
  | IStoreOverviewDefaultComponentProps;

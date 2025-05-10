import { IComponentProps as IProductComponentProps } from "./product/interface";
import { IComponentProps as IOrderComponentProps } from "./order/interface";

export type IComponentProps = IProductComponentProps | IOrderComponentProps;

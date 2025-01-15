import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IListComponentProps } from "./list/interface";

export type IComponentProps = IDefaultComponentProps | IListComponentProps;

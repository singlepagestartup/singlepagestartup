import { IComponentProps as ISinglepageComponentProps } from "./singlepage/interface";
import { IComponentProps as IStartupComponentProps } from "./startup/interface";

export type IComponentProps =
  | ISinglepageComponentProps
  | IStartupComponentProps;

import { IComponentProps as ISpsLiteComponentProps } from "./singlepage/interface";
import { IComponentProps as IStartupComponentProps } from "./startup/interface";

export type IComponentProps =
  | Exclude<
      ISpsLiteComponentProps,
      { variant: IStartupComponentProps["variant"] }
    >
  | IStartupComponentProps;

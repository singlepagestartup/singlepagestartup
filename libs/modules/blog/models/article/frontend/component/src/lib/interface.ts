import type { ReactNode } from "react";
import type { IModel } from "@sps/blog/models/article/sdk/model";
import { IComponentProps as ISpsLiteComponentProps } from "./singlepage/interface";
import { IComponentProps as IStartupComponentProps } from "./startup/interface";

export type IComponentProps = ISpsLiteComponentProps | IStartupComponentProps;

export interface IAuthorSlotProps {
  data: IModel;
  size: "xs" | "sm";
  inverse?: boolean;
}
export type TRenderAuthor = (props: IAuthorSlotProps) => ReactNode;

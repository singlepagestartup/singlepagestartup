import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { CSSProperties, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

export interface IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> extends ISpsComponentBase {
  variant: V;
  data?: M;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  className?: string;

  // Admin-v2 form layout props.
  id?: string;
  module?: string;
  name?: string;
  type?: "model" | "relation";
  status?: "idle" | "pending" | "success" | "error";
  form?: UseFormReturn<any>;
  onSubmit?: (data: any) => void;
  style?: CSSProperties;
  panelDepth?: number;
  isTop?: boolean;
  children?: ReactNode;
}

export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  data?: M;
};

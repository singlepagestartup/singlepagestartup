import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

type IClientSubmitMode = {
  isServer: false;
  onSubmit: (data: any) => void;
};

type IAnySubmitMode = {
  isServer: boolean;
  onSubmit?: undefined;
};

type IComponentBaseProps<
  M extends { id?: string } = { id?: string },
  V = string,
> = Omit<ISpsComponentBase, "isServer"> & {
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
  panelDepth?: number;
  isTop?: boolean;
  children?: ReactNode;
};

export type IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> = IComponentBaseProps<M, V> & (IClientSubmitMode | IAnySubmitMode);

export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  data?: M;
};

import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<
  M extends { id: string } = { id: string },
  V = string,
> extends ISpsComponentBase {
  variant: V;
  data: Pick<M, "id">;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  className?: string;
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  relatedAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  type?: "model" | "relation";
  module: string;
  name: string;
}

export type IComponentPropsExtended<
  M extends { id: string } = { id: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  data: M;
};

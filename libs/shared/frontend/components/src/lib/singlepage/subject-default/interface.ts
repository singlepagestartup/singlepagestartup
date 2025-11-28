import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<M extends { id: string }, V>
  extends ISpsComponentBase {
  variant: V;
  data: M;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  children?: ReactNode;
  className?: string;
}

export type IComponentPropsExtended<
  M extends { id: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data: M;
};

import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindActionProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  variant: V;
  apiProps?: {
    params?: IFindActionProps["params"];
    options?: IFindActionProps["options"];
  };
  className?: string;
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
}

export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data: M[];
};

import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";

export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  variant: V;
  apiProps?: {
    params?: IFindProps["params"];
    options?: IFindProps["options"];
  };
  className?: string;
  type?: "model" | "relation";
  module?: string;
  name?: string;
  apiRoute: string;
  href: string;
}

export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data?: M[];
};

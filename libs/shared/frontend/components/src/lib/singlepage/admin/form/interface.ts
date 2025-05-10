import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";

export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  variant: V;
  data?: M;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  className?: string;
}

export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data?: M;
};

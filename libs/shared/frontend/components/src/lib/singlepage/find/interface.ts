import { Dispatch, SetStateAction } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";

export interface IComponentProps<M, V> extends ISpsComponentBase {
  variant: V;
  set?: Dispatch<SetStateAction<M[] | undefined>>;
  children?: ({ data }: { data: M[] | undefined }) => any;
  apiProps?: {
    params?: IFindProps["params"];
    options?: IFindProps["options"];
  };
}

export type IComponentPropsExtended<M, V, IComponentProps> = IComponentProps & {
  data: M;
};
